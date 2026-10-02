import { CaseStudyPage, caseStudyMetadata, caseStudyParams } from "@/views/case-study";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = caseStudyParams;
// Only slugs known at build time exist; anything else falls through to the global 404.
export const dynamicParams = false;
export const generateMetadata = ({ params }: Props) => caseStudyMetadata("ja", params);

export default function Page({ params }: Props) {
  return <CaseStudyPage lang="ja" params={params} />;
}
