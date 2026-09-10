import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const baseURL = "http://localhost:3001";
const outputDir = path.resolve("artifacts/final-screenshots");
const viewports = [
  { name: "desktop-wide", width: 1440, height: 1000 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
];

test.describe("BuildWise final evidence", () => {
  test.beforeAll(() => fs.mkdirSync(outputDir, { recursive: true }));

  test("demo journey and evidence capture", async ({ browser }) => {
    const page = await browser.newPage({ viewport: viewports[0] });
    const manifest: Array<{ name: string; route: string; viewport: string; theme: string; capturedAt: string; sourceCommit: string }> = [];
    page.on("dialog", async (dialog) => dialog.accept());
    const capture = async (name: string, route: string, action?: () => Promise<void>) => {
      await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
      if (action) await action();
      await page.screenshot({ path: path.join(outputDir, `${name}-${viewports[0].name}.png`), fullPage: true });
      manifest.push({ name, route, viewport: `${viewports[0].width}x${viewports[0].height}`, theme: "light", capturedAt: new Date().toISOString(), sourceCommit: process.env.GITHUB_SHA ?? "local" });
    };

    await capture("landing", "/");
    await expect(page.getByText("Customer-support optimisation", { exact: false }).first()).toBeVisible();
    await page.getByRole("button", { name: /try the interactive demo/i }).click();
    await page.waitForURL(/\/workspace\/.+\/spine/);
    const projectPath = new URL(page.url()).pathname.split("/").slice(0, 3).join("/");

    await capture("workload-spine", `${projectPath}/spine`);
    await capture("editable-workflow", `${projectPath}/workflow`, async () => {
      await expect(page.getByTestId("routing-editor")).toBeVisible();
    });
    await capture("scenario-comparison", `${projectPath}/scenarios`);
    await capture("calculation-drawer", `${projectPath}/scenarios`, async () => {
      await page.getByRole("button", { name: /view calculation/i }).first().click();
    });
    await capture("prompt-comparison", `${projectPath}/prompts`);
    await capture("controlled-test-preview", `${projectPath}/test`);
    await page.getByRole("button", { name: /run demo test/i }).click();
    await expect(page.getByText(/Simulated demo result/i)).toBeVisible();
    await page.screenshot({ path: path.join(outputDir, `simulated-result-${viewports[0].name}.png`), fullPage: true });
    await expect(page.getByRole("button", { name: /live provider test/i })).toBeDisabled();
    await expect(page.getByText(/No paid provider call was made/i)).toBeVisible();
    await page.screenshot({ path: path.join(outputDir, `simulation-result-${viewports[0].name}.png`), fullPage: true });
    await capture("suitability", `${projectPath}/suitability`);
    await capture("build-path", `${projectPath}/build-path`, async () => {
      await page.getByRole("button", { name: /use this path/i }).first().click();
      await expect(page.getByText(/Selected recommendation/i)).toBeVisible();
    });
    await capture("build-kit", `${projectPath}/build-kit`);
    await capture("blueprint", `${projectPath}/blueprint`);
    await capture("provider-configuration", "/settings/providers");
    await expect(page.getByText(/credentials cannot be entered/i)).toBeVisible();

    for (const viewport of viewports.slice(1)) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(outputDir, `landing-${viewport.name}.png`), fullPage: true });
      manifest.push({ name: "landing", route: "/", viewport: `${viewport.width}x${viewport.height}`, theme: "light", capturedAt: new Date().toISOString(), sourceCommit: process.env.GITHUB_SHA ?? "local" });
      await page.goto(`${baseURL}${projectPath}/blueprint`, { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(outputDir, `blueprint-${viewport.name}.png`), fullPage: true });
      manifest.push({ name: "blueprint", route: `${projectPath}/blueprint`, viewport: `${viewport.width}x${viewport.height}`, theme: "light", capturedAt: new Date().toISOString(), sourceCommit: process.env.GITHUB_SHA ?? "local" });
    }

    const storage = await page.evaluate(() => ({
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage),
      values: [...Object.values(localStorage), ...Object.values(sessionStorage)].join("\n"),
    }));
    expect(storage.values).not.toMatch(/sk-[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9._-]{10,}/i);
    fs.writeFileSync(path.join(outputDir, "browser-storage-audit.json"), JSON.stringify(storage, null, 2));
    fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  });
});
