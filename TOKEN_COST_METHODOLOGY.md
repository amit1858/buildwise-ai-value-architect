# Token and cost methodology

BuildWise separates design-time estimates, simulated usage, mocked adapter usage, and provider-reported usage.

## Canonical mechanics

For each task:

```text
expectedAttempts = 1 + retryRate
expectedCallsPerExecution = callsPerExecution × expectedAttempts
monthlyCalls = monthlyExecutions × expectedCallsPerExecution
cachedInputTokensPerCall = cacheEligibleInputTokens × cacheHitRate
uncachedInputTokensPerCall = totalInputTokens - cachedInputTokensPerCall
monthlyUncachedInputTokens = uncachedInputTokensPerCall × monthlyCalls
monthlyCachedInputTokens = cachedInputTokensPerCall × monthlyCalls
monthlyOutputTokens = expectedOutputTokens × monthlyCalls
monthlyTaskCost = primary cost + fallback cost + explicit fixed infrastructure cost
```

Scenario cost is the sum of task costs. Savings are baseline cost minus scenario cost, divided by baseline cost, and displayed to one decimal place.

## Token provenance

- **Pre-design estimate:** tokenizer or documented approximation before execution.
- **Simulated:** deterministic demo output with estimated usage.
- **Mock adapter:** contract-accurate response used to verify integration behavior.
- **Provider-reported:** usage returned by a real provider response.
- **Observed cost:** provider-reported usage multiplied by the applicable pricing snapshot.
- **Forecast:** observed or estimated usage multiplied by workload volume, retries, routing shares, and cache assumptions.

The current demo uses a transparent approximation based on text length for prompt fixtures and versioned catalogue prices. It does not claim measured provider usage.

## Calculation drawer

The scenario calculation drawer exposes substituted task values, cache and retry assumptions, model prices, pricing source, effective date, catalogue version, confidence, and provenance.
