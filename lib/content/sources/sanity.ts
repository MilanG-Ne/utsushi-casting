import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { CONTENT_QUERY, CONTENT_TAG } from "../queries";

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Builds and revalidations read straight from the API so a webhook-triggered
  // revalidation never picks up a stale CDN copy.
  useCdn: false,
  perspective: "published",
});

export async function fetchSanityBundle(): Promise<unknown> {
  return client.fetch(CONTENT_QUERY, {}, { cache: "force-cache", next: { tags: [CONTENT_TAG] } });
}
