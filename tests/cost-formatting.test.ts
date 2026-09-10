import { describe, expect, it } from "vitest";
import { formatCost } from "@/lib/buildwise";

describe("cost formatting", () => {
  it("formats exact zero", () => expect(formatCost(0)).toBe("$0.00"));
  it("preserves non-zero sub-cent costs", () => expect(formatCost(0.001047)).toBe("$0.0010"));
  it("formats ordinary currency", () => expect(formatCost(12.5)).toBe("$12.50"));
  it("labels unavailable pricing", () => expect(formatCost(null, "unavailable")).toBe("Pricing unavailable"));
  it("labels deterministic execution as not applicable", () => expect(formatCost(null, "deterministic")).toBe("Not applicable"));
});
