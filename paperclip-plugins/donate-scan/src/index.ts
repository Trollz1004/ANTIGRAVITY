import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "donate-scan", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

interface ComplianceFinding {
  severity: "HIGH" | "MEDIUM" | "LOW" | "INFO";
  rule: string;
  target: string;
  description: string;
}

// Mock function to simulate scanning a component for compliance
async function mockScanComponentForCompliance(componentId: string): Promise<ComplianceFinding[]> {
  const findings: ComplianceFinding[] = [];
  // Simulate various compliance checks
  if (componentId.includes("header")) {
    findings.push({
      severity: "INFO",
      rule: "Donation Disclosure Text",
      target: componentId,
      description: "No explicit donation disclosure text found in header component. Recommend adding 'Your donation is tax-deductible'."
    });
  }
  if (componentId.includes("form")) {
    findings.push({
      severity: "MEDIUM",
      rule: "Contribution Limit Warning",
      target: componentId,
      description: "Missing clear warning about contribution limits near donation form."
    });
    findings.push({
        severity: "HIGH",
        rule: "Required Legal Notices",
        target: componentId,
        description: "Missing required Florida political disclaimer for donations (FL §106.071)."
    });
  }
  return findings;
}

// Mock function to simulate scanning an entire frontend repository
async function mockScanRepoForCompliance(repoPath: string): Promise<ComplianceFinding[]> {
  const findings: ComplianceFinding[] = [];
  // Simulate repo-wide checks
  findings.push({
    severity: "MEDIUM",
    rule: "Overall Disclosure Presence",
    target: repoPath,
    description: "Overall review indicates some disclosure texts are spread out and not consistently placed."
  });
  findings.push({
    severity: "LOW",
    rule: "Terms of Service Link",
    target: repoPath,
    description: "Ensure a clear link to Terms of Service is present on all donation-related pages."
  });
  // Simulate finding from specific components
  findings.concat(await mockScanComponentForCompliance("frontend/src/components/DonationForm.js"));
  findings.concat(await mockScanComponentForCompliance("frontend/public/index.html"));
  return findings;
}

server.setRequestHandler("tools/list" as any, async () => ({
  tools: [
    {
      name: "donate_scan_component",
      description: "Scan a specific frontend component (e.g., a file path or component name) for FL §496.405 campaign finance compliance violations.",
      inputSchema: { type: "object", properties: { componentId: { type: "string", description: "Identifier for the component to scan (e.g., file path, component name)." } }, required: ["componentId"] }
    },
    {
      name: "donate_scan_repo",
      description: "Scan an entire frontend repository for FL §496.405 campaign finance compliance violations, including disclosure texts, contribution limits, and legal notices.",
      inputSchema: { type: "object", properties: { repoPath: { type: "string", description: "Path to the frontend repository root to scan." } }, required: ["repoPath"] }
    }
  ]
}));

server.setRequestHandler("tools/call" as any, async (request: any) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "donate_scan_component") {
      const findings = await mockScanComponentForCompliance(args.componentId);
      return { content: [{ type: "text", text: JSON.stringify(findings, null, 2) }] };
    } else if (name === "donate_scan_repo") {
      const findings = await mockScanRepoForCompliance(args.repoPath);
      return { content: [{ type: "text", text: JSON.stringify(findings, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
