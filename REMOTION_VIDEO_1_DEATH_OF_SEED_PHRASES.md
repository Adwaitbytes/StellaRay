# REMOTION PRODUCTION BIBLE
## Video 1: "THE DEATH OF SEED PHRASES"

**Production Code:** SLR-V001
**Duration:** 45 seconds (1350 frames @ 30fps)
**Aspect Ratio:** 9:16 (1080x1920) - Optimized for Twitter/TikTok/Reels
**Alternate Cut:** 16:9 (1920x1080) - YouTube/Website

---

# CREATIVE VISION

## The Concept

This isn't a product video. This is a **cultural moment**.

We're not explaining a feature — we're **killing an era**. The seed phrase has tortured millions of crypto users for over a decade. This video is its funeral, its eulogy, and its replacement all in 45 seconds.

**Tone:** Dramatic. Confident. Slightly rebellious. Like a tech company that actually gets it.

**Inspiration:**
- Apple's "1984" commercial (revolutionary, dramatic)
- Mr. Robot title sequences (glitchy, hacker aesthetic)
- Marvel's snap sequences (satisfying destruction)
- Severance intro (unsettling beauty)
- Blade Runner 2049 (neon noir, scale)

**Core Emotion:** Relief. The viewer should feel the weight of seed phrases lift off their shoulders.

---

# VISUAL IDENTITY

## Color Palette

```
PRIMARY COLORS:
┌─────────────────────────────────────────────────────────┐
│  VOID BLACK      #0A0A0F    Background, depth          │
│  ELECTRIC BLUE   #0066FF    Primary accent, hope       │
│  NEON CYAN       #00D4FF    Secondary accent, tech     │
│  TOXIC GREEN     #00FF88    Success, new era           │
│  WARNING AMBER   #FFD600    Caution, old world         │
│  BLOOD RED       #FF3366    Danger, seed phrase pain   │
│  PURE WHITE      #FFFFFF    Text, contrast             │
└─────────────────────────────────────────────────────────┘

GRADIENT COMBINATIONS:
• Death Gradient: #FF3366 → #0A0A0F (seed phrase destruction)
• Hope Gradient: #0066FF → #00FF88 (new era emergence)
• Tech Gradient: #0066FF → #00D4FF (interface elements)
```

## Typography

```
PRIMARY TYPEFACE: "Space Grotesk" or "Geist"
├── Headlines: Bold, 120-200px, tight letter-spacing (-0.02em)
├── Body: Medium, 48-72px
└── Accent: Light, 36px, wide letter-spacing (0.1em)

SECONDARY TYPEFACE: "JetBrains Mono" or "Fira Code"
└── Code/Technical: Regular, 36-48px

STYLISTIC RULES:
• ALL CAPS for headlines
• Sentence case for supporting text
• Monospace for anything "crypto/tech"
```

## Motion Principles

```
EASING FUNCTIONS:
├── Dramatic Reveals: cubic-bezier(0.16, 1, 0.3, 1) — "expo out"
├── Impacts: cubic-bezier(0.68, -0.6, 0.32, 1.6) — "back out" with overshoot
├── Smooth Transitions: cubic-bezier(0.4, 0, 0.2, 1) — "ease in out"
└── Glitches: step(8) — stuttered, digital

MOTION VOCABULARY:
• Scale from 0 → 1.1 → 1 (pop with overshoot)
• Rotation: subtle, max ±3°
• Position: slide from off-screen with ease
• Opacity: never instant, minimum 8 frames
```

---

# SCENE-BY-SCENE BREAKDOWN

## ═══════════════════════════════════════════════════════════
## ACT I: THE INDICTMENT (0:00 - 0:08)
## ═══════════════════════════════════════════════════════════

### SCENE 1: THE HOOK (Frames 0-90 | 0:00-0:03)

**Duration:** 3 seconds (90 frames)

**Visual Description:**
Black screen. Silence. Then—

A single cursor blinks in the center of the screen. White. Waiting.

Text types out, character by character, with a satisfying mechanical keyboard sound:

```
"Seed phrases are a scam."
```

The text is MASSIVE. 180px. Bold. Centered. Each character appears with a subtle screen shake (±2px).

**After the sentence completes:**
- 0.5 second pause
- The entire screen GLITCHES violently for 6 frames
- RGB split effect (red shifts left, blue shifts right, 15px)
- Horizontal scan lines appear momentarily
- Static noise overlay (20% opacity)

**Animation Breakdown:**
```
Frame 0-10:     Black screen, cursor appears (fade in)
Frame 10-60:    Text types out (~1 character per 2 frames)
Frame 60-75:    Pause, tension building
Frame 75-81:    GLITCH EFFECT (6 frames)
Frame 81-90:    Text holds, slight pulse
```

**Technical Remotion Notes:**
```tsx
// Use interpolate for typewriter effect
const charIndex = interpolate(frame, [10, 60], [0, text.length], {
  extrapolateRight: 'clamp'
});

// Glitch effect at frame 75
const isGlitching = frame >= 75 && frame <= 81;
const rgbOffset = isGlitching ? 15 : 0;
const noise = isGlitching ? Math.random() * 0.2 : 0;
```

**Audio:**
- Mechanical keyboard sounds (Cherry MX Blue)
- Deep bass rumble building
- Glitch: harsh digital distortion burst (think "BWAAM")

---

### SCENE 2: THE VICTIM (Frames 90-180 | 0:03-0:06)

**Duration:** 3 seconds (90 frames)

**Visual Description:**
SMASH CUT to a real-world scene (or high-quality 3D render):

A person's hands holding a piece of paper. Dim lighting. Moody.
On the paper: a 24-word seed phrase, handwritten.

```
abandon ability able about above absent absorb abstract
absurd abuse access accident account accuse achieve acid
acoustic acquire across act action actor actress actual
```

The hands are slightly trembling. The paper is slightly crumpled.
We see the WEIGHT of this moment — the anxiety of holding your entire financial life on a piece of paper.

**Camera Movement:**
- Slow push-in (10% scale increase over 3 seconds)
- Subtle depth of field, hands in focus, background blurred
- Film grain overlay (subtle, 5% opacity)

**Text Overlay:**
At frame 120 (1 second in), text fades in at the bottom:

```
"We've been gaslit into thinking THIS is security."
```

Font: 48px, white, slight text shadow, 80% opacity
Animation: Fade up + slight slide up (20px)

**Color Treatment:**
- Desaturated (saturation: 0.7)
- Slight sepia tint
- Vignette (edges darkened)
- This should feel like a DOCUMENTARY about suffering

**Animation Breakdown:**
```
Frame 90-95:    SMASH CUT (instant transition, no fade)
Frame 90-180:   Slow zoom (scale 1.0 → 1.1)
Frame 90-180:   Subtle hand tremor (position ±1px, randomized)
Frame 120-135:  Text fades in
Frame 135-180:  Hold
```

**Audio:**
- Ambient room tone (slightly unsettling)
- Subtle heartbeat (low frequency, 60 BPM)
- Paper rustling foley

---

### SCENE 3: THE STATISTIC (Frames 180-240 | 0:06-0:08)

**Duration:** 2 seconds (60 frames)

**Visual Description:**
The paper BURNS. Not a realistic fire — a **digital burn**.

The seed phrase paper disintegrates into particles from the edges inward. The particles are glowing embers — orange to red to black.

As the paper burns, a MASSIVE statistic emerges from behind:

```
70%
```

The number is 400px tall. Bold. Blood red (#FF3366).

Below it, smaller text (72px, white):
```
of people abandon crypto wallets
within the first week
```

**Particle System:**
- 2000+ particles
- Emit from paper edges
- Physics: gravity (0.3), slight wind (drift right)
- Color: #FFD600 → #FF3366 → #0A0A0F (lifecycle)
- Size: 4px → 1px (shrink as they age)
- Glow/bloom effect on particles

**Animation Breakdown:**
```
Frame 180-190:  Paper begins burning (edges first)
Frame 190-220:  70% scales up from 0.5 → 1.0 with overshoot
Frame 200-230:  Supporting text fades in
Frame 220-240:  Paper fully disintegrated, particles settling
```

**Technical Remotion Notes:**
```tsx
// Particle system with springs
const particles = useMemo(() =>
  Array.from({ length: 2000 }, () => ({
    x: random() * width,
    y: random() * height,
    vx: (random() - 0.5) * 2,
    vy: random() * -5,
    life: random(),
    size: random() * 4 + 1,
  })), []);

// Number animation with spring
const scale = spring({
  frame: frame - 190,
  fps: 30,
  config: { damping: 12, stiffness: 100 }
});
```

**Audio:**
- Fire crackling (digital, processed)
- Impact sound on "70%" (sub-bass hit)
- Tension building drone

---

## ═══════════════════════════════════════════════════════════
## ACT II: THE SOLUTION (0:08 - 0:25)
## ═══════════════════════════════════════════════════════════

### SCENE 4: THE QUESTION (Frames 240-300 | 0:08-0:10)

**Duration:** 2 seconds (60 frames)

**Visual Description:**
BLACK SCREEN. Complete void.

Text appears, but this time it's different — it's HOPEFUL.

```
"What if you could just..."
```

Font: 72px, white, centered
Animation: Fade in softly (not typed)

Then, after 1 second, the magic word:

```
"...use Google?"
```

This text is ELECTRIC BLUE (#0066FF). It PULSES with energy.
Subtle glow effect around the text. Light rays emanating outward.

**Animation Breakdown:**
```
Frame 240-260:  "What if you could just..." fades in
Frame 260-280:  Pause for effect
Frame 280-300:  "...use Google?" appears with glow pulse
Frame 290-300:  Light rays expand outward
```

**Visual Effects:**
- Anamorphic lens flare (horizontal streak through "Google")
- Subtle light rays (volumetric, 15 rays, rotating slowly)
- Blue ambient particles floating upward

**Audio:**
- Silence during first text
- Soft synth pad enters
- Shimmer/chime sound on "Google"
- Hope building in the music

---

### SCENE 5: THE TRANSFORMATION (Frames 300-510 | 0:10-0:17)

**Duration:** 7 seconds (210 frames)

**This is the HERO MOMENT. The money shot. The proof.**

**Visual Description:**
We transition to a **screen recording style** but ELEVATED. Not a basic capture — a cinematic interpretation of the UI.

**Frame 300-330: Browser appears**
A stylized browser window materializes from light particles.
- Floating in 3D space
- Slight rotation (5° on Y axis)
- Dramatic shadow beneath
- URL bar shows: `stellaray.fun`

**Frame 330-360: Landing page loads**
The StellaRay landing page appears inside the browser.
- Content fades in section by section
- The "Sign in with Google" button GLOWS
- Subtle parallax effect as if we're moving toward it

**Frame 360-390: Cursor enters**
A custom cursor (not default) enters from bottom right.
- Smooth, confident movement
- Slight trail effect (motion blur)
- Moves toward the "Sign in with Google" button
- Button highlights on hover (scale 1.05)

**Frame 390-420: THE CLICK**
The click is THEATRICAL:
1. Button depresses (scale 0.95)
2. Ripple effect emanates from click point
3. The entire screen FLASHES white for 3 frames
4. Transition whoosh sound

**Frame 420-480: OAuth Popup**
Google OAuth popup appears:
- Slides in from center (scale 0 → 1)
- Slight bounce on landing
- "Sign in with Google" interface visible
- We see the user click "Continue"
- Popup dissolves into light particles

**Frame 480-510: THE REVEAL**
The StellaRay dashboard EMERGES.

This is not a fade — it's a **BIRTH**.

- Dashboard builds itself piece by piece
- Elements fly in from different directions
- Balance counter SPINS up: 0 → 10,000 XLM
- Green success indicators pulse
- Confetti particles explode (but subtle, not cheesy)

**The wallet address appears:**
```
GABCD...WXYZ
```

Below it, text:
```
Your wallet. Created in 2.3 seconds.
```

**Animation Breakdown:**
```
Frame 300-330:  Browser materializes (particle formation)
Frame 330-360:  Landing page content fades in
Frame 360-390:  Cursor movement + button hover
Frame 390-420:  Click + flash + transition
Frame 420-450:  OAuth popup appears + interaction
Frame 450-480:  Popup dissolves
Frame 480-510:  Dashboard builds + balance counter + celebration
```

**Technical Remotion Notes:**
```tsx
// Browser 3D transform
const browserStyle = {
  transform: `perspective(1000px) rotateY(${rotation}deg)`,
  boxShadow: `0 50px 100px rgba(0, 102, 255, 0.3)`,
};

// Balance counter animation
const displayBalance = interpolate(
  frame,
  [480, 510],
  [0, 10000],
  { extrapolateRight: 'clamp' }
);

// Confetti burst
<Confetti
  numberOfPieces={100}
  colors={['#00FF88', '#0066FF', '#00D4FF', '#FFD600']}
  trigger={frame === 505}
/>
```

**Audio:**
- Click sound (satisfying, Apple-like)
- Whoosh on transition
- Building synth crescendo
- Balance counter: slot machine ticking
- SUCCESS: triumphant chord + subtle cheer

---

### SCENE 6: THE PROOF (Frames 510-600 | 0:17-0:20)

**Duration:** 3 seconds (90 frames)

**Visual Description:**
We ZOOM into the dashboard, focusing on the ZK Proof indicator.

A stylized "VERIFIED" badge pulses with energy.

```
┌─────────────────────────────────────────┐
│  ✓  ZERO-KNOWLEDGE VERIFIED             │
│     Proof Size: 256 bytes               │
│     Verification: 12ms                  │
│     Your identity: HIDDEN               │
└─────────────────────────────────────────┘
```

The badge has:
- Glowing green border (#00FF88)
- Subtle scan line moving vertically
- Holographic shimmer effect
- The checkmark animates (draws itself)

**Text overlay:**
```
"Self-custody. Zero seed phrases.
Zero knowledge. Zero compromise."
```

This text types out dramatically, each phrase appearing on a new line.

**Animation Breakdown:**
```
Frame 510-530:  Zoom to proof badge (scale 1 → 1.5)
Frame 530-560:  Badge elements animate in
Frame 530-535:  Checkmark draws itself
Frame 560-600:  Text overlay types out, line by line
```

**Audio:**
- Electronic "verified" beep
- Subtle data transmission sounds
- Confident synth pad

---

### SCENE 7: THE TECHNOLOGY (Frames 600-690 | 0:20-0:23)

**Duration:** 3 seconds (90 frames)

**Visual Description:**
PULL BACK to reveal the ARCHITECTURE. This is the "tech flex" moment.

The dashboard shrinks to the top-left corner as we reveal a **system diagram**:

```
                    ┌─────────────┐
                    │   YOU       │
                    │  (Google)   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  SALT       │
                    │  SERVICE    │
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      ▼                      │
    │  ┌─────────────────────────────────────┐   │
    │  │         ZK PROOF GENERATION         │   │
    │  │  Poseidon(sub, aud, salt) → Address │   │
    │  └─────────────────────────────────────┘   │
    │                      │                      │
    │            STELLAR BLOCKCHAIN              │
    │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
    │  │VERIFIER │  │ WALLET  │  │REGISTRY │   │
    │  └─────────┘  └─────────┘  └─────────┘   │
    └─────────────────────────────────────────────┘
```

But this isn't a static diagram — it's ALIVE:
- Data flows animate along the paths (moving dots)
- Each component pulses when "active"
- The entire thing breathes with energy
- Neon glow on the lines

**Text overlay:**
```
"Powered by Stellar Protocol 25 (X-Ray)"
```

Then:
```
"94% cheaper than any other chain."
```

The "94%" should POP — scale up, glow, impact sound.

**Animation Breakdown:**
```
Frame 600-630:  Dashboard shrinks, diagram builds in
Frame 630-660:  Data flow animations start
Frame 660-680:  "Powered by..." text appears
Frame 680-690:  "94% cheaper" appears with impact
```

**Audio:**
- Data transmission sounds (subtle beeps, whirs)
- Electronic pulse when components light up
- Impact sound on "94%"

---

## ═══════════════════════════════════════════════════════════
## ACT III: THE CALL TO ACTION (0:23 - 0:45)
## ═══════════════════════════════════════════════════════════

### SCENE 8: THE COMPARISON (Frames 690-810 | 0:23-0:27)

**Duration:** 4 seconds (120 frames)

**Visual Description:**
Split screen comparison. OLD vs NEW.

The screen CRACKS down the middle — a jagged, electric fracture.

**LEFT SIDE (RED, desaturated):**
```
THE OLD WAY
─────────────
✗ 24-word seed phrase
✗ Browser extension required
✗ $50+ gas for ZK verification
✗ Identity exposed on-chain
✗ One mistake = funds lost forever
```

Each item fades in with a harsh "X" sound.
The whole side has a red tint, feels oppressive.

**RIGHT SIDE (BLUE/GREEN, vibrant):**
```
THE NEW WAY
─────────────
✓ Sign in with Google
✓ No installation needed
✓ $0.03 per verification
✓ Zero-knowledge privacy
✓ Same account = same wallet
```

Each item fades in with a satisfying "ding" sound.
The whole side glows with hope, particles floating upward.

**Animation Breakdown:**
```
Frame 690-705:  Screen cracks down middle
Frame 705-750:  Left side items appear (one per second)
Frame 750-795:  Right side items appear (one per second)
Frame 795-810:  Hold for comparison
```

**Audio:**
- Glass crack sound
- Left side: harsh buzzer sounds
- Right side: pleasant chime sounds
- Tension vs resolution in music

---

### SCENE 9: THE INVITATION (Frames 810-900 | 0:27-0:30)

**Duration:** 3 seconds (90 frames)

**Visual Description:**
The comparison shatters — the left side BREAKS INTO PIECES and falls away.

The right side EXPANDS to fill the screen.

Then, everything fades to reveal the HERO SHOT:

The StellaRay logo, massive, centered.

```
         ╔═══════════════════════════════════╗
         ║                                   ║
         ║         ✦ STELLARAY ✦            ║
         ║                                   ║
         ║    Zero-Knowledge Wallets for     ║
         ║         the Stellar Network       ║
         ║                                   ║
         ╚═══════════════════════════════════╝
```

The logo has:
- Subtle 3D depth (extruded)
- Animated star/sparkle around it
- Light rays emanating outward
- Floating particles surrounding it
- Gentle breathing animation (scale pulse)

**Animation Breakdown:**
```
Frame 810-830:  Left side shatters, falls
Frame 830-860:  Right side expands, fades
Frame 860-900:  Logo reveals with fanfare
```

**Audio:**
- Glass shattering
- Triumphant orchestral hit
- Sustained chord (epic, hopeful)

---

### SCENE 10: THE CTA (Frames 900-1050 | 0:30-0:35)

**Duration:** 5 seconds (150 frames)

**Visual Description:**
Below the logo, the CTA appears:

**First, the URL:**
```
stellaray.fun
```

Massive (120px). Clean. Memorable.
Animated underline draws itself beneath.

**Then, the action:**
```
Try it free. No seed phrase required.
```

Font: 48px, white, 80% opacity
Below that, a BUTTON appears:

```
┌─────────────────────────────────────┐
│      🚀  JOIN THE WAITLIST  🚀     │
└─────────────────────────────────────┘
```

The button:
- Glows with blue (#0066FF)
- Pulses gently
- Has a shimmer/shine animation moving across it
- Shadow animation (floating effect)

**Social proof counter appears:**
```
🔥 12,847 people already waiting
```

The number should be counting up live (adds 1-3 per second).

**Animation Breakdown:**
```
Frame 900-930:  URL appears with underline
Frame 930-960:  Tagline fades in
Frame 960-1000: Button appears with bounce
Frame 1000-1050: Social proof counter appears and increments
```

**Audio:**
- Subtle UI sounds for each element
- Button: satisfying "click ready" sound
- Counter: soft tick

---

### SCENE 11: THE FEATURES FLASH (Frames 1050-1200 | 0:35-0:40)

**Duration:** 5 seconds (150 frames)

**Visual Description:**
Quick-cut FEATURE MONTAGE. Fast, punchy, exciting.

Each feature appears for 30 frames (1 second):

**Feature 1 (Frame 1050-1080): Streaming Payments**
```
💸 STREAMING PAYMENTS
Real-time money flow. Per second.
[Visual: Counter ticking up rapidly]
```

**Feature 2 (Frame 1080-1110): Multi-Custody**
```
🛡️ MULTI-CUSTODY
2-of-3 guardian protection.
[Visual: Three shields forming a triangle]
```

**Feature 3 (Frame 1110-1140): ZK Proofs**
```
🔐 ZK ELIGIBILITY PROOFS
Prove anything. Reveal nothing.
[Visual: Lock transforming into checkmark]
```

**Feature 4 (Frame 1140-1170): Developer SDK**
```
⚡ 3-LINE INTEGRATION
npm install @stellar-zklogin/sdk
[Visual: Code snippet appearing]
```

**Feature 5 (Frame 1170-1200): X-Ray Protocol**
```
🔬 PROTOCOL 25 NATIVE
94% gas savings. 12ms verification.
[Visual: Metrics dashboard]
```

Each transition is a HARD CUT with a slight zoom punch.

**Animation Breakdown:**
```
Frame 1050-1080: Feature 1 (punch in, hold, punch out)
Frame 1080-1110: Feature 2
Frame 1110-1140: Feature 3
Frame 1140-1170: Feature 4
Frame 1170-1200: Feature 5
```

**Audio:**
- Quick beat/rhythm driving the cuts
- Each feature: impact sound
- Building energy in music

---

### SCENE 12: THE CLOSE (Frames 1200-1350 | 0:40-0:45)

**Duration:** 5 seconds (150 frames)

**Visual Description:**
FINAL SHOT. Maximum impact.

Everything fades to black except:

```
       THE FUTURE OF CRYPTO
       DOESN'T NEED A SEED PHRASE.
```

Font: 96px, bold, white
Centered, breathing animation

Then, below:

```
stellaray.fun
```

And finally, the tagline that encapsulates everything:

```
PROVE EVERYTHING. REVEAL NOTHING.
```

This fades in last, in ELECTRIC BLUE.

**Final Frame (1340-1350):**
Quick flash of:
- Twitter handle: @stellaraydotfun
- "Link in bio"

**Animation Breakdown:**
```
Frame 1200-1230: Fade to black
Frame 1230-1270: Main headline types in
Frame 1270-1300: URL appears
Frame 1300-1330: Tagline fades in (blue)
Frame 1330-1350: Social handles + end card
```

**Audio:**
- Music reaches crescendo, then resolves
- Final chord sustains
- Subtle "notification" sound at very end

---

# AUDIO DESIGN

## Music

**Style:** Electronic/Cinematic Hybrid
**BPM:** 120-130
**Key:** D minor (tension) → D major (resolution)

**Structure:**
```
0:00-0:08   Dark, tense, building
0:08-0:17   Release, hopeful, driving
0:17-0:30   Triumphant, energetic
0:30-0:40   Climax, all elements
0:40-0:45   Resolution, satisfying end
```

**Reference Tracks:**
- Hans Zimmer - "Time" (building emotion)
- M83 - "Midnight City" (driving synths)
- Trent Reznor - "The Social Network" (tech tension)
- Ludwig Göransson - "The Mandalorian" (heroic moments)

## Sound Effects Library

```
CATEGORY: UI/INTERACTION
├── keyboard_type_01.wav (mechanical keyboard)
├── keyboard_type_02.wav (soft variant)
├── click_button_01.wav (primary click)
├── click_button_02.wav (secondary click)
├── hover_01.wav (subtle whoosh)
├── success_chime.wav (major chord)
├── error_buzz.wav (harsh)
└── notification_ping.wav

CATEGORY: TRANSITIONS
├── whoosh_01.wav (fast transition)
├── whoosh_02.wav (slow transition)
├── impact_bass_01.wav (heavy hit)
├── impact_bass_02.wav (lighter hit)
├── glass_shatter.wav
├── paper_burn.wav
└── digital_glitch.wav

CATEGORY: AMBIENT
├── tech_drone_01.wav (continuous)
├── data_transmission.wav (beeps and blips)
├── heartbeat_low.wav (tension builder)
├── particles_shimmer.wav
└── electricity_hum.wav

CATEGORY: CELEBRATION
├── confetti_pop.wav
├── crowd_cheer_subtle.wav
├── coin_counter.wav (slot machine)
└── achievement_unlock.wav
```

---

# TECHNICAL IMPLEMENTATION

## Remotion Project Structure

```
src/
├── Video.tsx                    # Main composition
├── sequences/
│   ├── Act1_Indictment/
│   │   ├── Scene1_Hook.tsx
│   │   ├── Scene2_Victim.tsx
│   │   └── Scene3_Statistic.tsx
│   ├── Act2_Solution/
│   │   ├── Scene4_Question.tsx
│   │   ├── Scene5_Transformation.tsx
│   │   ├── Scene6_Proof.tsx
│   │   └── Scene7_Technology.tsx
│   └── Act3_CTA/
│       ├── Scene8_Comparison.tsx
│       ├── Scene9_Invitation.tsx
│       ├── Scene10_CTA.tsx
│       ├── Scene11_Features.tsx
│       └── Scene12_Close.tsx
├── components/
│   ├── Typography/
│   │   ├── Typewriter.tsx
│   │   ├── GlitchText.tsx
│   │   └── AnimatedNumber.tsx
│   ├── Effects/
│   │   ├── ParticleSystem.tsx
│   │   ├── Confetti.tsx
│   │   ├── GlowEffect.tsx
│   │   ├── RGBSplit.tsx
│   │   └── ScanLines.tsx
│   ├── UI/
│   │   ├── Browser.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Button.tsx
│   │   └── Badge.tsx
│   └── Transitions/
│       ├── SmashCut.tsx
│       ├── Shatter.tsx
│       └── Dissolve.tsx
├── hooks/
│   ├── useParticles.ts
│   ├── useGlitch.ts
│   └── useTypewriter.ts
├── utils/
│   ├── easing.ts
│   ├── colors.ts
│   └── timing.ts
├── assets/
│   ├── images/
│   ├── audio/
│   └── fonts/
└── styles/
    └── global.css
```

## Key Component Examples

### Typewriter Effect
```tsx
// components/Typography/Typewriter.tsx
import { interpolate, useCurrentFrame } from 'remotion';

interface TypewriterProps {
  text: string;
  startFrame: number;
  speed?: number; // frames per character
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  startFrame,
  speed = 2
}) => {
  const frame = useCurrentFrame();
  const endFrame = startFrame + (text.length * speed);

  const charIndex = interpolate(
    frame,
    [startFrame, endFrame],
    [0, text.length],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  const displayText = text.slice(0, Math.floor(charIndex));
  const showCursor = frame >= startFrame && frame % 15 < 8;

  return (
    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>
      {displayText}
      {showCursor && <span style={{ opacity: 0.8 }}>|</span>}
    </span>
  );
};
```

### Particle System
```tsx
// components/Effects/ParticleSystem.tsx
import { useCurrentFrame, random } from 'remotion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

export const ParticleSystem: React.FC<{
  count: number;
  origin: { x: number; y: number };
  colors: string[];
  startFrame: number;
}> = ({ count, origin, colors, startFrame }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;

  if (elapsed < 0) return null;

  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: origin.x,
      y: origin.y,
      vx: (random(`vx-${i}`) - 0.5) * 20,
      vy: (random(`vy-${i}`) - 0.5) * 20 - 5,
      size: random(`size-${i}`) * 6 + 2,
      color: colors[Math.floor(random(`color-${i}`) * colors.length)],
      life: random(`life-${i}`) * 60 + 30,
    }))
  , [count, origin, colors]);

  return (
    <AbsoluteFill>
      {particles.map(p => {
        const age = elapsed;
        if (age > p.life) return null;

        const progress = age / p.life;
        const x = p.x + p.vx * age;
        const y = p.y + p.vy * age + 0.5 * 0.3 * age * age; // gravity
        const opacity = 1 - progress;
        const scale = 1 - progress * 0.5;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: p.size * scale,
              height: p.size * scale,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
```

### Glitch Effect
```tsx
// components/Effects/RGBSplit.tsx
import { useCurrentFrame, interpolate } from 'remotion';

export const RGBSplit: React.FC<{
  children: React.ReactNode;
  intensity: number;
  startFrame: number;
  duration: number;
}> = ({ children, intensity, startFrame, duration }) => {
  const frame = useCurrentFrame();
  const isActive = frame >= startFrame && frame < startFrame + duration;

  if (!isActive) return <>{children}</>;

  const progress = (frame - startFrame) / duration;
  const offset = intensity * Math.sin(progress * Math.PI);

  return (
    <div style={{ position: 'relative' }}>
      {/* Red channel - shifted left */}
      <div style={{
        position: 'absolute',
        left: -offset,
        mixBlendMode: 'screen',
        filter: 'url(#red-channel)',
      }}>
        {children}
      </div>

      {/* Blue channel - shifted right */}
      <div style={{
        position: 'absolute',
        left: offset,
        mixBlendMode: 'screen',
        filter: 'url(#blue-channel)',
      }}>
        {children}
      </div>

      {/* Green channel - center */}
      <div style={{ mixBlendMode: 'screen' }}>
        {children}
      </div>

      {/* SVG filters for channel separation */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="red-channel">
          <feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
        </filter>
        <filter id="blue-channel">
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </svg>
    </div>
  );
};
```

## Main Composition

```tsx
// Video.tsx
import { Composition } from 'remotion';

export const DeathOfSeedPhrasesVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="DeathOfSeedPhrases"
        component={MainVideo}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />

      {/* Alternate 16:9 version */}
      <Composition
        id="DeathOfSeedPhrases-Landscape"
        component={MainVideo}
        durationInFrames={1350}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ landscape: true }}
      />
    </>
  );
};

const MainVideo: React.FC<{ landscape?: boolean }> = ({ landscape }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0F' }}>
      {/* ACT I: THE INDICTMENT */}
      <Sequence from={0} durationInFrames={90}>
        <Scene1_Hook />
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <Scene2_Victim />
      </Sequence>

      <Sequence from={180} durationInFrames={60}>
        <Scene3_Statistic />
      </Sequence>

      {/* ACT II: THE SOLUTION */}
      <Sequence from={240} durationInFrames={60}>
        <Scene4_Question />
      </Sequence>

      <Sequence from={300} durationInFrames={210}>
        <Scene5_Transformation />
      </Sequence>

      <Sequence from={510} durationInFrames={90}>
        <Scene6_Proof />
      </Sequence>

      <Sequence from={600} durationInFrames={90}>
        <Scene7_Technology />
      </Sequence>

      {/* ACT III: THE CALL TO ACTION */}
      <Sequence from={690} durationInFrames={120}>
        <Scene8_Comparison />
      </Sequence>

      <Sequence from={810} durationInFrames={90}>
        <Scene9_Invitation />
      </Sequence>

      <Sequence from={900} durationInFrames={150}>
        <Scene10_CTA />
      </Sequence>

      <Sequence from={1050} durationInFrames={150}>
        <Scene11_Features />
      </Sequence>

      <Sequence from={1200} durationInFrames={150}>
        <Scene12_Close />
      </Sequence>

      {/* AUDIO LAYER */}
      <Audio src={staticFile('audio/music.mp3')} />
      <Audio src={staticFile('audio/sfx.mp3')} />
    </AbsoluteFill>
  );
};
```

---

# RENDER SPECIFICATIONS

## Output Formats

```
PRIMARY (Twitter/TikTok/Reels):
├── Resolution: 1080x1920 (9:16)
├── Codec: H.264
├── Bitrate: 8 Mbps
├── Frame Rate: 30 fps
├── Audio: AAC 192kbps stereo
└── File: death-of-seed-phrases-vertical.mp4

SECONDARY (YouTube/Website):
├── Resolution: 1920x1080 (16:9)
├── Codec: H.264
├── Bitrate: 12 Mbps
├── Frame Rate: 30 fps
├── Audio: AAC 256kbps stereo
└── File: death-of-seed-phrases-landscape.mp4

PREVIEW (Quick share):
├── Resolution: 720x1280
├── Codec: H.264
├── Bitrate: 4 Mbps
└── File: death-of-seed-phrases-preview.mp4
```

## Render Commands

```bash
# Vertical (Twitter/TikTok)
npx remotion render src/index.tsx DeathOfSeedPhrases \
  --output=out/death-of-seed-phrases-vertical.mp4 \
  --codec=h264 \
  --crf=18

# Landscape (YouTube)
npx remotion render src/index.tsx DeathOfSeedPhrases-Landscape \
  --output=out/death-of-seed-phrases-landscape.mp4 \
  --codec=h264 \
  --crf=18

# GIF preview (for embeds)
npx remotion render src/index.tsx DeathOfSeedPhrases \
  --output=out/preview.gif \
  --frames=300-510 \
  --scale=0.5
```

---

# POST-PRODUCTION CHECKLIST

## Before Render
- [ ] All audio synced to frame
- [ ] Text checked for typos
- [ ] Colors consistent across scenes
- [ ] Transitions smooth
- [ ] No flickering or artifacts
- [ ] Preview on mobile device (actual size)

## After Render
- [ ] Watch full video 3 times
- [ ] Check audio levels (no clipping)
- [ ] Verify text readability on mobile
- [ ] Test on Twitter preview (does hook work?)
- [ ] Create 3 thumbnail options
- [ ] Write tweet copy (3 versions)
- [ ] Schedule optimal posting time

## Distribution Checklist
- [ ] Upload to Twitter
- [ ] Upload to TikTok
- [ ] Upload to Instagram Reels
- [ ] Upload to YouTube Shorts
- [ ] Embed on website
- [ ] Send to email list
- [ ] Share in Discord
- [ ] Share in Telegram

---

# CREATIVE SIGN-OFF

**This video should make people:**
1. Stop scrolling immediately (the hook)
2. Feel the pain of seed phrases (the indictment)
3. Feel relief at the solution (the transformation)
4. Feel excitement to try it (the CTA)
5. Feel compelled to share it (the controversy)

**Quality Benchmarks:**
- Would this fit in an Apple keynote? YES.
- Would this fit in a Marvel trailer? YES.
- Would you retweet this? YES.

**This is not a product demo. This is a movement.**

---

*"The death of seed phrases isn't a feature announcement. It's a cultural shift. This video marks the moment everything changed."*

— Creative Brief, StellaRay V001

---

**Production Status:** READY FOR DEVELOPMENT
**Approved By:** _______________
**Date:** _______________
