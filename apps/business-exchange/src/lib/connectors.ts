import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { ollama, type OllamaChatOptions } from './ollama';
import { createAuditLog } from './audit';
import { env } from './env';

export interface ConnectorConfig {
  ollama?: {
    baseUrl: string;
    defaultModel: string;
    timeout: number;
  };
  email?: {
    host: string;
    port: number;
    user: string;
    from: string;
  };
  webhook?: {
    url: string;
    secret: string;
    events: string[];
  };
  database?: {
    connectionString: string;
    poolSize: number;
  };
  api?: {
    baseUrl: string;
    apiKey: string;
    headers?: Record<string, string>;
  };
}

export interface ConnectorTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export class ConnectorManager {
  async getConnectors(userId: string) {
    return prisma.connector.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { syncLogs: { orderBy: { startedAt: 'desc' }, take: 5 } },
    });
  }

  async getConnector(id: string, userId: string) {
    return prisma.connector.findFirst({
      where: { id, userId },
      include: { syncLogs: { orderBy: { startedAt: 'desc' }, take: 20 } },
    });
  }

  async createConnector(userId: string, data: {
    name: string;
    type: 'OLLAMA' | 'EMAIL' | 'WEBHOOK' | 'DATABASE' | 'API';
    config: ConnectorConfig;
  }) {
    const connector = await prisma.connector.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        config: data.config as unknown as Prisma.InputJsonValue,
      },
    });

    await createAuditLog({
      userId,
      action: 'CONNECTOR_CREATED',
      entity: 'connector',
      entityId: connector.id,
      newData: { name: connector.name, type: connector.type },
    });

    return connector;
  }

  async updateConnector(id: string, userId: string, data: {
    name?: string;
    config?: ConnectorConfig;
    isEnabled?: boolean;
  }) {
    const existing = await prisma.connector.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Connector not found');

    const connector = await prisma.connector.update({
      where: { id },
      data: {
        name: data.name,
        config: data.config ? data.config as unknown as Prisma.InputJsonValue : undefined,
        isEnabled: data.isEnabled,
      },
    });

    await createAuditLog({
      userId,
      action: 'CONNECTOR_UPDATED',
      entity: 'connector',
      entityId: connector.id,
      oldData: { name: existing.name, isEnabled: existing.isEnabled },
      newData: { name: connector.name, isEnabled: connector.isEnabled },
    });

    return connector;
  }

  async deleteConnector(id: string, userId: string) {
    const existing = await prisma.connector.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Connector not found');

    await prisma.connector.delete({ where: { id } });

    await createAuditLog({
      userId,
      action: 'CONNECTOR_DELETED',
      entity: 'connector',
      entityId: id,
      oldData: { name: existing.name, type: existing.type },
    });
  }

  async testConnector(id: string, userId: string): Promise<ConnectorTestResult> {
    const connector = await prisma.connector.findFirst({ where: { id, userId } });
    if (!connector) throw new Error('Connector not found');

    const config = connector.config as unknown as ConnectorConfig;

    switch (connector.type) {
      case 'OLLAMA':
        return this.testOllama(config.ollama);
      case 'EMAIL':
        return this.testEmail(config.email);
      case 'WEBHOOK':
        return this.testWebhook(config.webhook);
      case 'DATABASE':
        return this.testDatabase(config.database);
      case 'API':
        return this.testApi(config.api);
      default:
        return { success: false, message: `Unknown connector type: ${connector.type}` };
    }
  }

  private async testOllama(config?: ConnectorConfig['ollama']): Promise<ConnectorTestResult> {
    try {
      const client = config?.baseUrl 
        ? new (await import('./ollama')).OllamaClient() 
        : ollama;

      const isHealthy = await client.checkHealth();
      if (!isHealthy) {
        return { success: false, message: 'Ollama Cloud server unreachable' };
      }

      const models = await client.listModels();
      return {
        success: true,
        message: `Connected to Ollama Cloud. ${models.models.length} models available.`,
        details: { models: models.models.map(m => ({ name: m.name, size: m.size })) },
      };
    } catch (error) {
      return { success: false, message: `Ollama test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async testEmail(config?: ConnectorConfig['email']): Promise<ConnectorTestResult> {
    if (!config?.host || !config?.user) {
      return { success: false, message: 'Email config incomplete' };
    }
    try {
      const nodemailer = await import('nodemailer');
      const transport = nodemailer.createTransport({
        host: config.host,
        port: config.port || 587,
        secure: config.port === 465,
        auth: { user: config.user, pass: '***MASKED***' },
      });
      await transport.verify();
      return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
      return { success: false, message: `Email test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async testWebhook(config?: ConnectorConfig['webhook']): Promise<ConnectorTestResult> {
    if (!config?.url) {
      return { success: false, message: 'Webhook URL required' };
    }
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(config.secret ? { 'X-Webhook-Secret': config.secret } : {}) },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      });
      return { success: response.ok, message: response.ok ? 'Webhook delivered' : `Webhook failed: ${response.status}` };
    } catch (error) {
      return { success: false, message: `Webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async testDatabase(config?: ConnectorConfig['database']): Promise<ConnectorTestResult> {
    if (!config?.connectionString) {
      return { success: false, message: 'Database connection string required' };
    }
    try {
      const { PrismaClient } = await import('@prisma/client');
      const testClient = new PrismaClient({ datasources: { db: { url: config.connectionString } } });
      await testClient.$queryRaw`SELECT 1`;
      await testClient.$disconnect();
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      return { success: false, message: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async testApi(config?: ConnectorConfig['api']): Promise<ConnectorTestResult> {
    if (!config?.baseUrl) {
      return { success: false, message: 'API base URL required' };
    }
    try {
      const response = await fetch(`${config.baseUrl}/health`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}`, ...config.headers },
      });
      return { success: response.ok, message: response.ok ? 'API reachable' : `API failed: ${response.status}` };
    } catch (error) {
      return { success: false, message: `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async syncConnector(id: string, userId: string) {
    const connector = await prisma.connector.findFirst({ where: { id, userId } });
    if (!connector || !connector.isEnabled) throw new Error('Connector not found or disabled');

    const log = await prisma.connectorSyncLog.create({
      data: { connectorId: id, status: 'RUNNING' },
    });

    try {
      await prisma.connector.update({
        where: { id },
        data: { lastSyncAt: new Date() },
      });

      await prisma.connectorSyncLog.update({
        where: { id: log.id },
        data: { status: 'COMPLETED', completedAt: new Date(), recordsCount: 0 },
      });

      return { success: true };
    } catch (error) {
      await prisma.connectorSyncLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', completedAt: new Date(), message: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  async chatWithOllama(userId: string, options: OllamaChatOptions) {
    return ollama.chat({ ...options, userId });
  }

  async *chatStreamWithOllama(userId: string, options: OllamaChatOptions) {
    yield* ollama.chatStream({ ...options, userId });
  }
}

export const connectors = new ConnectorManager();