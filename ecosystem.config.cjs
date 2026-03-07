module.exports = {
  apps: [{
    name: "ext---socialflowz",
    cwd: "/home/claude/ext---socialflowz",
    script: "bash",
    args: ["-c", "export PORT=3012 && flox activate -- pnpm dev -- --port 3012 --host"],
    env: {
      PORT: 3012
    },
    autorestart: true,
    watch: false
  }]
};
