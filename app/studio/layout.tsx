import type { ReactNode } from "react";

export const metadata = {
  title: "Studio — Utsushi Casting",
  robots: { index: false, follow: false },
};

/** Root layout for the embedded Studio; it shares nothing with the public site. */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
