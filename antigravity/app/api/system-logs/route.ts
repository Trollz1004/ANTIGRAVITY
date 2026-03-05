// app/api/system-logs/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Paths to the status files at the root of the workspace
    // Adjust based on the actual relative path from the Next.js app
    const rootDir = path.resolve(process.cwd(), '..'); 
    const statusPath = path.join(rootDir, 'SABRETOOTH-STATUS.md');
    const queuePath = path.join(rootDir, 'TASK-QUEUE-100.md');

    let statusContent = "";
    let queueContent = "";

    if (fs.existsSync(statusPath)) {
      statusContent = fs.readFileSync(statusPath, 'utf-8');
    }
    if (fs.existsSync(queuePath)) {
      queueContent = fs.readFileSync(queuePath, 'utf-8');
    }

    // Extracting recent log-like lines
    const logs: string[] = [];

    // Process Status
    const statusLines = statusContent.split('\n').filter(line => line.startsWith('- '));
    statusLines.slice(-5).forEach(line => logs.push(`[STATUS] ${line.substring(2)}`));

    // Process Tasks
    const queueLines = queueContent.split('\n').filter(line => line.startsWith('- [x]'));
    queueLines.slice(-5).forEach(line => logs.push(`[TASK-DONE] ${line.substring(6)}`));

    if (logs.length === 0) {
      logs.push("[SYSTEM] No recent logs found. Systems are idling.");
    }

    return NextResponse.json({ logs: logs.reverse() });
  } catch (error) {
    console.error("Failed to read system logs:", error);
    return NextResponse.json({ error: "Internal Server Error", logs: ["[ERROR] Failed to fetch system logs"] }, { status: 500 });
  }
}
