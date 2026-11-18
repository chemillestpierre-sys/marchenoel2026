export function SnowflakesPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="snow-motif" width="160" height="120" patternUnits="userSpaceOnUse">
          {/* Flocon principal discret */}
          <g transform="translate(28, 30)" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.22">
            <line x1="0" y1="-10" x2="0" y2="10" />
            <line x1="-8.6" y1="-5" x2="8.6" y2="5" />
            <line x1="-8.6" y1="5" x2="8.6" y2="-5" />
            <circle cx="0" cy="0" r="2" fill="none" />
          </g>
          {/* Petit flocon */}
          <g transform="translate(115, 76)" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.18">
            <line x1="0" y1="-7" x2="0" y2="7" />
            <line x1="-6" y1="-3.5" x2="6" y2="3.5" />
            <line x1="-6" y1="3.5" x2="6" y2="-3.5" />
          </g>
          {/* Points de neige */}
          <circle cx="78" cy="22" r="1.5" fill="currentColor" opacity="0.2" />
          <circle cx="140" cy="28" r="1.2" fill="currentColor" opacity="0.16" />
          <circle cx="48" cy="94" r="1.4" fill="currentColor" opacity="0.18" />
          <circle cx="96" cy="104" r="1" fill="currentColor" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#snow-motif)" />
    </svg>
  );
}
