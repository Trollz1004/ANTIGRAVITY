import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs";
import * as path from "path";

const server = new Server(
  { name: "policy-boundary", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

interface PolicyFinding {
  severity: "HIGH" | "MEDIUM" | "LOW";
  rule: string;
  file?: string;
  description: string;
}

// Mock function to simulate file content lookup for policy checks
async function mockReadFileContent(filePath: string): Promise<string> {
  // In a real scenario, this would read actual file content.
  // For this simulation, we return predefined content based on file name.
  const fileName = path.basename(filePath);
  if (fileName.includes("secrets.json")) {
    return '{"API_KEY": "sk-12345", "DATABASE_PASSWORD": "supersecret"}';
  } else if (fileName.includes("config.env")) {
    return 'APP_SECRET=anothersecret\nDATABASE_URL=postgresql://user:pass@host:port/db';
  } else if (fileName.includes("data.txt")) {
    return 'User email: test@example.com\nPhone: 123-456-7890';
  } else if (fileName.includes("main.ts")) {
    return '// SPDX-License-Identifier: MIT\nconsole.log("hello");';
  }
  return "";
}

// Mock function to simulate directory listing
async function mockListDirectory(dirPath: string): Promise<string[]> {
  // For simulation, return a fixed set of files/directories.
  // In a real scenario, this would use fs.readdir.
  if (dirPath.includes("test-repo")) {
    return [".", "..", "src", "LICENSE", "SECURITY.md", "config.env", "data.txt", "secrets.json"];
  }
  return [".", ".."];
}

async function scanFileForPolicy(filePath: string, repoPath: string): Promise<PolicyFinding[]> {
  const findings: PolicyFinding[] = [];
  const content = await mockReadFileContent(filePath);
  const relativePath = path.relative(repoPath, filePath);

  // Check for hardcoded secrets
  if (content.match(/(API_KEY|SECRET|PASSWORD)=/i) || content.match(/"(API_KEY|SECRET|PASSWORD)":\s*".+"/i)) {
    findings.push({
      severity: "HIGH",
      rule: "Hardcoded Secrets",
      file: relativePath,
      description: "Potential hardcoded secret found."
    });
  }

  // Check for PII patterns
  if (content.match(/email:|phone:/i)) {
    findings.push({
      severity: "MEDIUM",
      rule: "PII Exposure",
      file: relativePath,
      description: "Potential PII patterns found (email/phone)."
    });
  }

  // Check for non-compliant license headers (simple check for now)
  if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
    if (!content.includes("License-Identifier")) {
      findings.push({
        severity: "LOW",
        rule: "Missing License Header",
        file: relativePath,
        description: "Missing or non-compliant license header."
      });
    }
  }

  return findings;
}

async function recursivelyScanRepo(currentPath: string, repoPath: string): Promise<PolicyFinding[]> {
  let allFindings: PolicyFinding[] = [];
  const dirents = await mockListDirectory(currentPath); // Simulate fs.readdir

  for (const dirent of dirents) {
    if (dirent === "." || dirent === "..") continue;

    const fullPath = path.join(currentPath, dirent);
    // For simulation, we assume some files based on name, not actual fs.stat
    const isDirectory = !dirent.includes("."); // Simple heuristic for mock

    if (isDirectory) {
      allFindings = allFindings.concat(await recursivelyScanRepo(fullPath, repoPath));
    } else {
      allFindings = allFindings.concat(await scanFileForPolicy(fullPath, repoPath));
    }
  }
  return allFindings;
}

server.setRequestHandler("tools/list" as any, async () => ({
  tools: [
    {
      name: "policy_scan_repo",
      description: "Scan a repository for policy violations (e.g., secrets, PII, licenses, SECURITY.md).",
      inputSchema: { type: "object", properties: { repoPath: { type: "string", description: "Path to the repository root to scan." } }, required: ["repoPath"] }
    },
    {
      name: "policy_check_compliance",
      description: "Check a specific file or directory against a set of policy rules.",
      inputSchema: {
        type: "object",
        properties: {
          targetPath: { type: "string", description: "Path to the file or directory to check." },
          rule: { type: "string", enum: ["no-hardcoded-secrets", "check-pii", "license-header", "security-md-exists"], description: "Specific policy rule to check." }
        },
        required: ["targetPath", "rule"]
      }
    }
  ]
}));

server.setRequestHandler("tools/call" as any, async (request: any) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "policy_scan_repo") {
      const repoPath = args.repoPath; // In a real scenario, validate this path exists and is a directory
      let findings: PolicyFinding[] = [];

      // Simulate check for SECURITY.md and LICENSE at the repo root
      const securityMdExists = (await mockListDirectory(repoPath)).includes("SECURITY.md");
      if (!securityMdExists) {
        findings.push({
          severity: "MEDIUM",
          rule: "Missing SECURITY.md",
          description: `Repository '${repoPath}' is missing SECURITY.md.`
        });
      }
      const licenseExists = (await mockListDirectory(repoPath)).includes("LICENSE");
      if (!licenseExists) {
        findings.push({
          severity: "LOW",
          rule: "Missing LICENSE",
          description: `Repository '${repoPath}' is missing a LICENSE file.`
        });
      }

      // Simulate recursive scan for other policy violations
      findings = findings.concat(await recursivelyScanRepo(repoPath, repoPath));

      return { content: [{ type: "text", text: JSON.stringify(findings, null, 2) }] };
    } else if (name === "policy_check_compliance") {
      const { targetPath, rule } = args;
      const findings: PolicyFinding[] = [];
      const content = await mockReadFileContent(targetPath);
      
      if (rule === "no-hardcoded-secrets") {
        if (content.match(/(API_KEY|SECRET|PASSWORD)=/i) || content.match(/"(API_KEY|SECRET|PASSWORD)":\s*".+"/i)) {
          findings.push({ severity: "HIGH", rule, file: targetPath, description: "Hardcoded secret found." });
        }
      } else if (rule === "check-pii") {
        if (content.match(/email:|phone:/i)) {
          findings.push({ severity: "MEDIUM", rule, file: targetPath, description: "PII patterns found." });
        }
      } else if (rule === "license-header") {
        if (targetPath.endsWith(".ts") || targetPath.endsWith(".js")) {
          if (!content.includes("License-Identifier")) {
            findings.push({ severity: "LOW", rule, file: targetPath, description: "Missing license header." });
          }
        }
      } else if (rule === "security-md-exists") {
        // This rule is more about file existence at repo root, not content of a targetPath.
        // For simplicity, we'll just check if the targetPath *is* SECURITY.md
        if (!path.basename(targetPath).includes("SECURITY.md")) {
          findings.push({ severity: "MEDIUM", rule, file: targetPath, description: "Target is not SECURITY.md or SECURITY.md not found." });
        }
      }

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
