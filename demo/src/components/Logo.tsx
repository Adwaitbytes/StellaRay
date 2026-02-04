"use client";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizes = {
  xs: { icon: 28, text: "text-sm", gap: "gap-2" },
  sm: { icon: 32, text: "text-base", gap: "gap-2" },
  md: { icon: 38, text: "text-lg", gap: "gap-2.5" },
  lg: { icon: 48, text: "text-xl", gap: "gap-3" },
  xl: { icon: 56, text: "text-2xl", gap: "gap-3" },
};

// StellaRay Logo - Eye with lightning bolt cutting through from TOP-RIGHT to BOTTOM-LEFT
function LogoSvg({ size }: { size: number }) {
  const id = `logo-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="flex-shrink-0"
    >
      <defs>
        {/* Glow filter */}
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Strong glow for bolt */}
        <filter id={`${id}-bolt-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Eye gradient - cyan/blue edges, white center */}
        <linearGradient id={`${id}-eye`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#00AAFF" />
          <stop offset="40%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#00CCFF" />
        </linearGradient>

        {/* Bolt gradient - white at top-right to blue at bottom-left */}
        <linearGradient id={`${id}-bolt`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#88DDFF" />
          <stop offset="100%" stopColor="#0066FF" />
        </linearGradient>
      </defs>

      {/* Eye shape - horizontal lens/almond */}
      <g filter={`url(#${id}-glow)`}>
        {/* Top arc */}
        <path
          d="M 10 50 Q 30 20, 50 20 Q 70 20, 90 50"
          fill="none"
          stroke={`url(#${id}-eye)`}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Bottom arc */}
        <path
          d="M 10 50 Q 30 80, 50 80 Q 70 80, 90 50"
          fill="none"
          stroke={`url(#${id}-eye)`}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </g>

      {/* Lightning bolt - from TOP-RIGHT to BOTTOM-LEFT */}
      <g filter={`url(#${id}-bolt-glow)`}>
        <line
          x1="88"
          y1="5"
          x2="12"
          y2="95"
          stroke={`url(#${id}-bolt)`}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function Logo({ size = "md", showText = true, className = "", textClassName = "" }: LogoProps) {
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <LogoSvg size={s.icon} />
      {showText && (
        <span className={`${s.text} font-black tracking-tight ${textClassName}`}>
          STELLA<span className="text-[#0066FF]">RAY</span>
        </span>
      )}
    </div>
  );
}

// Icon-only version
export function LogoIcon({ size = "md", className = "" }: { size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  return <Logo size={size} showText={false} className={className} />;
}

export default Logo;
