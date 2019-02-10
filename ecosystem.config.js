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
      },
    },
  ],
};
