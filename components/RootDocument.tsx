import type { ReactNode } from "react";
import "@/app/globals.css";
import type { Locale } from "@/lib/i18n/config";
import { fraunces } from "@/lib/fonts";
import { Analytics } from "./Analytics";
import { PopoverFocusGuard } from "./PopoverFocusGuard";

export function RootDocument({ lang, children }: { lang: Locale; children: ReactNode }) {
  return (
    <html lang={lang} className={fraunces.variable}>
      <body>
        {children}
        <PopoverFocusGuard />
        <Analytics />
      </body>
    </html>
  );
}
