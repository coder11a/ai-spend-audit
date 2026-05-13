# Pricing Data Structure

The application evaluates tools against a predefined set of pricing rules stored in `lib/pricing.ts`.

## Supported Tools
- **LLM Chat Interfaces**: ChatGPT, Claude, Gemini
- **Coding Assistants**: Cursor, GitHub Copilot, Windsurf
- **APIs**: OpenAI API, Anthropic API

## Rule Structure
Each tool is defined with the following properties:
- `name`: Display name.
- `category`: Used for contextual recommendations (e.g., `coding`, `api`, `chat`).
- `plans`: Object mapping plan tiers (`pro`, `team`, `enterprise`) to their pricing and rules.
  - `monthlyPrice`: Cost per month.
  - `seatBased`: Boolean indicating if the price multiplies by the number of seats.
  - `label`: Human-readable plan name.
- `alternatives`: Recommended alternatives based on the user's primary use case.

## Logic
If a user inputs a spend that exceeds the `expectedPlanSpend` calculation by > 25%, the engine flags the tool for an unused seat audit.
