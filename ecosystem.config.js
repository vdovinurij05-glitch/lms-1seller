module.exports = {
  apps: [
    {
      name: 'lms-1seller',
      script: 'node_modules/.bin/next',
      args: 'start -p 3100',
      cwd: '/var/www/lms-1seller',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      max_memory_restart: '300M',
      autorestart: true,
    },
  ],
};
