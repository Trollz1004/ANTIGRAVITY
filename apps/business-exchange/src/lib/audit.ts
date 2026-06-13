import { prisma } from './prisma';

export interface AuditLogInput {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        oldData: input.oldData ? JSON.parse(JSON.stringify(input.oldData)) : null,
        newData: input.newData ? JSON.parse(JSON.stringify(input.newData)) : null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(filters: {
  userId?: string;
  entity?: string;
  entityId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
} = {}) {
  const where: Record<string, unknown> = {};
  
  if (filters.userId) where.userId = filters.userId;
  if (filters.entity) where.entity = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.action) where.action = filters.action;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) (where.createdAt as Record<string, Date>).gte = filters.from;
    if (filters.to) (where.createdAt as Record<string, Date>).lte = filters.to;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}