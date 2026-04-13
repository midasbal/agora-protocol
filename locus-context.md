# Project Context: Agora Protocol

## Core Concept
Agora Protocol is an autonomous M2M (Machine-to-Machine) settlement protocol. It enables AI agents to autonomously negotiate and trade digital assets (like NFTs or ENS domains) using algorithmic strategies (such as TWAP) to prevent market manipulation and avoid overpaying.

## Technical Architecture
- **Framework:** Next.js (App Router) with TypeScript, React, and Tailwind CSS.
- **Theme:** Cyber-Noir (Strictly dark mode, hacker terminal aesthetic, monospaced fonts, neon green/blue accents).
- **Language:** ALL code, variables, and comments MUST be written in English.

## Locus API Integration (CRITICAL)
This project is for the Locus Paygentic Hackathon. We MUST use the Locus Beta environment (`https://beta-api.paywithlocus.com/api`).
All backend Locus API calls require the Authorization header: `Bearer {LOCUS_API_KEY}` (from env).
Do NOT use any external SDKs. Use native `fetch()` for all Locus API interactions.

We are demonstrating two main Locus features:
1. **Wrapped APIs (Agent Brains):** Do NOT use the standard `openai` npm package. The agents' negotiation logic MUST be routed through Locus's Wrapped API to spend USDC.
   - Endpoint: `POST https://beta-api.paywithlocus.com/api/wrapped/openai/chat`
   - Body: Standard OpenAI format using `gpt-4o-mini` (to save our $15 budget).
2. **Instant, Trustless Settlement:** Once agents agree on a price:
   - The backend uses the Locus REST API to instantly and securely execute the micro-transaction.
   - *Crucial:* Log the "Intent & Reasoning" of the agents during this process for auditability.

## Application Flow
1. **UI (`app/page.tsx`):** A hacker-style terminal interface. Left side shows "Asset Info" (e.g., ENS Domain: 'nexus.eth'). Right side shows a live, scrolling log of the negotiation (Buyer vs. Seller) including their hidden reasoning.
2. **Action:** User clicks "Initialize M2M Trade".
3. **Backend Routes:**
   - `/api/negotiate/route.ts`: Handles the prompt loop via Locus Wrapped API using native `fetch`.
   - `/api/settle/route.ts`: Executes the M2M payment using native `fetch`.