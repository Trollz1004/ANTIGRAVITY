# Hermes SKILLS

Standing set at session start (from `agent-contracts/CAPABILITY-BASELINE.md`):

agent-reach · journal (`.agents/journals/hermes/STATE.md`) · find-skills · skill-creator · i-have-adhd · brainstorming · agent-browser · planning-with-files · para-memory-files

Then a minimum of five task-relevant skills per task. Catalog: `.agents/skills/README.md` (includes the 144+ agency-* skills). Learnings go to the journal and para-memory-files; a skill change is a packet for a judge, never a self-edit.

## Focus lane: YouTube automation (Hermes)

Hermes owns YouTube automation. When a task touches YouTube, faceless video,
or daily-news video, load:

- `hermes-youtube-faceless-news` — daily recap from `content/yesterday-news/<YYYYMMDD>/` (script.txt + metadata.json) to a faceless short: clean script -> visuals -> TTS/voiceover -> ffmpeg render -> packet -> marketing-inbox (publish only on Joshua approval).
- `hermes-youtube-avatar-head` — scripted talking-head video with a branded avatar head (no real face), same approval gate.

Source content: `content/yesterday-news/` (per-day folders with metadata.json + script.txt). Output drops: `ops/marketing-inbox/` (approval queue) + `ops/packets/hermes-youtube-<date>/` (evidence).
