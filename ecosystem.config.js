module.exports = {
  apps: [{
    name: 'loviprintdtf',
    script: 'server.js',
    cwd: '/root/loviprintDTF',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=2048',
      DATABASE_URL: 'postgresql://dtf_user:fe06b83ec2c4a7e62c05e514d53277d9@localhost:5433/dtf_print_services?schema=public',
      AUTH_SECRET: 'JjC4lLs18JO36d5+W8u/dX7k9QApVQtEZaBQ5Cw6fFQ=',
      NEXTAUTH_SECRET: 'M1LOS64HCOMu/bIkAif+ANgNL1rPO2Z4S20ixjia6kw='
    },
    error_file: '/var/log/loviprintdtf-error.log',
    out_file: '/var/log/loviprintdtf-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
