import { ContactPage, contactMetadata } from "@/views/contact";

export const generateMetadata = () => contactMetadata("ja");

export default function Page() {
  return <ContactPage lang="ja" />;
}
