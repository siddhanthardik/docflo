module.exports = {
  apps: [
    {
      name: 'gyrex',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'server.ts',
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
