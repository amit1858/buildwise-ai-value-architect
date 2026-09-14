import { Suspense } from "react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export function generateStaticParams() {
  const sections = [
    "spine",
    "suitability",
    "build-path",
    "workflow",
    "scenarios",
    "prompts",
    "test",
    "build-kit",
    "blueprint",
  ];
  return ["demo-support-project", "local"].flatMap((projectId) => sections.map((section) => ({ projectId, section })));
}

export default async function WorkspaceRoute({ params }: { params: Promise<{ projectId: string; section: string }> }) {
  const { projectId, section } = await params;
  return <Suspense fallback={<main className="bw-page p-10 text-stone-700">Loading workspace…</main>}><WorkspaceShell projectId={projectId} section={section ?? "spine"} publicDemo={process.env.PUBLIC_DEMO === "true"} /></Suspense>;
}
