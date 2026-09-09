import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "../types";

interface MicrosoftMotion {
  motion: string;
  description: string;
  whenToUse: string;
  revenueModel: string;
}

const MICROSOFT_MOTIONS: MicrosoftMotion[] = [
  {
    motion: "SaaS Subscription",
    description: "Recurring monthly or annual billing through Microsoft commercial marketplace or direct.",
    whenToUse: "Best fit for tools with ongoing value delivery — dashboards, workflow automation, AI assistants.",
    revenueModel: "Tiered plans (Free → Starter → Pro → Enterprise). Price on seats or usage.",
  },
  {
    motion: "Azure Consumption",
    description: "Customer pays per API call, compute hour, or token consumed — billed through Azure.",
    whenToUse: "Best fit for AI tools, data pipelines, or processing-heavy workloads where value scales with usage.",
    revenueModel: "Pay-as-you-go with committed tier discounts. Metered billing via Azure Marketplace.",
  },
  {
    motion: "Azure Marketplace",
    description: "Publish on Azure Marketplace to reach enterprise buyers who already have Azure commitments (MACC).",
    whenToUse: "When targeting enterprise customers with existing Azure spend. Reduces procurement friction significantly.",
    revenueModel: "Transacted through Microsoft. Microsoft takes 3% on first $1M, 2% after. Customer can use Azure credits.",
  },
  {
    motion: "Enterprise Licensing",
    description: "Annual enterprise agreements with volume pricing, custom SLAs, and dedicated support.",
    whenToUse: "When average contract value exceeds $50k/year or the buyer is a procurement/legal team, not an individual.",
    revenueModel: "Fixed annual fee + success fee or usage overage. Negotiated deal with custom terms.",
  },
  {
    motion: "Copilot Add-on",
    description: "Position as a Microsoft 365 Copilot extension, Teams integration, or Azure OpenAI-powered feature.",
    whenToUse: "When the product enhances an existing Microsoft workflow (Teams, Outlook, SharePoint, Azure DevOps).",
    revenueModel: "Add-on licensing per seat on top of M365. Or bundled into enterprise deal as a differentiator.",
  },
];

const PRIMARY_MOTION_BY_PRODUCT: Record<string, string> = {
  "AI tool": "Azure Consumption",
  marketplace: "Azure Marketplace",
  "developer tool": "SaaS Subscription",
  "internal tool": "Enterprise Licensing",
  "analytics tool": "SaaS Subscription",
  "e-commerce": "SaaS Subscription",
  "mobile app": "SaaS Subscription",
  SaaS: "SaaS Subscription",
};

export function generateModule(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): ModuleOutput {
  const primaryMotion = PRIMARY_MOTION_BY_PRODUCT[spine.productType] ?? "SaaS Subscription";
  const isEnterprise = spine.complexity === "complex";

  return {
    title: "Monetization Strategy",
    summary: `Primary revenue motion: ${primaryMotion}. ${isEnterprise ? "Enterprise licensing and Azure Marketplace are strong secondary motions given the complexity of this product." : "Start with direct SaaS subscription. Pursue Azure Marketplace listing once you have 3+ enterprise customers."} All 5 Microsoft motions are evaluated below.`,
    keyDecision: `Lead with ${primaryMotion}. ${primaryMotion === "Azure Consumption" ? "Instrument usage from day one — metered billing requires accurate usage tracking." : "Publish to Azure Marketplace within 60 days of launch to unlock enterprise buyer access."}`,
    reasoning: `For a ${spine.productType}, the ${primaryMotion} model aligns value delivery with revenue capture. Microsoft commercial marketplace provides access to enterprise budgets that have already been committed — reducing procurement friction from months to days.`,
    tradeoffs: [
      "Per-seat pricing is predictable but penalizes power users; usage-based is aligned but unpredictable",
      "Azure Marketplace gives enterprise reach but adds compliance requirements (security review, SLA, support SLA)",
      "Free tier creates top-of-funnel but increases support burden — gate it by feature, not by time",
      isEnterprise
        ? "Enterprise deals are high-value but long sales cycles — plan for 3–6 month deal cycles"
        : "SMB/mid-market deals close fast but churn faster — invest in onboarding and activation",
    ],
    risks: [
      "Underpricing at launch is hard to reverse — start higher and offer discounts, not the reverse",
      "Azure Marketplace billing requires passing Microsoft's technical and business review — plan 4–8 weeks",
      "Copilot add-on positioning requires staying current with Microsoft's extension model — it is evolving fast",
    ],
    nextSteps: [
      `Set up Stripe or Azure Marketplace billing for ${primaryMotion}`,
      "Define 3 pricing tiers: a free/trial tier, a self-serve paid tier, and an enterprise tier",
      "Register as a Microsoft Partner and start the Azure Marketplace listing process",
      isEnterprise
        ? "Identify 2–3 enterprise design partners — build the enterprise features around their requirements"
        : "Launch with a 14-day free trial — no credit card required — to reduce signup friction",
      "Track: MRR, ARR, churn rate, expansion revenue, and CAC/LTV ratio from day one",
    ],
    details: {
      microsoftMotions: MICROSOFT_MOTIONS,
      primaryMotion,
    },
  };
}
