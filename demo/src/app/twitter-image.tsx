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
              gap: 16,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: "#0066FF",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24">
                <line
                  x1="4"
                  y1="4"
                  x2="20"
                  y2="20"
                  stroke="white"
                  strokeWidth="2.5"
                />
                <line
                  x1="20"
                  y1="4"
                  x2="4"
                  y2="20"
                  stroke="#00D4FF"
                  strokeWidth="2.5"
                />
                <circle cx="12" cy="12" r="2.5" fill="white" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
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
