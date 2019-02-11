module.exports = {
  apps: [
    {
      name: 'WebAuthn',
      script: 'npm',
      args: 'start',
      watch: ['server'],
      env: {
        PORT: 8084,
        NODE_ENV: 'production',
        SECRET_KEY: 'CHANGE ME',
        COOKIE_SECRET_KEY1: 'CHANGE ME 1',
        COOKIE_SECRET_KEY2: 'CHANGE ME 2',
        COOKIE_SECRET_KEY3: 'CHANGE ME 3',
      },
    },
  ],
};
