const { WebClient } = require('@slack/web-api');

const slack = process.env.SLACK_BOT_TOKEN
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

const PLATFORM = process.env.SLACK_CHANNEL_PLATFORM || 'antigravity-platform';
const DREAM = process.env.SLACK_CHANNEL_DREAM || 'dream-online';
const FCC = process.env.SLACK_CHANNEL_FCC || 'fcc-claude';

const CHANNEL_MAP = {
  hermes: PLATFORM,
  'fcc-claude': FCC,
  claude: FCC,
  codex: PLATFORM,
  opencode: PLATFORM,
  openai: PLATFORM,
  ollama: PLATFORM,
  cloud: PLATFORM,
  grok: PLATFORM,
  gemini: PLATFORM,
  chatgpt: PLATFORM,
  github: PLATFORM,
  '1minai': DREAM,
  perplexity: PLATFORM,
  cursor: PLATFORM,
  clawx: PLATFORM,
  pi: PLATFORM,
  slack: PLATFORM,
  desktop: PLATFORM,
  commander: PLATFORM
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
