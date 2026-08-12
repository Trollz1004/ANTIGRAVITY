const { Client } = require('C:/Users/joshl/AppData/Roaming/npm/node_modules/paperclipai/node_modules/pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'postgres', database: 'paperclip', password: '' });
const TARGET = 'ollama/qwen2.5:7b';
c.connect()
  .then(() => c.query('select id,name,adaptertype,adapterconfig from agents'))
  .then((r) => {
    console.log('agents found:', r.rows.length);
    const fixes = [];
    for (const x of r.rows) {
      const cfg = x.adapterconfig || {};
      const model = cfg.model || '';
      if (model === 'opencode/big-pickle' || !model) {
        cfg.model = TARGET;
        fixes.push(c.query('update agents set adapterconfig=$1 where id=$2', [JSON.stringify(cfg), x.id]));
        console.log('  fix', x.name, '->', TARGET);
      } else {
        console.log('  keep', x.name, '->', model);
      }
    }
    return Promise.all(fixes);
  })
  .then(() => {
    console.log('DONE');
    return c.end();
  })
  .catch((e) => {
    console.log('ERR', e.message);
    process.exit(1);
  });
