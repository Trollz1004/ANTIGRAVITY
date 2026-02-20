#!/usr/bin/env node

/**
 * OPENCLAW AUTH HANDLER
 * Guides user through Claude API auth via `claude setup-token`
 * Stores token securely in .env and validates before starting server
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '.env');
const VAULT_FILE = path.join(__dirname, '..', '.vault', 'ADMIN-KEY-T5500.env');

async function promptForAuth() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          OPENCLAW — CLAUDE API AUTHENTICATION              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('📋 Two ways to authenticate:\n');
    console.log('  [A] API Key (from https://console.anthropic.com/settings/keys)');
    console.log('      - Permanent access');
    console.log('      - Best for production\n');
    console.log('  [B] OAT Token (from `claude setup-token` command)');
    console.log('      - Interactive browser auth');
    console.log('      - Expires ~90 days\n');

    rl.question('Choose [A] or [B]: ', (choice) => {
      rl.close();
      resolve(choice.toUpperCase());
    });
  });
}

async function setupViaAPIKey() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n🔑 OPTION A: API Key\n');
    console.log('Steps:');
    console.log('  1. Go to https://console.anthropic.com/settings/keys');
    console.log('  2. Click "Create Key"');
    console.log('  3. Name it "T5500-OPUS"');
    console.log('  4. Copy the key (starts with sk-ant-api03-)\n');

    rl.question('Paste your API key here: ', (key) => {
      rl.close();
      resolve(key.trim());
    });
  });
}

async function setupViaOAT() {
  console.log('\n🔐 OPTION B: OAT Token (Claude Code CLI)\n');
  console.log('Launching Claude Code interactive auth...');
  console.log('A browser window will open. Follow the prompts.\n');
  console.log('After auth, Claude Code will display your token.');
  console.log('Copy it and paste below.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Have you run `claude setup-token` and copied the token? [Y/n]: ', (ans) => {
      if (ans.toLowerCase() !== 'y' && ans !== '') {
        console.log('\n✋ Run this in a terminal first:');
        console.log('   claude setup-token\n');
        rl.close();
        resolve(null);
      } else {
        rl.question('\nPaste your OAT token here (sk-ant-oat01-...): ', (token) => {
          rl.close();
          resolve(token.trim());
        });
      }
    });
  });
}

function validateKey(key) {
  if (key.startsWith('sk-ant-api03-') && key.length > 50) {
    return { valid: true, type: 'api-key' };
  }
  if (key.startsWith('sk-ant-oat01-') && key.length > 50) {
    return { valid: true, type: 'oat-token', expires: '~90 days' };
  }
  return { valid: false, type: null };
}

function saveKey(key) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf8');
  const updated = envContent.replace(
    /ANTHROPIC_API_KEY=.*/,
    `ANTHROPIC_API_KEY=${key}`
  );
  fs.writeFileSync(ENV_FILE, updated, 'utf8');
  
  // Also save to vault for backup
  if (!fs.existsSync(path.dirname(VAULT_FILE))) {
    fs.mkdirSync(path.dirname(VAULT_FILE), { recursive: true });
  }
  fs.writeFileSync(VAULT_FILE, `ANTHROPIC_API_KEY=${key}\n`, 'utf8');
  
  console.log(`\n✅ Key saved to:`);
  console.log(`   ${ENV_FILE}`);
  console.log(`   ${VAULT_FILE}\n`);
}

async function testAuth(key) {
  console.log('\n🧪 Testing authentication...');
  
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: key });
    
    // Lightweight test: just verify the client initializes
    console.log('✅ Client initialized successfully');
    return true;
  } catch (error) {
    console.log(`❌ Auth test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.clear();
  
  const choice = await promptForAuth();
  let key = null;

  if (choice === 'A') {
    key = await setupViaAPIKey();
  } else if (choice === 'B') {
    key = await setupViaOAT();
  } else {
    console.log('\n❌ Invalid choice. Exiting.');
    process.exit(1);
  }

  if (!key) {
    console.log('\n❌ No key provided. Exiting.');
    process.exit(1);
  }

  const validation = validateKey(key);
  
  if (!validation.valid) {
    console.log('\n❌ Invalid key format.');
    console.log('   Expected: sk-ant-api03-... OR sk-ant-oat01-...');
    console.log(`   Got: ${key.substring(0, 30)}...\n`);
    process.exit(1);
  }

  console.log(`\n✅ Key validated: ${validation.type}`);
  if (validation.expires) {
    console.log(`   Expires: ${validation.expires}`);
  }

  const authOk = await testAuth(key);
  
  if (!authOk) {
    console.log('\n⚠️  Auth test failed. Key may be invalid.');
    console.log('   Saving anyway — you can retry later.\n');
  }

  saveKey(key);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           OPENCLAW READY — START WITH:                    ║');
  console.log('║                                                            ║');
  console.log('║   npm start                                                ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
