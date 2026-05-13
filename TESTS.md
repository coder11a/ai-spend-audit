# Testing Strategy

## Overview
The project uses **Vitest** for unit and integration testing, focusing heavily on the core business logic within the Audit Engine.

## Running Tests
- `npm run test` - Runs the test suite once.
- `npm run test:watch` - Runs the test suite in watch mode.
- `npm run typecheck` - Validates TypeScript types across the project.

## Test Coverage Focus
1. **Deterministic Calculations**: The `lib/audit-engine.ts` is strictly tested to ensure that the logic for detecting overspending, identifying enterprise tier mismatches, and calculating savings is mathematically correct.
2. **Pricing Rules**: Tests validate that fallback logic applies correctly for missing or anomalous inputs.

## Future Testing Goals
- Implement Playwright or Cypress for End-to-End (E2E) testing of the entire user flow (Landing Page -> Form -> Results Dashboard).
