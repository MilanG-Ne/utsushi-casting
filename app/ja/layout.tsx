import type { ReactNode } from "react";
import { RootDocument } from "@/components/RootDocument";
import { fraunces } from "@/lib/fonts/ja";
import { layoutMetadata, layoutViewport } from "@/lib/seo/layout";

export const metadata = layoutMetadata("ja");
export const viewport = layoutViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <RootDocument lang="ja" fontClassName={fraunces.variable}>{children}</RootDocument>;
}
