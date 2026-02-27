module.exports = {
  apps: [{
    name: "ext---socialflowz",
    cwd: "/home/claude/ext---socialflowz",
    script: "bash",
    args: ["-c", "export PORT=3011 && flox activate -- pnpm dev -- --port 3011 --host"],
    env: {
      PORT: 3011
    },
    autorestart: true,
    watch: false
  }]
};
