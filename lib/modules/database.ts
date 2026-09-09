import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "../types";

interface DbRecommendation {
  name: string;
  whenToUse: string;
  why: string;
  tradeoffs: string;
}

const DB_RECOMMENDATIONS: DbRecommendation[] = [
  {
    name: "Azure SQL (SQL Server)",
    whenToUse: "Relational data with complex joins, transactions, or reporting requirements. Strong fit for SaaS, internal tools, and e-commerce.",
    why: "ACID transactions, mature tooling, excellent Azure-native integrations (Logic Apps, Power BI, Azure Functions). SQL skills are widely available.",
    tradeoffs: "Schema migrations require careful coordination at scale. Horizontal sharding is complex. Higher cost than open-source alternatives.",
  },
  {
    name: "Azure Cosmos DB",
    whenToUse: "Global distribution, high write throughput, flexible/document schema, or multi-region requirements. Best for AI tools, marketplaces, and mobile backends.",
    why: "Turnkey global replication, single-digit millisecond latency, schema flexibility, and native support for multiple APIs (SQL, MongoDB, Cassandra).",
    tradeoffs: "No joins — data must be denormalized. Cost can spike with high RU consumption. Querying non-key fields requires careful index planning.",
  },
  {
    name: "Azure Cache for Redis",
    whenToUse: "Session storage, rate limiting, real-time leaderboards, pub/sub messaging, or caching expensive query results.",
    why: "Sub-millisecond latency, proven for caching and ephemeral state. Azure-managed with geo-replication and persistence options.",
    tradeoffs: "Not a primary data store — data loss risk if persistence is misconfigured. Memory is expensive at scale. Not suitable for complex queries.",
  },
  {
    name: "Azure Data Lake / Synapse Analytics",
    whenToUse: "Analytics workloads, event logging, ML training data, audit trails, or large-scale reporting. Best paired with an OLTP store.",
    why: "Cost-effective storage for high-volume data. Synapse enables SQL-based analytics at petabyte scale. Native Power BI integration.",
    tradeoffs: "Not suitable for transactional workloads. Requires a separate OLTP database for writes. ETL pipelines add operational complexity.",
  },
];

const PRIMARY_DB_BY_PRODUCT: Record<string, string> = {
  marketplace: "Azure Cosmos DB",
  "developer tool": "Azure SQL",
  "internal tool": "Azure SQL",
  "mobile app": "Azure Cosmos DB",
  "AI tool": "Azure Cosmos DB",
  "analytics tool": "Azure Data Lake / Synapse Analytics",
  "e-commerce": "Azure SQL",
  SaaS: "Azure SQL",
};

const SECONDARY_DB_BY_PRODUCT: Record<string, string> = {
  marketplace: "Azure SQL for user/listing metadata",
  "developer tool": "Azure Cache for Redis for API rate limiting",
  "internal tool": "Azure Cache for Redis for session management",
  "mobile app": "Azure Cache for Redis for sync and sessions",
  "AI tool": "Azure Cache for Redis for prompt caching and rate limiting",
  "analytics tool": "Azure SQL for metadata and user data",
  "e-commerce": "Azure Cache for Redis for cart and sessions",
  SaaS: "Azure Cache for Redis for sessions and background job queues",
};

export function generateModule(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): ModuleOutput {
  const primary = PRIMARY_DB_BY_PRODUCT[spine.productType] ?? "Azure SQL";
  const secondary = SECONDARY_DB_BY_PRODUCT[spine.productType] ?? "Azure Cache for Redis";

  return {
    title: "Database Recommendation",
    summary: `Primary: ${primary}. Secondary: ${secondary}. ${spine.complexity === "complex" ? "Complex products should plan a multi-tier data architecture from the start." : "Start with a single database. Add secondary stores only when you hit a concrete bottleneck."}`,
    keyDecision: `Use ${primary} as the primary data store. ${spine.complexity !== "simple" ? `Add ${secondary} for the performance-sensitive layer.` : "Do not add a second database until you have a measured bottleneck."}`,
    reasoning: `${primary} is the best fit for a ${spine.productType} because it aligns with the data access patterns of this product type. Azure-native services reduce operational overhead and integrate seamlessly with identity, monitoring, and billing.`,
    tradeoffs: [
      `${primary}: strong for this use case, but ${primary.includes("Cosmos") ? "requires upfront schema/access-pattern design" : "requires managed migrations as schema evolves"}`,
      "Mixing databases adds operational complexity — only worth it at proven bottlenecks",
      spine.complexity === "complex"
        ? "Complex systems may need read replicas or CQRS to separate write and read models"
        : "Premature database optimization is one of the most common causes of over-engineering",
    ],
    risks: [
      "Choosing a database for familiarity rather than fit — validate against your actual query patterns",
      "No backup and disaster recovery plan from day one — define RPO/RTO early",
      spine.productType === "AI tool" || spine.productType === "analytics tool"
        ? "Data volume growth can be exponential — plan storage tiering and retention policies early"
        : "Schema migrations on live data without a migration strategy cause production incidents",
    ],
    nextSteps: [
      `Provision ${primary} on Azure — use the free/developer tier to start`,
      "Define your 5 most important query patterns before designing the schema",
      `${spine.complexity !== "simple" ? `Add ${secondary} for sessions and caching once the core schema is stable` : "Skip secondary stores until you have a measured reason to add them"}`,
      "Set up automated backups and enable soft-delete on all primary data stores",
      "Use Azure Monitor to track query performance from week one",
    ],
    details: {
      recommendations: DB_RECOMMENDATIONS,
      primaryDatabase: primary,
      secondaryDatabase: secondary,
    },
  };
}
