"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeControl } from "@/components/ThemeControl";
import { createBlankProjectState, listProjectStates, migrateLegacyBrowserState } from "@/lib/project-state";
import { workspaceHref } from "@/lib/navigation";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const openWorkspace = () => {
    migrateLegacyBrowserState();
    const latest = listProjectStates().filter((state) => state.project && state.kind !== "demo").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    router.push(latest?.project ? workspaceHref(latest.projectId, "spine") : "/");
  };
  const startBlueprint = () => {
    const state = createBlankProjectState();
    router.push(`/new?project=${encodeURIComponent(state.projectId)}`);
  };

  return (
    <header className={`site-header ${compact ? "site-header-compact" : ""}`}>
      <div className="site-header-inner">
        <Link href="/" className="brand-lockup" aria-label="BuildWise home">
          <span className="brand-mark" aria-hidden="true">BW</span>
          <span>
            <strong>BuildWise</strong>
            <small>AI Value Architect</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/#product">Product</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/settings/providers">Providers</Link>
          <a href="https://github.com/amit1858/buildwise-ai-value-architect">GitHub</a>
        </nav>

        <div className="site-actions">
          <ThemeControl />
          {!compact && (
            <button type="button" onClick={openWorkspace} className="bw-action-secondary site-workspace-button">
              Open workspace
            </button>
          )}
          <button type="button" onClick={startBlueprint} className="bw-action-primary site-cta">Start blueprint</button>
        </div>

        <details className="mobile-menu">
          <summary>Menu</summary>
          <div className="mobile-menu-panel">
            <Link href="/#product">Product</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/settings/providers">Providers</Link>
            <a href="https://github.com/amit1858/buildwise-ai-value-architect">GitHub</a>
            <button type="button" onClick={openWorkspace}>Open workspace</button>
            <button type="button" onClick={startBlueprint}>Start blueprint</button>
            <ThemeControl />
          </div>
        </details>
      </div>
    </header>
  );
}
