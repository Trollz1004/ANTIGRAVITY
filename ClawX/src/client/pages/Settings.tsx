import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Key, Trash2, CheckCircle2, XCircle, Lock, ShieldCheck } from "lucide-react";
import { PROVIDER_CONFIGS } from "../../../shared/ai-providers";
import type { AiProviderSlug } from "../../../shared/ai-providers";

const PROVIDERS_WITH_KEYS: AiProviderSlug[] = ["claude", "gemini", "perplexity", "grok", "codex"];

const PROVIDER_KEY_LABELS: Record<AiProviderSlug, { placeholder: string; docsUrl: string; envVar: string }> = {
  manus: { placeholder: "Built-in — no key required", docsUrl: "", envVar: "" },
  claude: {
    placeholder: "Anthropic API key",
    docsUrl: "https://console.anthropic.com/settings/keys",
    envVar: "ANTHROPIC_API_KEY",
  },
  gemini: {
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    envVar: "GEMINI_API_KEY",
  },
  perplexity: {
    placeholder: "pplx-...",
    docsUrl: "https://www.perplexity.ai/settings/api",
    envVar: "SONAR_API_KEY",
  },
  grok: {
    placeholder: "xai-...",
    docsUrl: "https://console.x.ai/",
    envVar: "XAI_API_KEY",
  },
  codex: {
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    envVar: "OPENAI_API_KEY",
  },
};

export default function Settings() {
  const { user, isAuthenticated, loading } = useAuth();
  const [inputValues, setInputValues] = useState<Partial<Record<AiProviderSlug, string>>>({});
  const [showKey, setShowKey] = useState<Partial<Record<AiProviderSlug, boolean>>>({});
  const [saving, setSaving] = useState<Partial<Record<AiProviderSlug, boolean>>>({});

  const { data: keyMeta, refetch: refetchKeys } = trpc.apiKeys.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: providers } = trpc.providers.list.useQuery(undefined, { enabled: isAuthenticated });

  const saveMutation = trpc.apiKeys.save.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${PROVIDER_CONFIGS[vars.providerSlug]?.name} key saved securely`);
      setInputValues((prev) => ({ ...prev, [vars.providerSlug]: "" }));
      setSaving((prev) => ({ ...prev, [vars.providerSlug]: false }));
      refetchKeys();
    },
    onError: (err, vars) => {
      toast.error(`Failed to save key: ${err.message}`);
      setSaving((prev) => ({ ...prev, [vars.providerSlug]: false }));
    },
  });

  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${PROVIDER_CONFIGS[vars.providerSlug]?.name} key removed`);
      refetchKeys();
    },
    onError: (err) => toast.error(`Failed to remove key: ${err.message}`),
  });

  const keyMetaMap = new Map(keyMeta?.map((k) => [k.providerSlug, k]) ?? []);
  const providerStatusMap = new Map(providers?.map((p) => [p.slug, p]) ?? []);

  const handleSave = async (slug: AiProviderSlug) => {
    const key = inputValues[slug]?.trim();
    if (!key || key.length < 8) {
      toast.error("API key must be at least 8 characters");
      return;
    }
    setSaving((prev) => ({ ...prev, [slug]: true }));
    saveMutation.mutate({ providerSlug: slug, key });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">Sign in to manage your API keys</p>
        <Button asChild>
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Keys are AES-256 encrypted and stored per your account. They are never sent to the browser.
          </p>
        </div>
      </div>

      {/* Security notice */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-primary">End-to-end encrypted storage</p>
              <p className="text-muted-foreground mt-1">
                Your keys are encrypted with AES-256-GCM before being stored in the database. Only you can use them — they are injected server-side into API calls and never exposed to the frontend or logs. Signed in as <span className="font-medium text-foreground">{user?.name ?? user?.email}</span>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider key cards */}
      {PROVIDERS_WITH_KEYS.map((slug) => {
        const config = PROVIDER_CONFIGS[slug];
        const meta = keyMetaMap.get(slug);
        const status = providerStatusMap.get(slug);
        const keyInfo = PROVIDER_KEY_LABELS[slug];
        const hasKey = !!meta?.isActive;
        const isReady = status?.status === "ready";
        const keySource = status?.keySource;

        return (
          <Card key={slug} className={hasKey || isReady ? "border-green-500/30" : "border-border"}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: config?.color + "20", color: config?.color }}
                  >
                    {config?.name?.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{config?.name}</CardTitle>
                    <CardDescription className="text-xs">{config?.role}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isReady ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {keySource === "user" ? `User Key (...${meta?.keyHint})` : "Env Key"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground gap-1">
                      <XCircle className="h-3 w-3" />
                      No Key
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey[slug] ? "text" : "password"}
                    placeholder={keyInfo.placeholder}
                    value={inputValues[slug] ?? ""}
                    onChange={(e) =>
                      setInputValues((prev) => ({ ...prev, [slug]: e.target.value }))
                    }
                    className="pr-10 font-mono text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleSave(slug)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => ({ ...prev, [slug]: !prev[slug] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey[slug] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  onClick={() => handleSave(slug)}
                  disabled={!inputValues[slug]?.trim() || saving[slug]}
                  size="sm"
                  className="gap-1"
                >
                  <Key className="h-3.5 w-3.5" />
                  {saving[slug] ? "Saving..." : hasKey ? "Update" : "Save"}
                </Button>
                {hasKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ providerSlug: slug })}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {keyInfo.docsUrl && (
                <p className="text-xs text-muted-foreground">
                  Get your key at{" "}
                  <a
                    href={keyInfo.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {keyInfo.docsUrl.replace("https://", "")}
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Manus built-in note */}
      <Card className="border-green-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold bg-green-500/20 text-green-400">
                M
              </div>
              <div>
                <CardTitle className="text-base">Manus</CardTitle>
                <CardDescription className="text-xs">Legacy Guardian — Built-in LLM</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Always Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Manus uses the built-in LLM — no API key required. Always available as your Legacy Guardian.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
