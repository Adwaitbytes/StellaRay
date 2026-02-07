# StellaRay - Loom Walkthrough Script

**Duration:** 3-4 minutes
**Format:** Single person screen recording with voiceover
**Tone:** Curious, genuine, conversational

---

## INTRO (0:00 - 0:20)

*[Screen: stellaray.fun homepage loaded]*

"Hey! So I want to show you StellaRay - it's basically zkLogin for Stellar.

The idea is simple: what if getting a blockchain wallet was as easy as signing into Google? No seed phrases, no browser extensions, just... click and you're in.

Let me show you how it works."

---

## AUTHENTICATION (0:20 - 0:50)

*[Cursor moves to "Sign in with Google" button]*

"So here's the login. One button. I'll click it..."

*[Click, Google OAuth popup appears, select account]*

"Pick my Google account... and watch what happens..."

*[Dashboard loads with wallet address and balance]*

"Done. That's it. I now have a real Stellar wallet. That took about 8 seconds.

And here's the interesting part - my Google credentials never touched the blockchain. We use zero-knowledge proofs to verify I'm me, without exposing who I actually am."

---

## DASHBOARD TOUR (0:50 - 1:40)

*[Point to different sections as you talk]*

"This is the dashboard. Pretty clean, right?

Up here is my balance - real XLM on Stellar testnet. I can hide it if I want..."

*[Click eye icon]*

"...and this is my public address. Anyone can send me crypto with this."

*[Click copy button]*

"Copy it with one click.

Now these action buttons - this is where it gets useful."

*[Hover over each button]*

"SEND lets me move money anywhere in about 3-5 seconds. Not days. Seconds.

RECEIVE gives me a QR code - someone can just scan this and pay me instantly.

SCAN turns my camera into a payment scanner.

And these two - PAY LINK and STREAMS - those are coming soon. Pay links you can text to anyone, streaming payments that pay by the second. Still building those out."

---

## X-RAY PROTOCOL SECTION (1:40 - 2:15)

*[Scroll down to X-Ray Protocol section]*

"This section is kind of nerdy but it's actually important.

These numbers are real-time stats from Stellar's Protocol 25. We're using native cryptographic primitives - BN254 curves, Poseidon hashing, Groth16 proofs - all built directly into Stellar's core.

See that 94% gas savings? That's because we're not using WASM workarounds. This is native. It's fast and it's cheap.

Every transaction is cryptographically verified. You can't fake it."

---

## TRANSACTIONS & CONTRACTS (2:15 - 2:35)

*[Show transactions section if there are any]*

"Transaction history lives here. Every send, every receive. You can click any of these to see full details or verify it on Stellar Explorer.

And these contract addresses at the bottom? Those are our actual deployed contracts - ZK Verifier, Gateway Factory, JWK Registry. All live, all open source."

---

## PLAYGROUND (2:35 - 3:15)

*[Navigate to /playground]*

"Now this is fun - the Playground.

If you're a developer, this is where you can actually test the SDK. Live, in your browser, no setup required."

*[Show the interface]*

"You can test proof generation, wallet creation, all the core functions. And the integration is really simple..."

*[Show or mention code example]*

```typescript
const client = new ZkLoginClient({ network: 'testnet' });
await client.connect('google');
```

"Three lines of code and your users have passwordless blockchain wallets. That's kind of the whole pitch."

---

## SDK & DOCS (3:15 - 3:35)

*[Navigate to /sdk if available, or mention it]*

"We have full TypeScript SDK documentation. Strict mode, everything typed, React hooks if you need them.

Import `useZkLogin` into your app and you're basically done. What used to take weeks of auth development now takes an afternoon."

---

## CLOSE (3:35 - 3:55)

*[Back to dashboard or homepage]*

"So yeah, that's StellaRay.

Sign in with Google, get a real wallet, send money anywhere, all without ever seeing a seed phrase.

It's open source, MIT licensed, and we're building on Stellar's Protocol 25.

Check it out at stellaray.fun. Thanks for watching!"

*[End]*

---

## RECORDING TIPS

**Before Recording:**
- Clear browser cache, use fresh session
- Have a funded testnet wallet ready
- Test the full flow once to make sure everything works
- Close other tabs/apps
- Set screen to 1080p

**While Recording:**
- Speak naturally, like you're showing a friend
- Pause briefly when something loads
- Keep mouse movements smooth
- It's okay to have small pauses - feels more real
- Don't script every word - use this as a guide

**Keep It Genuine:**
- You don't need to sound like a commercial
- "Kind of cool, right?" > "This is AMAZING"
- Show genuine curiosity about your own product
- It's okay to say "still working on this" for incomplete features

---

## QUICK REFERENCE - Key Points to Hit

1. **8 seconds** - login to wallet creation time
2. **Zero-knowledge proofs** - identity never touches blockchain
3. **Protocol 25** - native crypto primitives, 94% gas savings
4. **3 lines of code** - SDK integration simplicity
5. **Open source, MIT licensed** - public good, not closed product
6. **Real contracts deployed** - this isn't a prototype

---

## IF SOMETHING GOES WRONG

**OAuth fails:** "Let me try that again..." (reload and retry)
**Page loads slow:** "Just loading up here..." (natural pause)
**Error appears:** Cut that part and re-record that section

You can always edit Loom recordings after. Don't stress about perfection.
