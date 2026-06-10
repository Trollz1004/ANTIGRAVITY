const repoTruth = document.querySelector("#repo-truth");
const allowedTools = document.querySelector("#allowed-tools");
const blockedActions = document.querySelector("#blocked-actions");
const envDrift = document.querySelector("#env-drift");
const taskInput = document.querySelector("#task-input");
const draftButton = document.querySelector("#draft-prompt");
const promptOutput = document.querySelector("#prompt-output");

function item(text) {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

function renderRepo(status) {
  repoTruth.innerHTML = "";
  const rows = [
    ["Windows root", status.repo.windowsRoot],
    ["WSL root", status.repo.wslRoot],
    ["Local root", status.repo.localRoot],
    ["Safe sources", `${status.safeSources.filter((source) => source.exists).length}/${status.safeSources.length} available`]
  ];

  for (const [term, description] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = description;
    repoTruth.append(dt, dd);
  }
}

function renderList(target, values) {
  target.innerHTML = "";
  for (const value of values) target.append(item(value));
}

function renderDrift(drift) {
  envDrift.innerHTML = "";
  const count = document.createElement("span");
  count.className = "pill";
  count.textContent = `${drift.counts.masterKeys} master keys tracked`;
  envDrift.append(count);

  const rate = document.createElement("p");
  rate.textContent = drift.rateLimitKeys.length
    ? `Rate-limit keys found: ${drift.rateLimitKeys.join(", ")}`
    : "Rate-limit keys not found in the placeholder template.";
  envDrift.append(rate);

  for (const finding of drift.knownFindings) {
    const findingNode = document.createElement("p");
    findingNode.textContent = `${finding.severity}: ${finding.finding}`;
    envDrift.append(findingNode);
  }
}

async function load() {
  const [status, drift] = await Promise.all([
    fetch("/api/mission/status").then((response) => response.json()),
    fetch("/api/env/drift").then((response) => response.json())
  ]);

  renderRepo(status);
  renderList(allowedTools, status.safetyPolicy.allowed);
  renderList(blockedActions, status.safetyPolicy.blocked);
  renderDrift(drift);
}

async function draftPrompt() {
  promptOutput.textContent = "Drafting...";
  const response = await fetch("/api/tools/prepare_codex_execution_prompt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ task: taskInput.value })
  });
  const data = await response.json();
  promptOutput.textContent = data.prompt || JSON.stringify(data, null, 2);
}

draftButton.addEventListener("click", draftPrompt);
load().catch((error) => {
  envDrift.textContent = error.message;
});
