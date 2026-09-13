import { copyFileSync, readdirSync } from "node:fs";
import path from "node:path";

export function materializeStaticRscAliases(outputDirectory) {
  const aliases = [];

  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const source = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(source);
        continue;
      }
      if (entry.name !== "__PAGE__.txt") continue;

      const relativeSegments = path.relative(outputDirectory, source).split(path.sep);
      const nextSegmentIndex = relativeSegments.findIndex((segment) => segment.startsWith("__next."));
      if (nextSegmentIndex < 0) continue;

      const targetName = relativeSegments.slice(nextSegmentIndex).join(".");
      const target = path.join(outputDirectory, ...relativeSegments.slice(0, nextSegmentIndex), targetName);
      copyFileSync(source, target);
      aliases.push(path.relative(outputDirectory, target));
    }
  };

  visit(outputDirectory);
  return aliases;
}
