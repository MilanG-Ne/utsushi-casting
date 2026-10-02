import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Link from "next/link";
import type { Blocks } from "@/lib/content";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    normal: ({ children }) => <p>{children}</p>,
  },
  marks: {
    link: ({ value, children }) => {
      const href = (value as { href?: string } | undefined)?.href ?? "#";
      return href.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>;
    },
  },
};

/** Portable Text rendered on the server. Falls back to lang="en" when untranslated. */
export function RichText({ value, className = "prose" }: { value: Blocks; className?: string }) {
  if (value.blocks.length === 0) return null;
  return (
    <div className={className} lang={value.lang}>
      <PortableText value={value.blocks} components={components} />
    </div>
  );
}
