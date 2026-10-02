import type { ReactNode } from "react";
import "@/app/globals.css";
import type { Locale } from "@/lib/i18n/config";
import { Analytics } from "./Analytics";
import { PopoverFocusGuard } from "./PopoverFocusGuard";

export function RootDocument({ lang, fontClassName, children }: { lang: Locale; fontClassName: string; children: ReactNode }) {
  return (
    <html lang={lang} className={fontClassName}>
      <body>
        {children}
        <PopoverFocusGuard />
        <Analytics />
      </body>
    </html>
  );
}
