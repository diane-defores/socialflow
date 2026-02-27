module.exports = {
  apps: [{
    name: "ext---socialflowz",
    cwd: "/home/claude/ext---socialflowz",
    script: "bash",
    args: ["-c", "export PORT=3003 && flox activate -- pnpm dev -- --port 3003 --host"],
    env: {
      PORT: 3003
    },
    autorestart: true,
    watch: false
  }]
};
