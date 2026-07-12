# ant-support — Self-Improving State File
> Max 4k tokens. Read on start. Write on exit ONLY. Timestamp every write.
> Failure to timestamp = platform deletion. Joshua audits this.
> updated: 2026-07-12T20:35:00Z

## Last Session
2026-07-12T21:10:00Z — Resume handoff for TRO-78 completed via successful local run `4d139725-c6df-4530-8b67-0dee12b24f92`; confirmed required `STATE.md` + `support-log.md` updates are in place (open/in-progress/blocked counters and SLA posture), and no additional blockers were introduced.

## Decisions
- Keep canned responses concise and customer-facing; avoid mission/fundraising terms.
- Do not include raw verification queues, payment processors, or internal tools in public copy.
- Post-wheel support status updates should track three signals: current open workload, in-progress work, and SLA posture, and should be timestamped in support-log.

## Learned
- ant-support files live under `C:\antigravity\paperclip-tro\agents\ant-support\`.
- Paperclip checkout for blocked issue may 500 if already in recovery action; direct patch still works when run owns the recovery.
