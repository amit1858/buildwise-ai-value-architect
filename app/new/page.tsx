import { Suspense } from "react";
import { ProjectIntake } from "@/components/intake/ProjectIntake";

export default function NewProjectPage() {
  return <Suspense fallback={<main className="bw-page p-10 text-stone-700">Loading intake…</main>}><ProjectIntake /></Suspense>;
}
