import { WorkIndexPage, workIndexMetadata } from "@/views/work-index";

export const generateMetadata = () => workIndexMetadata("ja");

export default function Page() {
  return <WorkIndexPage lang="ja" />;
}
