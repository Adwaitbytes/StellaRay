# Product Roadmap

## StellaRay: ZK Authentication Layer for Stellar

**Version**: 3.0
**Last Updated**: April 2026
**Roadmap Period**: April 2026 to April 2027

---

## Vision

Make blockchain as easy as "Sign in with Google" while preserving self-custody and privacy through zero-knowledge proofs. Replace the current single-operator salt service with a 3-of-5 threshold MPC across independent operators, then ship audited contracts to Stellar mainnet with named launch partners and on-chain protocol revenue.

---

## Current Status (April 2026)

### Shipped

| Capability | Status | Where to verify |
|---|---|---|
| 6 Soroban contracts on Stellar testnet | Live | stellar.expert (addresses below) |
| Google OAuth zkLogin flow end to end | Live | stellaray.fun |
| TypeScript SDK + React hooks | Live | npmjs.com/package/@stellar-zklogin/sdk |
| Streaming payments | Live | stellaray.fun/streams |
| Payment links | Live | stellaray.fun/pay |
| x402 micropayments | Live | x402 facilitator contract |
| Eligibility proof framework (4 proof types) | Live | stellaray.fun/zk-proofs |
| Shamir 2-of-3 multi-custody recovery | Live | stellaray.fun/zk-multi-custody |
| Protocol 25 BN254 + Poseidon host-function integration | Live | First on Stellar |

### Deployed Testnet Contracts

| Contract | Status |
|---|---|
| ZK Verifier (`CDAQXHN...CP6`) | Live on testnet |
| JWK Registry (`CAMO5LY...S2I`) | Live on testnet |
| Gateway Factory (`CAAOQR7...F76`) | Live on testnet |
| Smart Wallet (WASM hash `2a7e...4d5d`) | Live on testnet |
| x402 Facilitator (`CDJMT4P...TZZ`) | Live on testnet |
| ZK Multi-Custody Recovery | Live on testnet |

### Honest Open Risks

| Risk | Status | Where it gets fixed |
|---|---|---|
| Single-operator salt service (custody-equivalent) | Active risk | Replaced in Q3 2026 by 3-of-5 FROST cluster |
| Mainnet verification key not from a multi-party ceremony | Open | Fixed in Q3 2026 trusted-setup ceremony |
| External cryptography audit not yet completed | Open | SCF-funded audit during Q3 2026 |

---

## Q1 2026: Foundation (Historical)

### January 2026

**Focus**: Protocol 25 readiness and testnet deployment.

| Milestone | Date | Status |
|---|---|---|
| Protocol 25 testnet vote | Jan 7 | Complete |
| Protocol 25 mainnet activation | Jan 22 | Complete |
| StellaRay testnet contract deployment (all 6 contracts) | Jan-end | Complete |
| Live demo at stellaray.fun | Jan-end | Complete |
| TypeScript SDK published on npm | Jan-end | Complete |

### February to March 2026

**Focus**: SCF #42 Build Award submission (rejected); incorporated reviewer feedback into the SCF #43 plan.

| Milestone | Date | Status |
|---|---|---|
| SCF #42 submission | Feb-early | Complete |
| SCF #42 Build Award decision | Mar 11 | Not awarded |
| Voter feedback analysis | Mar | Complete |
| Resubmission scoping (decentralized salt MPC, named partners, revenue activation) | Mar-Apr | Complete |

---

## Q2 2026: SCF #43 Submission and Developer Tooling

### April 2026

**Focus**: SCF #43 submission and partner LOI outreach.

| Milestone | Target | Status |
|---|---|---|
| SCF #43 Build Interest Form | Apr 26 | Submitted |
| SCF #43 Build Award full submission | Apr-end | In progress |
| Partner LOI outreach (target 3 named integrations) | Apr-May | In progress |
| Audit firm scoping (Veridise / Zellic / Macro) | Apr-May | In progress |
| External operator outreach (4 candidates for salt cluster) | Apr-May | In progress |

### May to June 2026

**Focus**: SCF #43 Tranche 1 deliverables (Developer Ecosystem Assets).

Tranche 1 fires after SCF approval. Estimated approval window late May 2026, deliverables completed by mid-July 2026.

| Deliverable | Owner | Status |
|---|---|---|
| Documentation portal at docs.stellaray.fun | Niharika | Tranche 1 |
| 5 ready-to-fork sample dApp templates | Adwait | Tranche 1 |
| OpenAPI 3.1 spec, Postman collection, types package | Adwait | Tranche 1 |
| Public performance benchmark suite + dashboard | Adwait | Tranche 1 |
| Stellar zkLogin Cookbook (20 technical recipes) | Niharika | Tranche 1 |
| Migration guide from Albedo / Freighter / raw Stellar SDK | Niharika | Tranche 1 |
| Security remediation: 4 Critical findings closed + independent confirmation | Yatharth | Tranche 1 |

**Q2 KPIs**:
- SCF #43 submission accepted
- 1+ named partner LOI signed
- Audit firm engagement letter received
- Tranche 1 deliverables shipped on schedule

---

## Q3 2026: Distributed Salt MPC and Mainnet Launch

### July 2026

**Focus**: SCF #43 Tranche 2 begins. Distributed Salt MPC implementation.

| Deliverable | Owner | Status |
|---|---|---|
| FROST-based threshold protocol specification published | Yatharth | Tranche 2 |
| Open-source operator software (Rust) released | Yatharth | Tranche 2 |
| 3-of-5 testnet salt cluster live with 5 named operators | Atharv (ops) | Tranche 2 |
| Public DKG ceremony executed on testnet, transcript published | Yatharth | Tranche 2 |
| Operator health dashboard at stellaray.fun/operators | Adwait | Tranche 2 |
| SDK v2.5 published using threshold salt service | Adwait | Tranche 2 |

### August 2026

**Focus**: External cryptography audit (SCF-funded).

| Deliverable | Status |
|---|---|
| Audit kickoff with selected firm | Tranche 3 (audit funded separately by SCF) |
| Interim findings review | Tranche 3 |
| Final audit report published | Tranche 3 |
| All Critical and High findings remediated | Tranche 3 |
| Trusted setup ceremony begins (Powers of Tau with 10+ participants) | Tranche 3 |

### September 2026

**Focus**: SCF #43 Tranche 3. Mainnet launch.

| Deliverable | Owner | Status |
|---|---|---|
| Phase-2 trusted setup ceremony (5+ participants) | Yatharth | Tranche 3 |
| Production verification key derived; key hash committed on chain | Yatharth | Tranche 3 |
| All 6 Soroban contracts deployed to Stellar mainnet | Yatharth | Tranche 3 |
| 3-of-5 FROST salt cluster promoted to mainnet | Atharv (ops) | Tranche 3 |
| Production prover infrastructure (3-region active) | Adwait | Tranche 3 |
| SDK v3.0 (web + React Native) published on npm | Adwait | Tranche 3 |
| 3 named partner integrations live on mainnet | Atharv | Tranche 3 |
| Per-proof gateway fee activated on x402 facilitator | Adwait | Tranche 3 |
| Public mainnet dashboard at stellaray.fun/mainnet | Adwait | Tranche 3 |

**Q3 KPIs (90 days post-mainnet, set as floors not targets)**:
- 500+ unique mainnet wallets (verifiable on stellar.expert)
- 5,000+ cumulative ZK proofs verified on chain
- 3 named partners live on mainnet
- 60+ days continuous threshold-cluster uptime
- First protocol revenue captured (target $100/month by day 90)
- Audit report published with all Critical and High findings closed

---

## Q4 2026: Post-Launch Stabilization and Apple Sign-In

### October 2026

**Focus**: Post-launch operations and partner expansion.

| Goal | Status |
|---|---|
| Mainnet incident-response runbooks published | Planned |
| Operator quarterly resharing #1 (FROST cluster) | Planned |
| Partner integration #4 onboarded | Planned |
| Public 90-day mainnet report | Planned |

### November 2026

**Focus**: Apple Sign-In integration.

| Goal | Status |
|---|---|
| Apple OIDC integration (ES256-signed JWT support) | Planned |
| Apple-specific Circom circuit variant compiled and tested | Planned |
| JWK Registry update with Apple public keys | Planned |
| SDK exposure as `connect('apple')` | Planned |

### December 2026

**Focus**: Stabilization and 2027 planning.

| Goal | Status |
|---|---|
| Performance optimization pass on prover service | Planned |
| Public bug bounty program (active throughout) | Planned |
| Q1 2027 roadmap published | Planned |

**Q4 KPIs**:
- 1,000+ unique mainnet wallets cumulative
- 5+ partner integrations live
- 99.5%+ salt-cluster uptime
- Apple Sign-In live on mainnet by Dec 31

---

## Q1 2027: Growth

### January to March 2027

**Focus**: Adoption, additional OAuth providers, and ecosystem outreach.

| Goal | Status |
|---|---|
| Microsoft / GitHub OIDC support (community-prioritized) | Planned |
| Mobile SDK production release (post-Tranche-3 polish) | Planned |
| Additional partner integrations (target: 10 cumulative) | Planned |
| Public technical blog series on FROST salt MPC | Planned |
| Stellar Dev Digest contributions on Protocol 25 patterns | Planned |

---

## Key Performance Indicators (Defensible Floors)

The targets below are deliberately conservative. We commit to floors we can defend on the day of the report. Stretch targets and aspirations are not promised.

### User Metrics

| Metric | 90 days post-mainnet | 6 months post-mainnet | 12 months post-mainnet |
|---|---|---|---|
| Unique mainnet wallets (cumulative) | 500 | 1,500 | 5,000 |
| Cumulative ZK proofs verified | 5,000 | 25,000 | 100,000 |
| 30-day retention | 25% | 30% | 35% |

### Developer Metrics

| Metric | Q3 2026 | Q4 2026 | Q1 2027 |
|---|---|---|---|
| SDK monthly downloads | 100 | 250 | 500 |
| Named dApp integrations live on mainnet | 3 | 5 | 10 |
| Documentation portal monthly uniques | 500 | 1,000 | 2,500 |

### Technical Metrics

| Metric | Target |
|---|---|
| Salt-cluster uptime (rolling 30-day) | 99.5% |
| Prover p95 proof generation time | Under 5 seconds |
| Prover p99 proof generation time | Under 10 seconds |
| Mainnet transaction success rate | 99% |

### Business Metrics (Post-Mainnet)

| Stream | Mechanism | First-year target |
|---|---|---|
| Per-proof gateway fee | 0.005 XLM per verified eligibility proof, captured on-chain | $1.2K to $6K |
| Managed prover-as-a-service | Free under 10K proofs/month/dApp; $0.0005 per proof above | $5K to $25K |
| Enterprise self-hosted tier | $25K/year per company | 1 to 3 contracts |

Conservative twelve-month projection (post-mainnet): roughly $25K ARR. Base case: roughly $100K ARR. Break-even on operating costs falls between these.

---

## Risk Register

### Technical

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Audit findings require circuit redesign | Low | High | T3 deliverables gated on T2 close; mainnet does not deploy unaudited code |
| FROST implementation correctness bug | Low | Critical | Use vetted libraries (zcash/frost or ZF FROST), audit covers protocol |
| Operator coordination failure during DKG | Medium | Medium | Stipends fund 6 months testnet ops; rehearsal ceremonies before mainnet |

### Operational

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| LOI partner slips schedule | Medium | Medium | Floor of 3 partners drops to 2 with documented reason |
| Operator drops permanently | Medium | Low | Cluster degrades to 3-of-4 (still threshold-secure); replacement onboarded |
| Grant funding gap before revenue | Medium | High | Conservative ARR projection covers operating costs; per-proof fee active from day one |

### Market

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Passkey wallets capture consumer auth segment | Medium | Medium | Differentiation via eligibility-proof framework (no competitor on Stellar) |
| Regulatory shift on identity proofs | Low | High | Compliance documentation in Q1 2027 |

---

## Dependencies

### External

| Dependency | Owner | Risk Level |
|---|---|---|
| Protocol 25 stability on mainnet | Stellar Development Foundation | Low (already shipped Jan 2026) |
| Google OAuth API | Google | Very Low |
| SCF #43 award decision | Stellar Community Fund | High (gates entire timeline) |
| Audit firm availability (Veridise / Zellic / Macro) | Audit firm | Medium |

### Internal

| Dependency | Team | Risk Level |
|---|---|---|
| FROST salt MPC implementation correctness | Yatharth (cryptography lead) | Medium |
| External operator onboarding | Atharv (operations) | Medium |
| Documentation portal completion | Niharika (devrel) | Low |

---

## Governance

### Decision Making

- **Product decisions**: Core team consensus.
- **Cryptography decisions**: Yatharth + audit firm + community review where applicable.
- **Partner decisions**: Atharv + Adwait, with criteria-based vetting.
- **Financial decisions**: Adwait, gated by tranche-disbursement schedule.

### Review Cadence

| Review | Frequency | Participants |
|---|---|---|
| Sprint review | Weekly | Core team |
| Tranche progress review | Biweekly during active tranches | Core team + advisors |
| KPI review | Monthly post-mainnet | Core team + community |

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 3.0 | April 2026 | Restructured for SCF #43 resubmission. Added Distributed Salt MPC as the headline Q3 deliverable. Replaced aspirational targets with defensible floors. Added Honest Open Risks section. Aligned tranche schedule with submission. |
| 2.0 | January 2026 | Protocol 25 integration shipped, x402 added, testnet deployment complete. |
| 1.5 | December 2025 | Initial x402 integration. |
| 1.0 | October 2025 | Initial roadmap. |

---

*This roadmap reflects the state at the start of the SCF #43 round. It will be updated again at award notification, again at each tranche close, and again at mainnet launch.*

*Questions: open a GitHub issue or contact adwaitkeshari288@gmail.com.*
