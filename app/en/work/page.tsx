import { WorkIndexPage, workIndexMetadata } from "@/views/work-index";

export const generateMetadata = () => workIndexMetadata("en");

export default function Page() {
  return <WorkIndexPage lang="en" />;
}
