import { type IntakeForm, type Project } from "@/lib/buildwise";
import {
  createDemoProjectState,
  deleteProjectState,
  generateProjectState,
  listProjectStates,
  loadProjectState,
  migrateLegacyBrowserState,
  saveProjectState,
} from "@/lib/project-state";

export function listProjects(): Project[] {
  migrateLegacyBrowserState();
  return listProjectStates().flatMap((state) => state.project ? [state.project] : []);
}

export function saveProject(project: Project) {
  migrateLegacyBrowserState();
  const loaded = loadProjectState(project.id);
  const timestamp = new Date().toISOString();
  saveProjectState({
    schemaVersion: 2,
    projectId: project.id,
    kind: project.kind ?? (project.id === "demo-support-project" ? "demo" : "generated"),
    createdAt: loaded.ok ? loaded.state.createdAt : project.createdAt || timestamp,
    updatedAt: timestamp,
    intakeStep: 3,
    intake: project.input,
    project,
  });
  return project;
}

export function createProjectFromInput(input: IntakeForm, projectId?: string): Project {
  const id = projectId ?? `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return generateProjectState(id, input).project!;
}

export function getProjectById(projectId: string): Project | null {
  migrateLegacyBrowserState();
  const loaded = loadProjectState(projectId);
  return loaded.ok ? loaded.state.project : null;
}

export function ensureSeedProject() {
  migrateLegacyBrowserState();
  const existing = getProjectById("demo-support-project");
  return existing ?? createDemoProjectState().project!;
}

export function deleteProject(projectId: string) {
  deleteProjectState(projectId);
}

export function resetDemoProjects() {
  deleteProjectState("demo-support-project");
  return createDemoProjectState().project!;
}
