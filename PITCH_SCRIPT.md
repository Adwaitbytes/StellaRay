# StellaRay Pitch Script

**Duration: 5 Minutes**
**Audience: Stellar Ecosystem VPs, SCF Reviewers, Investors**

---

## SLIDE 1: THE HOOK (0:00 to 0:20)

"68% of people who try to create a crypto wallet give up before they finish

Not after a month, before they even get through the door. Seed phrases, browser extensions, 12 random words on paper, we are asking normal people to behave like cryptographers and they are saying no"

---

## SLIDE 2: THE PROBLEM (0:20 to 0:40)

"Today you have two options, MPC wallets where a server holds pieces of your key and if that server goes down your money goes with it, or seed phrases where you expect a normal person to guard 12 random words forever

And both options expose every transaction publicly, your balance, your history, visible to anyone"

---

## SLIDE 3: THE SOLUTION (0:40 to 1:00)

"What if signing in with Google gave you a real wallet? Not custodial, not MPC, full self custody, zero identity on chain

One click, under 10 seconds, same Google account always gives you the same wallet, lose your phone? Sign in again, done"

---

## SLIDE 4: STELLARAY (1:00 to 1:10)

"This is StellaRay, the zero knowledge authentication and privacy layer for Stellar

Prove everything, reveal nothing"

---

## SLIDE 5: HOW IT WORKS (1:10 to 1:30)

"Three steps, Google sign in, your token becomes a Groth16 zero knowledge proof that verifies your identity without revealing who you are, and a self custody wallet is derived deterministically, your key is generated on your device, our server never touches it"

---

## SLIDE 6: PROTOCOL 25 (1:30 to 1:55)

"Why does this work now? Protocol 25 shipped January 2026 with native BN254 and Poseidon host functions directly in the Soroban VM

Before, 4.1 million gas per proof, fifty cents per login, completely impractical

After, 260,000 gas, three cents, 94% reduction, twelve milliseconds on chain

SDF built this capability and we are the first and only team using it in production"

---

## SLIDE 7: ALREADY BUILT (1:55 to 2:20)

"This is not a pitch for something we want to build, this is a live product

5 Soroban contracts deployed, a TypeScript SDK with 57 exports on npm, a demo app with 17 routes and 26 API endpoints, block explorer, SDK playground, admin dashboard, whitepaper published

15,000 lines of code, zero dollars of external funding, two people, self funded"

---

## SLIDE 8 and 9: NEAR INTENT (2:20 to 3:00)

"Beyond authentication we are building something that does not exist on any blockchain

A lending protocol asks, can this user afford 100 USDC? Today you either trust them which is insecure, or read their balance publicly which destroys privacy

StellaRay creates option three, a ZK proof that says YES with cryptographic certainty while revealing nothing about the actual balance

This is Near Intent, balance proofs, eligibility proofs, stream proofs, private lending, anonymous donations, confidential payroll, all become possible, no other chain has this"

---

## SLIDE 10 and 11: SDK AND DIFFERENTIATION (3:00 to 3:20)

"For developers integration is three lines of code, import, create client, call loginWithGoogle, any Stellar dApp gets this in five minutes

Existing solutions use MPC with keys split across servers, that is not real self custody, StellaRay uses actual zero knowledge proofs, true self custody, plus intent verification that nobody else offers"

---

## SLIDE 12 and 13: BUSINESS MODEL AND GROWTH (3:20 to 3:45)

"Revenue model built into the smart contracts, 0.3% on payment links, 0.1% on streams, subscriptions at Free, $9 Pro, $49 Business, pay per proof from $0.05 to $0.50

Targets at 12 months, 10,000 wallets, 5,000 monthly active users, 50 dApp integrations, $1 million transaction volume, over $20,000 monthly revenue, self sustaining"

---

## SLIDE 14 and 15: TEAM AND TRACTION (3:45 to 4:10)

"Yatharth Tripathi, Technical Lead, designed the ZK system and wrote all 5 contracts, Adwait Keshari, Product Lead, built everything users touch and wrote the whitepaper, Atharv on operations, Niharika as CMO

Four days since social launch, 101 followers, 8,300 impressions, 81 npm downloads, zero ad spend, all organic"

---

## SLIDE 16: THE ASK (4:10 to 4:35)

"$150,000, six months, four milestones

$20K upfront, audit firm engaged, intent design started
$35K month two, audit complete, zero critical findings, bug bounty live
$40K month four, all contracts on mainnet, intent MVP on testnet, Apple Sign In, 500 wallets
$55K month six, 3 intent types on mainnet, 10 integrations, 1,000 monthly active users

If we do not deliver, you do not pay"

---

## SLIDE 17 and 18: WHY NOW AND CLOSE (4:35 to 5:00)

"Protocol 25 just shipped, we are first on it, SDF invested in ZK capabilities and we are the team proving it works, the product already exists

StellaRay, prove everything, reveal nothing

We did not raise money to build this, we built it, now let us take it to mainnet

Thank you"

---

## PREPARED Q&A

**Q: What happens if Google changes OAuth?**
"Our JWK Registry stores Google keys on chain, key rotation is handled automatically, the architecture depends on the JWT standard which has been stable for over a decade"

**Q: Can users recover without Google?**
"The wallet and assets exist on chain independently, as long as you authenticate with the same Google account you get the same wallet, if Google disappears the wallet persists, recovery would need a different identity proof targeting the same address seed"

**Q: Why $150,000?**
"Security audit alone is $40K to $80K, the rest covers mainnet infrastructure, intent circuit development, Apple Sign In, and six months of full time work for two co-founders, every dollar maps to a milestone"

**Q: What are the risks?**
"Three, Protocol 25 adoption which we mitigate by making SDK integration dead simple, security which is mitigated by third party audit as milestone 1, and market timing which is mitigated by already being live"

**Q: What is your unfair advantage?**
"We have been building on Protocol 25 since before it launched, 5 contracts, full SDK, live demo, anyone starting today is 6 months behind, and Near Intent reuses our existing Groth16 infrastructure, same pairing, same hashing, different circuit"
