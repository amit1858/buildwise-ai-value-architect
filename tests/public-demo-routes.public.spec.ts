import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("PUBLIC_DEMO supports browser-local local routes without API or provider traffic", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.getByRole("button", { name: "Start new blueprint" }).click();
  await page.getByLabel("Project name").fill("Public local blueprint");
  await page.getByLabel("Business problem").fill("Summarize cited operational evidence with human review.");
  await page.getByLabel("Desired business outcome").fill("Improve review consistency.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Business executions per month").fill("5000");
  await page.getByLabel("Typical input value").fill("500");
  await page.getByLabel("High-case / P95 input value").fill("1000");
  await page.getByLabel("Typical output value").fill("150");
  await page.getByLabel("Sample input").fill("Representative public-demo input.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Review and analyse" }).click();
  await expect(page).toHaveURL(/\/buildwise-ai-value-architect\/workspace\/local\/spine\/\?project=project-/);
  const localUrl = page.url();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page).toHaveURL(localUrl);
  await expect(page.getByText("Public local blueprint", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Controlled test" }).click();
  const beforeSimulation = requests.length;
  await page.getByRole("button", { name: "Run demo test" }).click();
  await expect(page.getByText("Simulated demo result")).toBeVisible();
  expect(requests.slice(beforeSimulation).filter((url) => /\/api\/|openai|anthropic|nvidia\.com/i.test(url))).toEqual([]);
  await expect(page.getByRole("button", { name: "Live provider test" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Providers" })).toHaveCount(0);
});

test("PUBLIC_DEMO direct and refreshed demo/local section routes remain available", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore customer-support demo" }).click();
  await page.getByRole("link", { name: "Build path" }).click();
  await expect(page).toHaveURL(/\/buildwise-ai-value-architect\/workspace\/local\/build-path\/\?project=demo-support-project/);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Seeded demo")).toBeVisible();

  await page.goto("/workspace/demo-support-project/spine/");
  await expect(page.getByText("Customer-support operations", { exact: true }).first()).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Seeded demo")).toBeVisible();
});
