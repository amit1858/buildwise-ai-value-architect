import {
  buildDemoProject,
  buildProjectFromForm,
  type IntakeForm,
  type Project,
} from "@/lib/buildwise";

const STORAGE_KEY = "buildwise-projects";

function readProjects(): Project[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listProjects(): Project[] {
  return readProjects();
}

export function saveProject(project: Project) {
  const projects = readProjects();
  const next = [...projects.filter((entry) => entry.id !== project.id), project];
  writeProjects(next);
  return project;
}

export function createProjectFromInput(input: IntakeForm): Project {
  const project = buildProjectFromForm(input);
  saveProject(project);
  return project;
}

export function getProjectById(projectId: string): Project | null {
  const project = readProjects().find((entry) => entry.id === projectId);
  return project ?? null;
}

export function ensureSeedProject() {
  const projects = readProjects();
  if (projects.length > 0) return projects[0];
  const project = buildDemoProject();
  saveProject(project);
  return project;
}

export function deleteProject(projectId: string) {
  const remaining = readProjects().filter((entry) => entry.id !== projectId);
  writeProjects(remaining);
}

export function resetDemoProjects() {
  writeProjects([]);
  const project = buildDemoProject();
  saveProject(project);
  return project;
}
