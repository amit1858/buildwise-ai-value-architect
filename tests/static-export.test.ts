import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { materializeStaticRscAliases } from "../scripts/materialize-static-rsc-aliases.mjs";

describe("GitHub Pages static export", () => {
  it("materializes the flattened RSC payload names requested by client navigation", () => {
    const output = mkdtempSync(path.join(tmpdir(), "buildwise-static-export-"));
    try {
      const methodology = path.join(output, "methodology", "__next.methodology");
      const workspace = path.join(output, "workspace", "demo", "spine", "__next.workspace", "$d$projectId", "$d$section");
      mkdirSync(methodology, { recursive: true });
      mkdirSync(workspace, { recursive: true });
      writeFileSync(path.join(methodology, "__PAGE__.txt"), "methodology");
      writeFileSync(path.join(workspace, "__PAGE__.txt"), "workspace");

      expect(materializeStaticRscAliases(output)).toHaveLength(2);
      expect(readFileSync(path.join(output, "methodology", "__next.methodology.__PAGE__.txt"), "utf8")).toBe("methodology");
      expect(readFileSync(path.join(output, "workspace", "demo", "spine", "__next.workspace.$d$projectId.$d$section.__PAGE__.txt"), "utf8")).toBe("workspace");
    } finally {
      rmSync(output, { recursive: true, force: true });
    }
  });
});
