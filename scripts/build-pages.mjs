import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, PUBLIC_DEMO: "true" },
  shell: process.platform === "win32",
});

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
