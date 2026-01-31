# MPC (Multi-Party Computation) in short: Multiple servers each hold a piece of your private key. To sign a transaction, they coordinate together without any single server seeing the full key. The problem: you depend on those servers being online and honest. If they go down or collude, you lose access to your funds. It looks like self custody but it is not, because you never fully control the complete key yourself.

Now let me create the condensed 5 minute pitch script as an MD file.



# StellaRay Pitch Script

**Duration: 5 Minutes**
**Audience: Stellar Ecosystem VPs, SCF Reviewers, Investors**

---

## SLIDE 1: THE HOOK (0:00 to 0:20)

"68% of people who try to create a crypto wallet give up before they finish.

Not after a month. Before they even get through the door. Seed phrases, browser extensions, 12 random words on paper. We are asking normal people to behave like cryptographers. And they are saying no."

---

## SLIDE 2: THE PROBLEM (0:20 to 0:40)

"Today you have two options. MPC wallets where a server holds pieces of your key. If that server goes down, your money goes with it. Or seed phrases where you expect a normal person to guard 12 random words forever.

And both options expose every transaction publicly. Your balance, your history, visible to anyone."

---

## SLIDE 3: THE SOLUTION (0:40 to 1:00)

"What if signing in with Google gave you a real wallet? Not custodial. Not MPC. Full self custody. Zero identity on chain.

One click. Under 10 seconds. Same Google account always gives you the same wallet. Lose your phone? Sign in again. Done."

---

## SLIDE 4: STELLARAY (1:00 to 1:10)

"This is StellaRay. The zero knowledge authentication and privacy layer for Stellar.

Prove everything. Reveal nothing."

---

## SLIDE 5: HOW IT WORKS (1:10 to 1:30)

"Three steps. Google sign in. Your token becomes a Groth16 zero knowledge proof that verifies your identity without revealing who you are. A self custody wallet is derived deterministically. Your key is generated on your device. Our server never touches it."

---

## SLIDE 6: PROTOCOL 25 (1:30 to 1:55)

"Why does this work now? Protocol 25 shipped January 2026. Native BN254 and Poseidon host functions directly in the Soroban VM.

Before: 4.1 million gas per proof. Fifty cents per login. Impractical.

After: 260,000 gas. Three cents. 94% reduction. Twelve milliseconds on chain.

SDF built this capability. We are the first and only team using it in production."

---

## SLIDE 7: ALREADY BUILT (1:55 to 2:20)

"This is not a pitch for something we want to build. This is a live product.

5 Soroban contracts deployed. A TypeScript SDK with 57 exports on npm. A demo app with 17 routes and 26 API endpoints. Block explorer. SDK playground. Admin dashboard. Whitepaper published.

15,000 lines of code. Zero dollars of external funding. Two people. Self funded."

---

## SLIDE 8 and 9: NEAR INTENT (2:20 to 3:00)

"Beyond authentication, we are building something that does not exist on any blockchain.

A lending protocol asks: Can this user afford 100 USDC? Today you either trust them, which is insecure, or read their balance publicly, which destroys privacy.

StellaRay creates option three. A ZK proof that says YES with cryptographic certainty while revealing nothing about the actual balance.

This is Near Intent. Balance proofs, eligibility proofs, stream proofs. Private lending, anonymous donations, confidential payroll. All become possible. No other chain has this."

---

## SLIDE 10 and 11: SDK AND DIFFERENTIATION (3:00 to 3:20)

"For developers, integration is three lines of code. Import, create client, call loginWithGoogle. Any Stellar dApp gets this in five minutes.

Existing solutions use MPC. Keys split across servers. Not real self custody. StellaRay uses actual zero knowledge proofs. True self custody. Plus intent verification that nobody else offers."

---

## SLIDE 12 and 13: BUSINESS MODEL AND GROWTH (3:20 to 3:45)

"Revenue model built into the smart contracts. 0.3% on payment links. 0.1% on streams. Subscriptions at Free, $9 Pro, $49 Business. Pay per proof from $0.05 to $0.50.

Targets: 10,000 wallets, 5,000 monthly active users, 50 dApp integrations, $1 million transaction volume at 12 months. Over $20,000 monthly revenue. Self sustaining."

---

## SLIDE 14 and 15: TEAM AND TRACTION (3:45 to 4:10)

"Yatharth Tripathi, Technical Lead. Designed the ZK system, wrote all 5 contracts. Adwait Keshari, Product Lead. Built everything users touch, wrote the whitepaper. Atharv on operations. Niharika on content.

Four days since social launch. 101 followers. 8,300 impressions. 81 npm downloads. Zero ad spend. All organic."

---

## SLIDE 16: THE ASK (4:10 to 4:35)

"$150,000. Six months. Four milestones.

$20K upfront: audit firm engaged, intent design started.
$35K month two: audit complete, zero critical findings, bug bounty live.
$40K month four: all contracts on mainnet, intent MVP on testnet, Apple Sign In, 500 wallets.
$55K month six: 3 intent types on mainnet, 10 integrations, 1,000 monthly active users.

If we do not deliver, you do not pay."

---

## SLIDE 17 and 18: WHY NOW AND CLOSE (4:35 to 5:00)

"Protocol 25 just shipped. We are first on it. SDF invested in ZK capabilities and we are the team proving it works. The product already exists.

StellaRay. Prove everything. Reveal nothing.

We did not raise money to build this. We built it. Now let us take it to mainnet.

Thank you."

---

## PREPARED Q&A

**Q: What happens if Google changes OAuth?**
"Our JWK Registry stores Google keys on chain. Key rotation is handled automatically. The architecture depends on the JWT standard which has been stable for over a decade."

**Q: Can users recover without Google?**
"The wallet and assets exist on chain independently. As long as you authenticate with the same Google account, you get the same wallet. If Google disappears, the wallet persists. Recovery would need a different identity proof targeting the same address seed."

**Q: Why $150,000?**
"Security audit alone is $40K to $80K. The rest covers mainnet infrastructure, intent circuit development, Apple Sign In, and six months of full time work for two co-founders. Every dollar maps to a milestone."

**Q: What are the risks?**
"Three. Protocol 25 adoption: we mitigate by making SDK integration dead simple. Security: mitigated by third party audit as milestone 1. Market timing: mitigated by already being live."

**Q: What is your unfair advantage?**
"We have been building on Protocol 25 since before it launched. 5 contracts, full SDK, live demo. Anyone starting today is 6 months behind. And Near Intent reuses our existing Groth16 infrastructure. Same pairing, same hashing, different circuit."
