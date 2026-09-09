"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BuildwiseInput, BuilderType } from "@/lib/types";

const EMPTY: BuildwiseInput = {
  problem: "",
  persona: "",
  goal: "",
  constraints: "",
  builderType: "pro-code",
};

const inputBase =
  "w-full rounded-xl bg-[#FEF9ED] border border-[#E8D9C4] px-4 text-[#3B230E] placeholder-[#C4AE98] text-sm focus:outline-none focus:border-[#E5B85C] focus:ring-2 focus:ring-[#E5B85C]/20 transition-colors";

export default function InputForm() {
  const router = useRouter();
  const [form, setForm] = useState<BuildwiseInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof BuildwiseInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      sessionStorage.setItem("buildwise_result", JSON.stringify(data));
      router.push("/results");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Problem */}
      <div>
        <Label>Product / Problem Statement</Label>
        <Hint>Describe your idea — BuildWise will plan the right first version.</Hint>
        <textarea
          required
          rows={4}
          className={`${inputBase} py-3 resize-none mt-2`}
          placeholder="e.g. A tool that helps solo founders plan their MVP before writing a single line of code..."
          value={form.problem}
          onChange={(e) => set("problem", e.target.value)}
        />
      </div>

      {/* Persona + Goal */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Target Persona</Label>
          <input
            required
            type="text"
            className={`${inputBase} py-3 mt-2`}
            placeholder="Who is this for?"
            value={form.persona}
            onChange={(e) => set("persona", e.target.value)}
          />
        </div>
        <div>
          <Label>Business Goal</Label>
          <input
            required
            type="text"
            className={`${inputBase} py-3 mt-2`}
            placeholder="What outcome are you driving toward?"
            value={form.goal}
            onChange={(e) => set("goal", e.target.value)}
          />
        </div>
      </div>

      {/* Constraints */}
      <div>
        <Label>Constraints <Optional /></Label>
        <input
          type="text"
          className={`${inputBase} py-3 mt-2`}
          placeholder="Timeline, team size, budget limitations..."
          value={form.constraints}
          onChange={(e) => set("constraints", e.target.value)}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-[#E8D9C4]" />

      {/* Builder Type */}
      <div>
        <Label>Builder Type</Label>
        <Hint>How will this product be built?</Hint>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {(["pro-code", "low-code"] as BuilderType[]).map((type) => {
            const active = form.builderType === type;
            return (
              <label
                key={type}
                className={`flex flex-col cursor-pointer rounded-xl border-2 px-5 py-4 transition-all select-none ${
                  active
                    ? "border-[#3B230E] bg-[#3B230E]"
                    : "border-[#E8D9C4] bg-[#FEF9ED] hover:border-[#C4A86A]"
                }`}
              >
                <input
                  type="radio"
                  name="builderType"
                  value={type}
                  checked={active}
                  onChange={() => set("builderType", type)}
                  className="sr-only"
                />
                <span className={`text-sm font-bold ${active ? "text-white" : "text-[#3B230E]"}`}>
                  {type === "pro-code" ? "Pro-Code" : "Low-Code"}
                </span>
                <span className={`text-xs mt-1 leading-snug ${active ? "text-[#C4A86A]" : "text-[#8A7060]"}`}>
                  {type === "pro-code"
                    ? "Scaffold, structure & architecture"
                    : "Prompts, steps & instructions"}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#E5B85C] px-4 py-4 text-sm font-bold text-[#3B230E] hover:bg-[#705B31] hover:text-white active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm tracking-wide"
      >
        {loading ? "Analyzing…" : "✦  Generate Plan"}
      </button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold text-[#3B230E]">{children}</p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-[#8A7060] mt-0.5">{children}</p>
  );
}

function Optional() {
  return (
    <span className="text-[10px] font-normal text-[#B8A090] ml-1.5 uppercase tracking-wide">
      Optional
    </span>
  );
}
