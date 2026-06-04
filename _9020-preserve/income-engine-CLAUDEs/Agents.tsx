import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const AGENTS = [
  {
    name: "Claude Code",
    description: "Anthropic's coding tool with subagents",
    command: "ollama launch claude",
  },
  {
    name: "OpenClaw",
    description: "Personal AI with 100+ skills",
    command: "ollama launch openclaw",
  },
  {
    name: "Hermes Agent",
    description: "Self-improving AI agent built by Nous Research",
    command: "ollama launch hermes",
  },
  {
    name: "Codex",
    description: "OpenAI's open-source coding agent",
    command: "ollama launch codex",
  },
  {
    name: "OpenCode",
    description: "Anomaly's open-source coding agent",
    command: "ollama launch opencode",
  },
  {
    name: "Copilot CLI",
    description: "GitHub's AI coding agent for the terminal",
    command: "ollama launch copilot",
  },
  {
    name: "Droid",
    description: "Factory's coding agent across terminal and IDEs",
    command: "ollama launch droid",
  },
  {
    name: "Pi",
    description: "Minimal AI agent toolkit with plugin support",
    command: "ollama launch pi",
  },
];

export default function Agents() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCommand = (command: string, agentName: string) => {
    navigator.clipboard.writeText(command);
    setCopiedId(agentName);
    toast.success(`Copied: ${command}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold glow-cyan">AGENT LAUNCHER</h1>
            <p className="text-muted-foreground">
              Launch any of 8 AI agents with a single command. Copy the command and run it in your terminal.
            </p>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENTS.map((agent) => (
              <Card key={agent.name} className="cyber-panel flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="bg-input border border-border rounded-lg p-3 font-mono text-sm text-primary break-all">
                    {agent.command}
                  </div>
                  <Button
                    onClick={() => handleCopyCommand(agent.command, agent.name)}
                    className={`w-full transition-all ${
                      copiedId === agent.name
                        ? "cyber-button-secondary"
                        : "cyber-button"
                    }`}
                  >
                    {copiedId === agent.name ? (
                      <>
                        <Check size={16} className="mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        Copy Command
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Instructions */}
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle>How to Launch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-2 text-sm">
                <li className="flex gap-3">
                  <span className="text-primary font-bold min-w-[24px]">1.</span>
                  <span>Select an agent from the grid above</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold min-w-[24px]">2.</span>
                  <span>Click "Copy Command" to copy the launch command</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold min-w-[24px]">3.</span>
                  <span>Open your terminal and paste the command</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold min-w-[24px]">4.</span>
                  <span>Press Enter to launch the agent</span>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-4">
                Note: Ensure you have Ollama installed on your system before launching agents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
