import type { ReactNode } from "react";
import { RootDocument } from "@/components/RootDocument";
import { layoutMetadata, layoutViewport } from "@/lib/seo/layout";

export const metadata = layoutMetadata("ja");
export const viewport = layoutViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <RootDocument lang="ja">{children}</RootDocument>;
}
