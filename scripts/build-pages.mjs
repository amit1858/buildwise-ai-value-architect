import { spawnSync } from "node:child_process";
import path from "node:path";
import { materializeStaticRscAliases } from "./materialize-static-rsc-aliases.mjs";

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, PUBLIC_DEMO: "true" },
  shell: process.platform === "win32",
});

if (result.error) console.error(result.error.message);
if (result.status === 0) {
  const aliases = materializeStaticRscAliases(path.resolve("out"));
  console.log(`Materialized ${aliases.length} static RSC route aliases.`);
}
process.exit(result.status ?? 1);
