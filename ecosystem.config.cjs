module.exports = {
  apps: [{
    name: "SocialFlow",
    cwd: "/home/claude/SocialFlow",
    script: "bash",
    args: ["-c", "export PORT=3022 && flox activate -- pnpm dev -- --port 3022 --host"],
    env: {
      PORT: 3022
    },
    autorestart: true,
    watch: false
  }]
};
