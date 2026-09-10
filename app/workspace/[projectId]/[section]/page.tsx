import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export function generateStaticParams() {
  return [
    "spine",
    "suitability",
    "build-path",
    "workflow",
    "scenarios",
    "prompts",
    "test",
    "build-kit",
    "blueprint",
  ].map((section) => ({ projectId: "demo-support-project", section }));
}

export default async function WorkspaceRoute({ params }: { params: Promise<{ projectId: string; section: string }> }) {
  const { projectId, section } = await params;
  return <WorkspaceShell projectId={projectId} section={section ?? "spine"} publicDemo={process.env.PUBLIC_DEMO === "true"} />;
}
