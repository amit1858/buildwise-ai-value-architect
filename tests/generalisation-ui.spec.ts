import { expect, test, type Download, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

test.setTimeout(120_000);

type Scenario = {
  name: string;
  industry: string;
  problem: string;
  users: string;
  outcome: string;
  currentProcess: string;
  sample: string;
  category: string;
  suitability: string;
  domainText: string[];
  invariants: Array<{ taskId: string; text: string }>;
  llmTaskId: string;
  quality: "standard" | "high" | "critical";
  dataSensitivity: "internal" | "confidential" | "regulated";
  buildPreference: "pro-code" | "low-code" | "architecture";
};

const scenarios: Scenario[] = [
  {
    name: "Customer support triage",
    industry: "Technology",
    problem: "Triage support contacts, retrieve policy evidence, and draft grounded replies.",
    users: "Support agents",
    outcome: "Improve response quality and handling time.",
    currentProcess: "Agents manually route contacts and search policy documents.",
    sample: "A customer reports a billing mismatch and requests escalation.",
    category: "Customer-support operations",
    suitability: "Suitable only for selected workflow stages",
    domainText: ["Contact routing", "Policy evidence retrieval", "Grounded response drafting"],
    invariants: [{ taskId: "response-draft", text: "Review high-risk or customer-impacting responses" }],
    llmTaskId: "fact-extraction",
    quality: "high",
    dataSensitivity: "internal",
    buildPreference: "pro-code",
  },
  {
    name: "Pharmaceutical adverse-event intake",
    industry: "Pharmaceuticals",
    problem: "Capture adverse-event reports with citations and specialist review without autonomous reportability decisions.",
    users: "Pharmacovigilance specialists",
    outcome: "Improve complete and compliant intake.",
    currentProcess: "Specialists manually transcribe reports and consult controlled procedures.",
    sample: "A patient reported a serious event after treatment, with reporter and product details.",
    category: "Regulated adverse-event intake",
    suitability: "Suitable only for selected workflow stages",
    domainText: ["Adverse-event case intake", "Label and procedure evidence retrieval", "Reportability decision gate"],
    invariants: [{ taskId: "case-intake", text: "Mandatory pharmacovigilance specialist review" }, { taskId: "reportability-gate", text: "No autonomous reportability decision" }],
    llmTaskId: "case-intake",
    quality: "critical",
    dataSensitivity: "regulated",
    buildPreference: "pro-code",
  },
  {
    name: "Accounts-payable invoice processing",
    industry: "Finance",
    problem: "Use OCR to extract invoices then deterministically validate supplier, purchase order, tax, and totals.",
    users: "Accounts payable analysts",
    outcome: "Reduce invoice cycle time without weakening payment controls.",
    currentProcess: "Analysts key invoice fields and manually perform three-way matching.",
    sample: "Invoice 1007 references purchase order 88 and includes three taxable line items.",
    category: "Accounts-payable document processing",
    suitability: "Suitable only for selected workflow stages",
    domainText: ["Totals and tax validation", "Supplier and purchase-order match", "Invoice OCR and field extraction"],
    invariants: [{ taskId: "arithmetic", text: "Route exceptions to accounts payable" }],
    llmTaskId: "document-capture",
    quality: "high",
    dataSensitivity: "confidential",
    buildPreference: "low-code",
  },
  {
    name: "Industrial maintenance diagnosis",
    industry: "Manufacturing",
    problem: "Combine sensor events and maintenance history into safety-aware diagnostic recommendations.",
    users: "Maintenance technicians",
    outcome: "Reduce safe diagnosis time and repeat failures.",
    currentProcess: "Technicians compare alarms, manuals, and work orders manually.",
    sample: "Pump vibration exceeded its operating envelope after a bearing replacement.",
    category: "Safety-aware industrial maintenance",
    suitability: "Suitable only for selected workflow stages",
    domainText: ["Safety and lockout gate", "Candidate diagnosis synthesis", "Maintenance history retrieval"],
    invariants: [{ taskId: "diagnosis", text: "Human technician approval is mandatory" }],
    llmTaskId: "diagnosis",
    quality: "critical",
    dataSensitivity: "internal",
    buildPreference: "architecture",
  },
  {
    name: "Enterprise account research",
    industry: "B2B SaaS",
    problem: "Synthesize current account initiatives, buying signals, risks, and stakeholders from cited fresh sources.",
    users: "Enterprise account teams",
    outcome: "Improve research quality and outreach relevance.",
    currentProcess: "Analysts manually combine CRM, filings, news, and call notes.",
    sample: "Research recent initiatives and buying-committee changes at a global manufacturer.",
    category: "Citation-grounded account research",
    suitability: "Suitable only for selected workflow stages",
    domainText: ["Cited account synthesis", "Citation and freshness validation", "Account evidence retrieval"],
    invariants: [{ taskId: "account-retrieval", text: "Every material claim requires a citation and freshness date" }],
    llmTaskId: "synthesis",
    quality: "high",
    dataSensitivity: "confidential",
    buildPreference: "architecture",
  },
  {
    name: "Payroll tax calculation",
    industry: "Payroll",
    problem: "Calculate payroll tax and withholding from versioned statutory rules with exact arithmetic.",
    users: "Payroll specialists",
    outcome: "Improve calculation auditability and rule-version control.",
    currentProcess: "Payroll specialists maintain jurisdiction tables and reconcile calculations.",
    sample: "Calculate withholding for the current period from approved jurisdiction rules.",
    category: "Deterministic payroll tax calculation",
    suitability: "Primarily deterministic automation",
    domainText: ["Payroll tax calculation", "Calculation reconciliation", "Effective tax-rule selection"],
    invariants: [{ taskId: "tax-calculation", text: "LLMs must not calculate withholding or liability" }],
    llmTaskId: "explanation",
    quality: "critical",
    dataSensitivity: "regulated",
    buildPreference: "pro-code",
  },
];

const workspaceSections = ["AI suitability", "Build path", "Workflow", "Scenarios", "Prompts", "Controlled test", "Build kit", "Blueprint"] as const;
const supportOnlyPhrases = ["Customer-support operations", "Support agents", "billing mismatch", "Contact routing", "Policy evidence retrieval"];
const evidenceRoot = process.env.BUILDWISE_EVIDENCE_DIR;

function evidencePath(scenarioName: string, fileName: string) {
  if (!evidenceRoot) return null;
  const directory = path.join(evidenceRoot, "scenarios", scenarioName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  mkdirSync(directory, { recursive: true });
  return path.join(directory, fileName);
}

async function expectValues(page: Page, values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) await expect(page.getByLabel(label)).toHaveValue(value);
}

async function refreshAndExpect(page: Page, values: Record<string, string>) {
  await page.reload({ waitUntil: "networkidle" });
  await expectValues(page, values);
}

async function readDownload(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function openTask(page: Page, taskId: string) {
  const row = page.getByTestId(`task-row-${taskId}`);
  const taskName = await row.locator("input").inputValue();
  const editor = page.getByTestId("routing-editor");
  if (!await editor.isVisible() || !((await editor.innerText()).includes(taskName))) await row.getByRole("button").click();
  await expect(editor).toContainText(taskName);
}

async function expectExplicitButtonTypes(page: Page) {
  await expect(page.locator("button:not([type])")).toHaveCount(0);
}

async function startBlank(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start new blueprint" }).click();
  await expect(page).toHaveURL(/\/new\?project=project-/);
  await expectValues(page, {
    "Project name": "",
    "Industry": "",
    "Business problem": "",
    "Target users": "",
    "Desired business outcome": "",
    "Current process or baseline": "",
  });
}

async function completeIntake(page: Page, scenario: Scenario) {
  await startBlank(page);

  await page.getByLabel("Project name").fill(scenario.name);
  await page.getByLabel("Industry").fill(scenario.industry);
  await page.getByLabel("Business problem").fill(scenario.problem);
  await page.getByLabel("Target users").fill(scenario.users);
  await page.getByLabel("Desired business outcome").fill(scenario.outcome);
  await page.getByLabel("Current process or baseline").fill(scenario.currentProcess);
  await refreshAndExpect(page, {
    "Project name": scenario.name,
    "Industry": scenario.industry,
    "Business problem": scenario.problem,
    "Target users": scenario.users,
    "Desired business outcome": scenario.outcome,
    "Current process or baseline": scenario.currentProcess,
  });
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Business executions per month").fill("12000");
  await page.getByLabel("Peak concurrency").fill("14");
  await page.getByLabel("Workload mode").selectOption("mixed");
  await page.getByLabel("Typical input value").fill("800");
  await page.getByLabel("Typical input unit").selectOption("words");
  await page.getByLabel("High-case / P95 input value").fill("2000");
  await page.getByLabel("High-case / P95 input unit").selectOption("words");
  await page.getByLabel("Typical output value").fill("250");
  await page.getByLabel("Typical output unit").selectOption("words");
  await page.getByLabel("Average attachments per execution").fill("2");
  await page.getByLabel("Average conversation turns").fill("3");
  await page.getByLabel("Sample input").fill(scenario.sample);
  await page.getByText("Advanced assumptions").click();
  await page.getByLabel("Average attachment pages or size").fill("4");
  await page.getByLabel("Retrieved passages per execution").fill("7");
  await page.getByLabel("Average tokens per passage").fill("320");
  await page.getByLabel("Reusable / cached context (%)").fill("25");
  await page.getByLabel("Peak-volume multiplier").fill("1.7");
  await page.getByLabel("Target response time (seconds)").fill("12");
  await refreshAndExpect(page, {
    "Business executions per month": "12000",
    "Peak concurrency": "14",
    "Workload mode": "mixed",
    "Typical input value": "800",
    "Typical input unit": "words",
    "High-case / P95 input value": "2000",
    "High-case / P95 input unit": "words",
    "Typical output value": "250",
    "Typical output unit": "words",
    "Average attachments per execution": "2",
    "Average conversation turns": "3",
    "Sample input": scenario.sample,
    "Average attachment pages or size": "4",
    "Retrieved passages per execution": "7",
    "Average tokens per passage": "320",
    "Reusable / cached context (%)": "25",
    "Peak-volume multiplier": "1.7",
    "Target response time (seconds)": "12",
  });
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Project name")).toHaveValue(scenario.name);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Sample input")).toHaveValue(scenario.sample);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Quality sensitivity").selectOption(scenario.quality);
  await page.getByLabel("Data sensitivity").selectOption(scenario.dataSensitivity);
  await page.getByLabel("Latency target").selectOption("< 20 seconds");
  await page.getByLabel("Human review required").selectOption("yes");
  await page.getByText("Data residency required").click();
  await page.getByText("Structured output required").click();
  await page.getByText("Local models allowed").click();
  await refreshAndExpect(page, {
    "Quality sensitivity": scenario.quality,
    "Data sensitivity": scenario.dataSensitivity,
    "Latency target": "< 20 seconds",
    "Human review required": "yes",
  });
  await expect(page.getByLabel("Data residency required")).toBeChecked();
  await expect(page.getByLabel("Structured output required")).toBeChecked();
  await expect(page.getByLabel("Local models allowed")).toBeChecked();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Sample input")).toHaveValue(scenario.sample);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Current process cost (USD per month)").fill("45000");
  await page.getByLabel("Expected value per outcome (USD)").fill("18");
  await page.getByLabel("Monthly AI budget").fill("10000");
  await page.getByLabel("Preferred providers").fill("Azure OpenAI, NVIDIA");
  await page.getByLabel("Build preference").selectOption(scenario.buildPreference);
  await refreshAndExpect(page, {
    "Current process cost (USD per month)": "45000",
    "Expected value per outcome (USD)": "18",
    "Monthly AI budget": "10000",
    "Preferred providers": "Azure OpenAI, NVIDIA",
    "Build preference": scenario.buildPreference,
  });
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Quality sensitivity")).toHaveValue(scenario.quality);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Review and analyse" }).click();
  await expect(page).toHaveURL(/\/workspace\/project-.+\/spine/);
}

for (const scenario of scenarios) {
  test(`${scenario.name} completes the complete visible-control journey`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await completeIntake(page, scenario);
    await expect(page.getByText(scenario.category, { exact: true }).first()).toBeVisible();

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText(scenario.category, { exact: true }).first()).toBeVisible();
    await expectExplicitButtonTypes(page);

    await page.getByRole("link", { name: "AI suitability" }).click();
    await expect(page.getByText(scenario.suitability, { exact: true })).toBeVisible();
    await expectExplicitButtonTypes(page);

    await page.getByRole("link", { name: "Build path" }).click();
    await expect(page.getByText("Low-code", { exact: true })).toBeVisible();
    await expect(page.getByText("Pro-code", { exact: true })).toBeVisible();
    await expect(page.getByText("Hybrid", { exact: true })).toBeVisible();
    await expectExplicitButtonTypes(page);

    await page.getByRole("link", { name: "Scenarios" }).click();
    const beforeCost = await page.getByTestId("scenario-cost-balanced").innerText();
    await expectExplicitButtonTypes(page);
    await page.getByRole("link", { name: "Workflow" }).click();
    for (const phrase of scenario.domainText) await expect(page.getByRole("textbox", { name: `${phrase} name` })).toHaveValue(phrase);
    for (const invariant of scenario.invariants) {
      await openTask(page, invariant.taskId);
      await expect(page.getByTestId("routing-editor")).toContainText(invariant.text);
    }
    if (scenario.name === "Accounts-payable invoice processing") {
      await expect(page.getByTestId("task-row-arithmetic")).toContainText("Calculation");
      await expect(page.getByTestId("task-row-arithmetic")).toContainText("Deterministic execution");
    }
    await openTask(page, scenario.llmTaskId);
    const tokenInput = page.getByTestId("routing-input-tokens");
    const previousTokens = Number(await tokenInput.inputValue());
    await tokenInput.fill(String(previousTokens + 1000));
    const callsInput = page.getByTestId("routing-calls");
    await callsInput.fill(String(Number(await callsInput.inputValue()) + 0.5));
    const retryInput = page.getByTestId("routing-retry-rate");
    await retryInput.fill(String(Math.min(0.9, Number(await retryInput.inputValue()) + 0.1)));
    const modelSelect = page.getByTestId("routing-primary-model");
    const currentModel = await modelSelect.inputValue();
    await modelSelect.selectOption(currentModel === "gpt-4.1" ? "gpt-4o-mini" : "gpt-4.1");
    await expectExplicitButtonTypes(page);
    await page.getByRole("link", { name: "Scenarios" }).click();
    await expect(page.getByTestId("scenario-cost-balanced")).not.toHaveText(beforeCost);
    const afterCost = await page.getByTestId("scenario-cost-balanced").innerText();
    await expectExplicitButtonTypes(page);

    await page.getByRole("link", { name: "Prompts" }).click();
    await expect(page.getByText("Prompt comparison", { exact: true })).toBeVisible();
    await expect(page.locator("main")).toContainText(scenario.domainText[0]);
    await expectExplicitButtonTypes(page);

    const networkRequests: string[] = [];
    page.on("request", (request) => networkRequests.push(request.url()));
    await page.getByRole("link", { name: "Controlled test" }).click();
    const requestStart = networkRequests.length;
    await page.getByRole("button", { name: "Run demo test" }).click();
    await expect(page.getByText("Simulated demo result")).toBeVisible();
    expect(networkRequests.slice(requestStart).filter((url) => /\/api\/|openai|anthropic|nvidia\.com/i.test(url))).toEqual([]);
    await expectExplicitButtonTypes(page);

    await page.getByRole("link", { name: "Build kit" }).click();
    await expectExplicitButtonTypes(page);
    const buildKitDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download complete Build Kit" }).click();
    const buildKitDownload = await buildKitDownloadPromise;
    const buildKit = await readDownload(buildKitDownload);
    expect(buildKit).toContain(scenario.name);

    await page.getByRole("link", { name: "Blueprint" }).click();
    await expectExplicitButtonTypes(page);
    const blueprintDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export JSON" }).click();
    const blueprintDownload = await blueprintDownloadPromise;
    const blueprint = await readDownload(blueprintDownload);
    expect(blueprint).toContain(scenario.name);
    expect(blueprint).toContain(scenario.problem);

    if (scenario.category !== "Customer-support operations") {
      for (const phrase of supportOnlyPhrases) {
        expect(buildKit.toLowerCase()).not.toContain(phrase.toLowerCase());
        expect(blueprint.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }
    for (const foreign of scenarios.filter((item) => item.name !== scenario.name && item.category !== "Customer-support operations")) {
      expect(buildKit).not.toContain(foreign.name);
      expect(blueprint).not.toContain(foreign.name);
    }

    for (const section of workspaceSections) await expect(page.getByRole("link", { name: section })).toBeVisible();
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    const buildKitFile = evidencePath(scenario.name, "build-kit.md");
    const blueprintFile = evidencePath(scenario.name, "blueprint.json");
    const journeyFile = evidencePath(scenario.name, "journey.json");
    const screenshotFile = evidencePath(scenario.name, "blueprint.png");
    if (buildKitFile && blueprintFile && journeyFile && screenshotFile) {
      writeFileSync(buildKitFile, buildKit, "utf8");
      writeFileSync(blueprintFile, blueprint, "utf8");
      writeFileSync(journeyFile, JSON.stringify({
        scenario,
        refreshEvidence: {
          stepsRefreshed: 4,
          exactValuesVerified: true,
          backContinueVerified: true,
          generatedRefreshVerified: true,
        },
        workspaceSections,
        economics: { balancedBefore: beforeCost, balancedAfter: afterCost, recalculated: beforeCost !== afterCost },
        controlledTest: { provenance: "demo-simulation", providerRequests: [] },
        exports: { buildKit: path.basename(buildKitFile), blueprint: path.basename(blueprintFile), contaminationScan: "passed" },
        consoleErrors,
        pageErrors,
      }, null, 2), "utf8");
      await page.screenshot({ path: screenshotFile, fullPage: true });
    }
  });
}

test("model-only routing changes preserve deterministic and LLM invariants and update economics", async ({ page }) => {
  await completeIntake(page, scenarios[2]);
  await page.getByRole("link", { name: "Scenarios" }).click();
  const initialCost = await page.getByTestId("scenario-cost-balanced").innerText();

  await page.getByRole("link", { name: "Workflow" }).click();
  await openTask(page, "arithmetic");
  await page.getByTestId("routing-primary-model").selectOption("gpt-4.1");
  await expect(page.getByTestId("routing-primary-provider")).toHaveValue("azure-openai");
  await expect(page.getByTestId("routing-calls")).toHaveValue("1");
  await expect(page.getByTestId("task-row-arithmetic")).toContainText("gpt-4.1");
  await page.getByRole("link", { name: "Scenarios" }).click();
  const promotedCost = await page.getByTestId("scenario-cost-balanced").innerText();
  expect(promotedCost).not.toBe(initialCost);

  await page.getByRole("link", { name: "Workflow" }).click();
  await openTask(page, "document-capture");
  await page.getByTestId("routing-primary-model").selectOption("Deterministic retrieval");
  await expect(page.getByTestId("routing-primary-provider")).toHaveValue("deterministic");
  await expect(page.getByTestId("routing-calls")).toHaveValue("0");
  await expect(page.getByTestId("routing-retry-rate")).toHaveValue("0");
  await expect(page.getByTestId("task-row-document-capture")).toContainText("Deterministic retrieval");
  await page.getByRole("link", { name: "Scenarios" }).click();
  await expect(page.getByTestId("scenario-cost-balanced")).not.toHaveText(promotedCost);
});

test("demo and a subsequent blank project remain isolated", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore customer-support demo" }).click();
  await expect(page.getByText("Seeded demo")).toBeVisible();
  await page.getByRole("link", { name: "Build kit" }).click();
  await expect(page.getByText("Enterprise customer-support optimisation", { exact: false }).first()).toBeVisible();
  await startBlank(page);
  await expect(page.getByLabel("Project name")).toHaveValue("");
  await expect(page.getByLabel("Business problem")).toHaveValue("");
  await expect(page.locator("main")).not.toContainText("customer-support");
});

test("two independent drafts and scoped reset never contaminate each other", async ({ page }) => {
  await startBlank(page);
  await page.getByLabel("Project name").fill("Project Alpha");
  await page.getByLabel("Business problem").fill("Alpha-only workflow");
  const alphaUrl = page.url();
  await page.goto("/");
  await page.getByRole("button", { name: "Start new blueprint" }).click();
  await page.getByLabel("Project name").fill("Project Beta");
  await page.getByLabel("Business problem").fill("Beta-only workflow");
  const betaUrl = page.url();

  await page.goto(alphaUrl);
  await expect(page.getByLabel("Project name")).toHaveValue("Project Alpha");
  await expect(page.getByLabel("Business problem")).toHaveValue("Alpha-only workflow");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Project name")).toHaveValue("Project Alpha");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page).toHaveURL(/\/new\?project=project-/);
  await expect(page.getByLabel("Project name")).toHaveValue("");

  await page.goto(betaUrl);
  await expect(page.getByLabel("Project name")).toHaveValue("Project Beta");
  await expect(page.getByLabel("Business problem")).toHaveValue("Beta-only workflow");
});

test("Continue saved draft exposes name/time and restores the intended project", async ({ page }) => {
  await startBlank(page);
  await page.getByLabel("Project name").fill("Named saved draft");
  await page.getByLabel("Business problem").fill("Restore this exact draft");
  const draftUrl = page.url();
  await page.goto("/");
  const continueButton = page.getByRole("button", { name: /Continue Named saved draft ·/ });
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toContainText(/\d/);
  await continueButton.click();
  await expect(page).toHaveURL(draftUrl);
  await expect(page.getByLabel("Project name")).toHaveValue("Named saved draft");
  await expect(page.getByLabel("Business problem")).toHaveValue("Restore this exact draft");
});

test("browser back and forward preserve the generated project and section", async ({ page }) => {
  await completeIntake(page, scenarios[2]);
  const projectPattern = /\/workspace\/project-/;
  await page.getByRole("link", { name: "AI suitability" }).click();
  await expect(page).toHaveURL(/\/suitability$/);
  await page.getByRole("link", { name: "Build path" }).click();
  await expect(page).toHaveURL(/\/build-path$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/suitability$/);
  await expect(page.getByText(scenarios[2].name, { exact: true })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/build-path$/);
  expect(page.url()).toMatch(projectPattern);
});
