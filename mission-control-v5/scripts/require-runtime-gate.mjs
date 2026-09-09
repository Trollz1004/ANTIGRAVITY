if (process.env.MISSION_CONTROL_RUNTIME_GATE !== 'LANDED_BY_JUDGE') {
  console.error('End-to-end execution is blocked until the runtime gate is explicitly lifted.');
  process.exit(1);
}
