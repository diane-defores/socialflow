module.exports = {
  apps: [{
    name: "socialglowz",
    cwd: __dirname,
    script: "bash",
    args: ["-lc", "export PORT=3022 && flox activate -- bash -lc 'pnpm dev -- --port 3022 --host'"],
    env: {
      PORT: 3022
    },
    autorestart: true,
    watch: false
  }]
};
