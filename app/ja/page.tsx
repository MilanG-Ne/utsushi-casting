import { HomePage, homeMetadata } from "@/views/home";

export const generateMetadata = () => homeMetadata("ja");

export default function Page() {
  return <HomePage lang="ja" />;
}
