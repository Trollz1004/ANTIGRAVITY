module.exports = {
  apps: [{
    name: 'marketing-engine',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    env: { NODE_ENV: 'production' },
  }, {
    name: "social-scheduler",
    script: "main.py",
    interpreter: "python",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }],
};
