const { spawn } = require("node:child_process");
const path = require("node:path");

const cwd = path.resolve(__dirname, "..");

function run(name, cmd, args) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    if (typeof code === "number" && code !== 0) process.exit(code);
  });

  return child;
}

const api = run("api", "tsx", ["watch", "src/index.ts"]);
const worker = run("worker", "tsx", ["watch", "src/workers/eventWorker.ts"]);

function shutdown() {
  api.kill("SIGINT");
  worker.kill("SIGINT");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

