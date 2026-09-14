import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amit1858.github.io/buildwise-ai-value-architect/"),
  title: {
    default: "BuildWise: AI Value Architect",
    template: "%s | BuildWise",
  },
  description: "Design cost-aware enterprise AI systems with task-level model routing, prompt optimization, token forecasting, budget policies and BYOK provider support.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BuildWise: AI Value Architect",
    description: "Turn an enterprise AI idea into a cost-aware operating blueprint with deterministic routing, context budgets, and implementation artifacts.",
    url: "/",
    siteName: "BuildWise",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildWise: AI Value Architect",
    description: "Plan enterprise AI systems with task-level routing, token economics, and implementation Build Kits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: `(() => { const p = localStorage.getItem('buildwise-theme') || 'system'; const d = p === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : p; document.documentElement.dataset.theme = d; document.documentElement.style.colorScheme = d; })()` }} />
        <a className="skip-link" href="#main-content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
