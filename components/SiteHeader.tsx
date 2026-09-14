"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeControl } from "@/components/ThemeControl";
import { ensureSeedProject } from "@/lib/project-store";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const openWorkspace = () => {
    const project = ensureSeedProject();
    router.push(`/workspace/${project.id}/spine`);
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
          <Link href="/new" className="bw-action-primary site-cta">Start blueprint</Link>
        </div>

        <details className="mobile-menu">
          <summary>Menu</summary>
          <div className="mobile-menu-panel">
            <Link href="/#product">Product</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/settings/providers">Providers</Link>
            <a href="https://github.com/amit1858/buildwise-ai-value-architect">GitHub</a>
            <button type="button" onClick={openWorkspace}>Open workspace</button>
            <Link href="/new">Start blueprint</Link>
            <ThemeControl />
          </div>
        </details>
      </div>
    </header>
  );
}
