export function workspaceHref(projectId: string, section = "spine"): string {
  const publicDemo = process.env.NEXT_PUBLIC_BUILDWISE_PUBLIC_DEMO === "true";
  return publicDemo
    ? `/workspace/local/${section}?project=${encodeURIComponent(projectId)}`
    : `/workspace/${encodeURIComponent(projectId)}/${section}`;
}
