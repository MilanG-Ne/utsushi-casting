import { NotFoundPage, notFoundMetadata } from "@/views/not-found";

export const metadata = notFoundMetadata("en");

export default function NotFound() {
  return <NotFoundPage lang="en" />;
}
