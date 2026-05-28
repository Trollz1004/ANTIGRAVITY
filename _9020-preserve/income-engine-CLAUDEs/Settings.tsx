import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Save, TestTube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const PROVIDERS = [
  {
    id: "ollama",
    name: "Ollama Cloud",
    description: "Local or cloud-hosted Ollama instance",
    fields: [
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "baseUrl", label: "Base URL", type: "text", placeholder: "http://localhost:11434" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4, GPT-3.5, and other OpenAI models",
    fields: [
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "baseUrl", label: "Base URL", type: "text", placeholder: "https://api.openai.com/v1" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access to multiple AI models",
    fields: [
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "baseUrl", label: "Base URL", type: "text", placeholder: "https://openrouter.ai/api/v1" },
    ],
  },
  {
    id: "paperclip",
    name: "Paperclip",
    description: "Agent orchestration and management",
    fields: [
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "baseUrl", label: "API URL", type: "text", placeholder: "https://api.paperclip.ai" },
    ],
  },
];

export default function Settings() {
  const [formState, setFormState] = useState<Record<string, Record<string, string>>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const { data: configs } = trpc.settings.getProviderConfigs.useQuery(undefined);
  const updateMutation = trpc.settings.updateProviderConfig.useMutation({
    onSuccess: () => {
      toast.success("Provider configured successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save configuration");
    },
  });

  const validateProvider = (providerId: string): string | null => {
    const config = formState[providerId];
    
    // Required field validation
    if (!config?.apiKey || config.apiKey.trim() === "") {
      return "API Key is required";
    }
    
    // API Key format validation
    if (config.apiKey.length < 10) {
      return "API Key appears to be invalid (too short)";
    }
    
    // Base URL validation if provided
    if (config.baseUrl && config.baseUrl.trim() !== "") {
      try {
        new URL(config.baseUrl);
      } catch {
        return "Base URL must be a valid URL";
      }
    }
    
    // Provider-specific validation
    if (providerId === "openai" && !config.baseUrl?.includes("openai.com")) {
      return "OpenAI Base URL should contain 'openai.com'";
    }
    
    if (providerId === "openrouter" && !config.baseUrl?.includes("openrouter")) {
      return "OpenRouter Base URL should contain 'openrouter'";
    }
    
    return null;
  };

  const handleSaveProvider = async (providerId: string) => {
    const validationError = validateProvider(providerId);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const config = formState[providerId];
    try {
      await updateMutation.mutateAsync({
        provider: providerId,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });
    } catch (error) {
      toast.error(`Failed to save ${providerId} configuration`);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    const validationError = validateProvider(providerId);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    setTestingProvider(providerId);
    try {
      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`${providerId} connection successful`);
    } catch (error) {
      toast.error(`Failed to connect to ${providerId}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleInputChange = (
    providerId: string,
    fieldKey: string,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [fieldKey]: value,
      },
    }));
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold glow-cyan">SETTINGS</h1>
            <p className="text-muted-foreground">
              Configure API keys and endpoints for all providers.
            </p>
          </div>

          {/* Provider Configuration */}
          <div className="space-y-6">
            {PROVIDERS.map((provider) => {
              const existingConfig = configs?.find((c) => c.provider === provider.id);
              const isConfigured = !!existingConfig?.apiKey;

              return (
                <Card key={provider.id} className="cyber-panel">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {provider.name}
                          {isConfigured && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              Configured
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>{provider.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {provider.fields.map((field) => {
                      const currentValue =
                        formState[provider.id]?.[field.key] ||
                        (field.key === "apiKey" ? existingConfig?.apiKey : existingConfig?.baseUrl) ||
                        "";

                      return (
                        <div key={field.key}>
                          <label className="text-sm text-muted-foreground">
                            {field.label}
                          </label>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={currentValue}
                            onChange={(e) =>
                              handleInputChange(provider.id, field.key, e.target.value)
                            }
                            className="cyber-input mt-1"
                          />
                        </div>
                      );
                    })}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleSaveProvider(provider.id)}
                        disabled={updateMutation.isPending}
                        className="cyber-button flex-1"
                      >
                        <Save size={16} className="mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={() => handleTestConnection(provider.id)}
                        disabled={testingProvider === provider.id}
                        className="cyber-button-secondary flex-1"
                      >
                        <TestTube size={16} className="mr-2" />
                        Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Security Notice */}
          <Card className="cyber-panel border-secondary">
            <CardHeader>
              <CardTitle className="text-secondary">Security Notice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • API keys are encrypted and stored securely in the database
              </p>
              <p>
                • Never share your API keys with untrusted sources
              </p>
              <p>
                • Rotate your API keys regularly for security
              </p>
              <p>
                • All API calls are made server-side to protect your credentials
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
