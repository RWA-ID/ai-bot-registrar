// Drawn, not the ↗ glyph: U+2197 is an emoji codepoint and iOS renders it as a colour emoji.
export function ArrowNE({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`inline-block shrink-0 ${className}`}
      width="0.85em"
      height="0.85em"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" />
    </svg>
  );
}
