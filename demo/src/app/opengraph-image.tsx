import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "STELLARAY - Prove Everything. Reveal Nothing.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          position: "relative",
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0, 102, 255, 0.1) 0%, transparent 50%, rgba(0, 212, 255, 0.1) 100%)",
          }}
        />

        {/* Corner accents - Top Left */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 80,
            height: 3,
            backgroundColor: "#0066FF",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 3,
            height: 80,
            backgroundColor: "#0066FF",
          }}
        />

        {/* Corner accents - Top Right */}
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            width: 80,
            height: 3,
            backgroundColor: "#00D4FF",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            width: 3,
            height: 80,
            backgroundColor: "#00D4FF",
          }}
        />

        {/* Corner accents - Bottom Left */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
            width: 80,
            height: 3,
            backgroundColor: "#00D4FF",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
            width: 3,
            height: 80,
            backgroundColor: "#00D4FF",
          }}
        />

        {/* Corner accents - Bottom Right */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            width: 80,
            height: 3,
            backgroundColor: "#0066FF",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            width: 3,
            height: 80,
            backgroundColor: "#0066FF",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 40,
            }}
          >
            {/* Eye with bolt logo */}
            <svg width="72" height="72" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="og-eye-grad" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#00AAFF" />
                  <stop offset="40%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#00CCFF" />
                </linearGradient>
                <linearGradient id="og-bolt-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="40%" stopColor="#88DDFF" />
                  <stop offset="100%" stopColor="#0066FF" />
                </linearGradient>
              </defs>
              {/* Top arc */}
              <path
                d="M 10 50 Q 30 20, 50 20 Q 70 20, 90 50"
                fill="none"
                stroke="url(#og-eye-grad)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Bottom arc */}
              <path
                d="M 10 50 Q 30 80, 50 80 Q 70 80, 90 50"
                fill="none"
                stroke="url(#og-eye-grad)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Bolt - TOP-RIGHT to BOTTOM-LEFT */}
              <line
                x1="88"
                y1="5"
                x2="12"
                y2="95"
                stroke="url(#og-bolt-grad)"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              STELLA
              <span style={{ color: "#0066FF" }}>RAY</span>
            </span>
          </div>

          {/* Main headline */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "white",
              textAlign: "center",
              marginBottom: 16,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Prove Everything.
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #0066FF, #00D4FF)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Reveal Nothing.
            </span>
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            ZK-powered Stellar wallet. Sign in with Google. No seed phrases.
          </p>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 40,
              padding: "12px 24px",
              backgroundColor: "rgba(0, 102, 255, 0.15)",
              border: "1px solid rgba(0, 102, 255, 0.3)",
              borderRadius: 100,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#0066FF",
              }}
            />
            <span
              style={{
                fontSize: 20,
                color: "#0066FF",
                fontWeight: 600,
              }}
            >
              stellaray.fun
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
