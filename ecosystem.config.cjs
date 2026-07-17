module.exports = {
  apps: [
    {
      name: 'docflo',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3007',
      instances: 1, // You can increase this to 'max' for cluster mode if your VPS has multiple cores
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
      },
    },
  ],
};
