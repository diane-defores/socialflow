module.exports = {
  apps: [{
    name: "ext---socialflowz",
    cwd: "/home/claude/ext---socialflowz",
    script: "bash",
    args: ["-c", "export PORT=3000 && flox activate -- pnpm dev -- --port 3000 --host"],
    env: {
      PORT: 3000
    },
    autorestart: true,
    watch: false
  }]
};
