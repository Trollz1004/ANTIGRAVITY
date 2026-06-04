import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [ollamaUrl, setOllamaUrl] = useState("");
  const [ollamaKey, setOllamaKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [openaiUrl, setOpenaiUrl] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [manusKey, setManusKey] = useState("");

  // Fetch provider configs
  const { data: configs } = trpc.settings.getProviderConfigs.useQuery();

  // Load configs into form
  useEffect(() => {
    if (configs) {
      configs.forEach((config) => {
        if (config.provider === "ollama") {
          setOllamaUrl(config.baseUrl || "");
          setOllamaKey(config.apiKey || "");
        } else if (config.provider === "openrouter") {
          setOpenrouterKey(config.apiKey || "");
        } else if (config.provider === "openai") {
          setOpenaiUrl(config.baseUrl || "");
          setOpenaiKey(config.apiKey || "");
        } else if (config.provider === "manus") {
          setManusKey(config.apiKey || "");
        }
      });
    }
  }, [configs]);

  // Mutations
  const updateConfigMutation = trpc.settings.updateProviderConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration saved successfully");
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error("Failed to save configuration");
      setIsLoading(false);
    },
  });

  const handleSaveOllama = async () => {
    setIsLoading(true);
    await updateConfigMutation.mutateAsync({
      provider: "ollama",
      baseUrl: ollamaUrl,
      apiKey: ollamaKey,
    });
  };

  const handleSaveOpenRouter = async () => {
    setIsLoading(true);
    await updateConfigMutation.mutateAsync({
      provider: "openrouter",
      apiKey: openrouterKey,
    });
  };

  const handleSaveOpenAI = async () => {
    setIsLoading(true);
    await updateConfigMutation.mutateAsync({
      provider: "openai",
      baseUrl: openaiUrl,
      apiKey: openaiKey,
    });
  };

  const handleSaveManus = async () => {
    setIsLoading(true);
    await updateConfigMutation.mutateAsync({
      provider: "manus",
      apiKey: manusKey,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="text-accent hover:bg-accent/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold neon-glow">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="ollama" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
              <TabsTrigger value="ollama">Ollama</TabsTrigger>
              <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="manus">Manus</TabsTrigger>
            </TabsList>

            {/* Ollama */}
            <TabsContent value="ollama">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold mb-4">Ollama Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ollama-url" className="text-foreground">
                      Ollama Base URL
                    </Label>
                    <Input
                      id="ollama-url"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="bg-input border-border mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Default: http://localhost:11434
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="ollama-key" className="text-foreground">
                      API Key (optional)
                    </Label>
                    <Input
                      id="ollama-key"
                      value={ollamaKey}
                      onChange={(e) => setOllamaKey(e.target.value)}
                      type="password"
                      placeholder="Leave empty if not required"
                      className="bg-input border-border mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleSaveOllama}
                    disabled={isLoading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* OpenRouter */}
            <TabsContent value="openrouter">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold mb-4">OpenRouter Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="openrouter-key" className="text-foreground">
                      API Key
                    </Label>
                    <Input
                      id="openrouter-key"
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      type="password"
                      placeholder="sk-..."
                      className="bg-input border-border mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Get your API key from{" "}
                      <a
                        href="https://openrouter.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        openrouter.ai
                      </a>
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveOpenRouter}
                    disabled={isLoading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* OpenAI */}
            <TabsContent value="openai">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold mb-4">OpenAI-Compatible Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="openai-url" className="text-foreground">
                      Base URL
                    </Label>
                    <Input
                      id="openai-url"
                      value={openaiUrl}
                      onChange={(e) => setOpenaiUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="bg-input border-border mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="openai-key" className="text-foreground">
                      API Key
                    </Label>
                    <Input
                      id="openai-key"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      type="password"
                      placeholder="sk-..."
                      className="bg-input border-border mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleSaveOpenAI}
                    disabled={isLoading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Manus */}
            <TabsContent value="manus">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold mb-4">Manus API Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manus-key" className="text-foreground">
                      API Key
                    </Label>
                    <Input
                      id="manus-key"
                      value={manusKey}
                      onChange={(e) => setManusKey(e.target.value)}
                      type="password"
                      placeholder="manus-..."
                      className="bg-input border-border mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Get your API key from the Manus dashboard
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveManus}
                    disabled={isLoading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
