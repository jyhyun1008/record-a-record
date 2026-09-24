import type { ReactNode } from "react";

const BOLD_PATTERN = /\*\*(.+?)\*\*/g;

// Minimal **bold** support so writing can stay a plain textarea while still
// letting a phrase get the highlighter treatment, matching --theme-color4.
export function renderRichText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  BOLD_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BOLD_PATTERN.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <strong key={key++} className="highlight font-semibold">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}

export function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}
