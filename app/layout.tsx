import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeControl } from "@/components/ThemeControl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildWise",
  description: "Design cost-aware enterprise AI systems with task-level model routing, prompt optimization, token forecasting, budget policies and BYOK provider support.",
  openGraph: {
    title: "BuildWise — AI Value Architect",
    description: "Turn an enterprise AI idea into a cost-aware operating blueprint.",
    type: "website",
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
        <div className="global-theme-control"><ThemeControl /></div>
        {children}
      </body>
    </html>
  );
}
