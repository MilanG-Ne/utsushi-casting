import { NotFoundPage, notFoundMetadata } from "@/views/not-found";

export const metadata = notFoundMetadata("ja");

export default function NotFound() {
  return <NotFoundPage lang="ja" />;
}
