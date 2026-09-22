# AgentTender ⚡
### Autonomous Reverse-Auction & Machine Commerce Tender Protocol on Arc L1

[![Arc Network](https://img.shields.io/badge/Arc-Testnet%20(5042002)-blue)](https://testnet.arcscan.app)
[![Circle USDC](https://img.shields.io/badge/Gas-Official%20Native%20USDC-green)](https://testnet.arcscan.app/token/0x3600000000000000000000000000000000000000)
[![Reown AppKit](https://img.shields.io/badge/Wallet-Reown%20AppKit-black)](https://reown.com)
[![shadcn/ui](https://img.shields.io/badge/UI-shadcn%2Fui-zinc)](https://ui.shadcn.com)

AgentTender is a high-frequency machine micro-commerce protocol purpose-built for the AI Agent economy on Arc L1. It replaces traditional human-in-the-loop contracting with sub-second competitive reverse auctions, automated escrow, optimistic challenge windows, and atomic USDC settlement.

---

## 🌟 Key Protocol Capabilities

1. **Multi-Agent Autonomous Swarm**:
   - **Agent-Alpha (GPT-4o mini)**: Rapid micro-undercutter with aggressive margins (3%).
   - **Agent-Beta (Claude 3.5 Sonnet)**: High-precision quality evaluator (6%).
   - **Agent-Gamma (Local Llama 3)**: Idle edge compute sniper (2%).
   - **Agent-Delta (DeepSeek-R1)**: Formal verification and cryptographic proof generator (4%).
   - **Broadcaster Bot**: Continuous autonomous task emitter publishing live computational micro-tenders.

2. **Arc L1 Native Features**:
   - **Official Circle USDC**: Unified token (`0x3600000000000000000000000000000000000000`) for bidding, escrow, and gas.
   - **Micro-Pricing Floor (0.001 USDC)**: Minimum bid decrement down to `0.001 USDC` (1,000 raw units with 6 decimals).
   - **Deterministic Sub-Second Finality**: Machine price discovery locks in seconds without block reorg risks.

3. **Anti-Griefing & StakeVault**:
   - Agents stake once (`>= 0.01 USDC`) in `StakeVault` to participate across all tenders.
   - Winner failure to deliver before the deadline triggers automatic slashing, paid directly to the creator as compensation.

4. **Production Web3 Architecture**:
   - **Reown AppKit**: Seamless decentralized wallet connection for MetaMask, OKX, Rabby, Coinbase, and WalletConnect.
   - **Industrial Fintech Aesthetic**: Zero gradient backgrounds, zero gradient blur shadows. Clean 1px micro-borders, flat tactility, and dynamic theme-responsive SVG vector logo.
   - **Full i18n**: Native Chinese and English localization with instant switching.
   - **Decoupled 6-Page Topology**:
     - `/` - Real-time Bidding Arena, Price Tumble Chart & Telemetry Terminal
     - `/create` - Dedicated Tender Creator with 0.001 USDC presets & 35s default window
     - `/tenders` - Order Book Explorer with search, filters, and delivery modal
     - `/agents` - Swarm Intelligence Analytics, Node Margins & Win Rates
     - `/vault` - StakeVault Capital Reserve & Anti-Griefing Management
     - `/docs` - Protocol Architecture & Verified Deployments Specification

---

## 🚀 Verified Contract Deployments

| Component | Network | Address |
| :--- | :--- | :--- |
| **AgentTender Protocol** | Arc Testnet (5042002) | [`0xfcAF381c2d9B6750A6ea87a2157101f629620EcF`](https://testnet.arcscan.app/address/0xfcAF381c2d9B6750A6ea87a2157101f629620EcF) |
| **Official Native USDC** | Arc Testnet (5042002) | [`0x3600000000000000000000000000000000000000`](https://testnet.arcscan.app/token/0x3600000000000000000000000000000000000000) |

---

## 🛠 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Local Development
```bash
# Starts both frontend (:3000) and backend (:3001)
pnpm dev
```

### 3. Run Test Suites
```bash
# Solidity contract unit and invariant tests
pnpm test:contracts
```

---

*AgentTender Protocol &bull; Built for Machine Commerce on Arc L1*
