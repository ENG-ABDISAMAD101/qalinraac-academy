import type { ReactNode } from "react";

/**
 * The landing-page description is stored as plain text with a tiny markup
 * subset (`**bold**`, `*italic*`, `- ` list items). Preview rendering happens
 * through React nodes, never raw HTML injection.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${index}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(<em key={`${keyPrefix}-i-${index}`}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
    index += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function renderRichPreview(source: string): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="list-disc space-y-1 pl-5 text-sm text-muted-foreground"
      >
        {bullets.map((item, i) => (
          <li key={i}>{inline(item, `ul-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*]\s+/, ""));
      return;
    }
    flushBullets();
    if (!line.trim()) return;
    blocks.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-muted-foreground">
        {inline(line, `p-${i}`)}
      </p>,
    );
  });
  flushBullets();

  return blocks;
}
