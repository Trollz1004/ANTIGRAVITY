const { WebClient } = require('@slack/web-api');

const slack = process.env.SLACK_BOT_TOKEN
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

const CHANNEL_MAP = {
  hermes: process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform',
  codex: process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform',
  claude: process.env.SLACK_CHANNEL_FCC || 'fcc-claude',
  github: process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform',
  ollama: process.env.SLACK_CHANNEL_DREAM || 'dream-online',
  chatgpt: process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform',
  gemini: process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform',
  grok: process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform',
  cloud: process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform',
  '1minai': process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform'
};

const STATUS_EMOJI = {
  backlog: ':inbox_tray:',
  todo: ':clipboard:',
  in_progress: ':hammer_and_wrench:',
  review: ':eyes:',
  done: ':white_check_mark:'
};

async function notifySlack(task, previousStatus) {
  if (!slack) return;

  const channel = CHANNEL_MAP[task.platform] || CHANNEL_MAP.hermes;
  const emoji = STATUS_EMOJI[task.status] || ':pushpin:';

  const text = `${emoji} *${task.title}*\n` +
    `Status: \`${previousStatus}\` → \`${task.status}\`\n` +
    `Platform: ${task.platform} | Priority: ${task.priority}` +
    (task.skill_id ? `\nSkill: \`${task.skill_id}\`` : '') +
    (task.github_issue_number ? `\nGH: #${task.github_issue_number}` : '');

  try {
    await slack.chat.postMessage({ channel, text, mrkdwn: true });
  } catch (err) {
    console.error(`[slack] Failed to notify ${channel}:`, err.message);
  }
}

async function notifyTaskCreated(task) {
  if (!slack) return;

  const channel = CHANNEL_MAP[task.platform] || CHANNEL_MAP.hermes;
  const text = `:new: *New task:* ${task.title}\n` +
    `Platform: ${task.platform} | Priority: ${task.priority} | Status: ${task.status}`;

  try {
    await slack.chat.postMessage({ channel, text, mrkdwn: true });
  } catch (err) {
    console.error(`[slack] Failed to notify ${channel}:`, err.message);
  }
}

module.exports = { notifySlack, notifyTaskCreated };
