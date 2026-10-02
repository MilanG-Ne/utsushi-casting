import type { ReactNode } from "react";
import { RootDocument } from "@/components/RootDocument";
import { fraunces } from "@/lib/fonts/en";
import { layoutMetadata, layoutViewport } from "@/lib/seo/layout";

export const metadata = layoutMetadata("en");
export const viewport = layoutViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <RootDocument lang="en" fontClassName={fraunces.variable}>{children}</RootDocument>;
}
