import { HomePage, homeMetadata } from "@/views/home";

export const generateMetadata = () => homeMetadata("en");

export default function Page() {
  return <HomePage lang="en" />;
}
