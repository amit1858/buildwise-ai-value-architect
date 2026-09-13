import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "out", ".playwright-mcp", "artifacts", "deployment-evidence"]);
const textExtensions = new Set([".css", ".js", ".json", ".jsx", ".md", ".mjs", ".ts", ".tsx", ".yml", ".yaml"]);
const mojibakePatterns = [new RegExp("^\\uFEFF"), new RegExp("\\u00e2[\\u0080-\\u00bf]?", "u"), new RegExp("\\u00c3[\\u0080-\\u00bf]?", "u"), new RegExp("\\uFFFD", "u")];
const findings = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (textExtensions.has(path.extname(entry.name))) {
      const content = await readFile(fullPath, "utf8");
      for (const pattern of mojibakePatterns) if (pattern.test(content)) findings.push(`${path.relative(root, fullPath)}: ${pattern}`);
    }
  }
}

await walk(root);
if (findings.length) {
  console.error("UTF-8/mojibake scan failed:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}
console.log("UTF-8/mojibake scan passed.");
