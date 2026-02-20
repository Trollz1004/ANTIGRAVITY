#!/usr/bin/env node

/**
 * OPENCLAW STARTUP GUARD
 * Ensures API key is configured before starting server
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '.env');

function checkAuth() {
  const envContent = fs.readFileSync(ENV_FILE, 'utf8');
  const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
  
  if (!match) {
    return { configured: false, reason: 'Key not found in .env' };
  }

  const key = match[1].trim();

  if (key.includes('PASTE_YOUR_KEY_HERE') || key.includes('sk-ant-PASTE')) {
    return { configured: false, reason: 'Placeholder key detected' };
  }

  if (!key.startsWith('sk-ant-')) {
    return { configured: false, reason: 'Invalid key format' };
  }

  if (key.length < 50) {
    return { configured: false, reason: 'Key too short' };
  }

  return { configured: true, keyType: key.includes('oat01') ? 'OAT Token' : 'API Key' };
}

async function promptAuth() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        ⚠️  AUTHENTICATION REQUIRED                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('OpenClaw needs your Claude API credentials.\n');
    console.log('Options:');
    console.log('  [1] Run setup: npm run auth');
    console.log('  [2] Manual: Edit .env and add ANTHROPIC_API_KEY');
    console.log('  [3] Get API key: https://console.anthropic.com/settings/keys');
    console.log('  [4] Or run: claude setup-token (for OAT token)\n');

    rl.question('Press ENTER to continue setup or [Q] to quit: ', (ans) => {
      rl.close();
      resolve(ans.toLowerCase() !== 'q');
    });
  });
}

async function main() {
  const authCheck = checkAuth();

  if (!authCheck.configured) {
    console.log(`\n❌ Authentication not configured: ${authCheck.reason}\n`);
    
    const continueSetup = await promptAuth();
    if (!continueSetup) {
      console.log('\nExiting.\n');
      process.exit(1);
    }

    // Spawn auth setup
    console.log('\n🔐 Starting authentication setup...\n');
    const { spawn } = require('child_process');
    const auth = spawn('node', ['auth-setup.js'], { 
      cwd: __dirname,
      stdio: 'inherit'
    });

    auth.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Auth complete. Run again: npm start\n');
      } else {
        console.log(`\n❌ Auth failed (exit code ${code})\n`);
      }
      process.exit(code);
    });
  } else {
    // Auth OK, start server
    console.log(`\n✅ Authentication configured (${authCheck.keyType})\n`);
    console.log('🚀 Starting OpenClaw server...\n');
    
    // Load the main server
    require('./index.js');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
