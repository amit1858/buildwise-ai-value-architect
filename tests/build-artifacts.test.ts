import { describe, expect, it } from "vitest";
import { buildDemoProject, type Project } from "@/lib/buildwise";
import { BUILD_ARTIFACT_IDS, buildCompleteExportBundle, generateBuildArtifacts, generateCopilotInstructionsMarkdown } from "@/lib/build-artifacts";

describe("build artifact fulfilment", () => {
  const project = buildDemoProject();

  it("generates all 16 artifact IDs and includes the project identity in each artifact", () => {
    const artifacts = generateBuildArtifacts(project, "balanced");

    expect(artifacts).toHaveLength(16);
    expect(BUILD_ARTIFACT_IDS).toHaveLength(16);
    expect(new Set(artifacts.map((artifact) => artifact.id)).size).toBe(16);

    for (const artifact of artifacts) {
      expect(artifact.content).toContain(project.name);
      expect(artifact.content).toContain(project.id);
      expect(artifact.fileName).toMatch(/\.md$/);
    }
  });

  it("reflects the selected scenario and regenerates routing/prompt artifacts when workflow content changes", () => {
    const scenarioDriven = generateBuildArtifacts(project, "assurance");
    const tokenArtifact = scenarioDriven.find((artifact) => artifact.id === "token-and-cost-forecast");
    expect(tokenArtifact?.content).toContain("Assurance");

    const changedProject: Project = {
      ...project,
      tasks: project.tasks.map((task, index) => index === 0 ? { ...task, name: `${task.name} v2` } : task),
    };
    const regenerated = generateBuildArtifacts(changedProject, "balanced");
    const routingArtifact = regenerated.find((artifact) => artifact.id === "model-routing-matrix");
    expect(routingArtifact?.content).toContain("v2");
    const promptArtifact = regenerated.find((artifact) => artifact.id === "prompt-pack");
    expect(promptArtifact?.content).toContain(changedProject.tasks[0].name);
  });

  it("creates materially different guidance for low-code, pro-code and hybrid build paths", () => {
    const lowCodeProject: Project = { ...project, recommendedBuildPath: "low-code" };
    const proCodeProject: Project = { ...project, recommendedBuildPath: "pro-code" };
    const hybridProject: Project = { ...project, recommendedBuildPath: "hybrid" };

    const lowCode = generateBuildArtifacts(lowCodeProject, "balanced").find((artifact) => artifact.id === "low-code-implementation-guide")?.content ?? "";
    const proCode = generateBuildArtifacts(proCodeProject, "balanced").find((artifact) => artifact.id === "pro-code-implementation-guide")?.content ?? "";
    const hybrid = generateBuildArtifacts(hybridProject, "balanced").find((artifact) => artifact.id === "hybrid-responsibility-map")?.content ?? "";

    expect(lowCode).toContain("Low-code");
    expect(proCode).toContain("Pro-code");
    expect(hybrid).toContain("Hybrid");
    expect(lowCode).not.toBe(proCode);
    expect(proCode).not.toBe(hybrid);
  });

  it("keeps deterministic tasks out of model-lead prompt generation", () => {
    const deterministicProject: Project = {
      ...project,
      tasks: project.tasks.map((task) => ({ ...task, needsLLM: false })),
    };

    const prompts = generateBuildArtifacts(deterministicProject, "balanced").find((artifact) => artifact.id === "prompt-pack");
    expect(prompts?.content).toContain("Deterministic");
    expect(prompts?.content).not.toContain("Use only supplied evidence.");
  });

  it("removes secrets from generated Copilot instructions and exported files", () => {
    const instructions = generateCopilotInstructionsMarkdown(project);
    expect(instructions).not.toMatch(/sk-[A-Za-z0-9_-]+/i);
    expect(instructions).not.toMatch(/AIza[0-9A-Za-z\-_.]{10,}/i);
    expect(instructions).not.toMatch(/ghp_[A-Za-z0-9]{10,}/i);
    expect(instructions).not.toMatch(/Bearer\s+[A-Za-z0-9._-]+/i);

    const artifact = generateBuildArtifacts(project, "balanced").find((item) => item.id === "executive-brief");
    expect(artifact?.content).toContain("Public demo restriction");
    expect(artifact?.content).not.toMatch(/sk-[A-Za-z0-9_-]+/i);
  });

  it("exports a complete package with the expected filenames", () => {
    const bundle = buildCompleteExportBundle(project, "balanced");
    const filenames = bundle.artifacts.map((artifact) => artifact.fileName);

    expect(filenames).toHaveLength(16);
    expect(filenames).toContain("01-executive-brief.md");
    expect(filenames).toContain("13-github-copilot-agent-prompt.md");
    expect(filenames).toContain("16-hybrid-responsibility-map.md");
    expect(bundle.fileName).toContain("build-kit");
  });
});
