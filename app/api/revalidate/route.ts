import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { CONTENT_TAG } from "@/lib/content/queries";

/**
 * Sanity GROQ-powered webhook target. Configure it in sanity.io/manage → API → Webhooks:
 *   URL: https://<site>/api/revalidate   Trigger: create, update, delete
 *   Projection: {_type, "slug": slug.current}   Secret: SANITY_REVALIDATE_SECRET
 * Edits to existing documents go live without a rebuild. New slugs need a deploy, because
 * unknown slugs are answered by the static 404 (dynamicParams = false).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: "Revalidation is not configured" }, { status: 501 });

  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string; slug?: string }>(req, secret, true);
    if (!isValidSignature) return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    if (!body?._type) return NextResponse.json({ message: "Missing _type" }, { status: 400 });

    // Expire immediately so the next request renders fresh content.
    revalidateTag(CONTENT_TAG, { expire: 0 });
    return NextResponse.json({ revalidated: true, type: body._type, slug: body.slug ?? null, now: Date.now() });
  } catch (error) {
    console.error("[revalidate] failed", error);
    return NextResponse.json({ message: "Could not revalidate" }, { status: 500 });
  }
}
