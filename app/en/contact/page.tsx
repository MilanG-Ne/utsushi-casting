import { ContactPage, contactMetadata } from "@/views/contact";

export const generateMetadata = () => contactMetadata("en");

export default function Page() {
  return <ContactPage lang="en" />;
}
