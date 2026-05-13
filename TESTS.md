# Automated Tests

The core business logic is covered by Vitest. You can run the test suite by executing:

```bash
npm run test
```
*(or `npx vitest run`)*

## `lib/audit-engine.test.ts`

This file covers the deterministic logic of the `calculateAudit` engine to ensure exact financial calculations.

1. **Test:** `calculates zero savings if no tools are provided`
   **Covers:** Ensures the engine doesn't crash on empty input and correctly returns $0 savings.
2. **Test:** `recommends downgrading when team size is small but enterprise plan is used`
   **Covers:** Validates the cross-referencing logic that triggers a "high severity" downgrade warning when small teams (e.g., 10 people) use Enterprise tiers meant for 25+ seats.
3. **Test:** `calculates correct savings when over-seated`
   **Covers:** Ensures that if a user inputs more paid seats (10) than their actual team size (5), the engine flags the unused seats and correctly calculates the expected optimized spend based on the 5 actual users.
4. **Test:** `recommends adding model routing when API spend is high for a small team`
   **Covers:** Tests the logic that detects unusually high API spend ($2,000+) for a small team, verifying it recommends caching/routing and estimates a 28% savings.
5. **Test:** `keeps the current plan if it is the best fit`
   **Covers:** Verifies the "happy path" where a correctly sized team on an appropriate plan receives a "Keep" recommendation and generates $0 in savings.
