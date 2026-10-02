/**
 * Seeds a Sanity dataset with the bilingual demo content.
 *
 *   NEXT_PUBLIC_SANITY_PROJECT_ID=xxxx SANITY_API_WRITE_TOKEN=sk... pnpm seed
 *   pnpm seed --dry-run      # prints the prepared documents, no network access
 *
 * Idempotent: documents use fixed IDs and are written with createOrReplace; Sanity
 * deduplicates identical image uploads by content hash. Images are uploaded from the
 * generated variants in public/media/img. Videos stay on the website (/media/video).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@sanity/client";
import { seedDocuments } from "../content/seed/documents";

const dryRun = process.argv.includes("--dry-run");
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!dryRun && (!projectId || !token)) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (an Editor token) to seed.");
  process.exit(1);
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
const isObject = (v: Json): v is { [key: string]: Json } => typeof v === "object" && v !== null && !Array.isArray(v);

function collectLocalFiles(value: Json, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectLocalFiles(v, found));
  else if (isObject(value)) {
    if (typeof value.localFile === "string") found.add(value.localFile);
    Object.values(value).forEach((v) => collectLocalFiles(v, found));
  }
  return found;
}

function replaceLocalFiles(value: Json, assets: Map<string, string>): Json {
  if (Array.isArray(value)) return value.map((v) => replaceLocalFiles(v, assets));
  if (!isObject(value)) return value;
  if (typeof value.localFile === "string") {
    const assetId = assets.get(value.localFile);
    if (!assetId) throw new Error(`No uploaded asset for ${value.localFile}`);
    const rest = { ...value };
    delete rest.localFile;
    return { ...rest, asset: { _type: "reference", _ref: assetId } };
  }
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceLocalFiles(v, assets)]));
}

async function main() {
  const docs = seedDocuments as unknown as Json[];
  const files = collectLocalFiles(docs);
  const assets = new Map<string, string>();

  if (dryRun) {
    for (const name of files) assets.set(name, `image-dryrun-${name}`);
    const prepared = docs.map((doc) => replaceLocalFiles(doc, assets));
    console.log(prepared.map((d) => JSON.stringify(d)).join("\n"));
    console.error(`\nDry run: ${prepared.length} documents, ${files.size} images. Nothing was written.`);
    return;
  }

  const client = createClient({ projectId, dataset, token, apiVersion: "2026-09-01", useCdn: false });

  for (const name of files) {
    const path = join(process.cwd(), "public", "media", "img", `${name}-1920.webp`);
    const asset = await client.assets.upload("image", await readFile(path), { filename: `${name}.webp` });
    assets.set(name, asset._id);
    console.log(`  image  ${name} → ${asset._id}`);
  }

  const tx = client.transaction();
  for (const doc of docs) {
    const prepared = replaceLocalFiles(doc, assets) as { _id: string; _type: string };
    tx.createOrReplace(prepared);
    console.log(`  doc    ${prepared._type.padEnd(12)} ${prepared._id}`);
  }
  await tx.commit({ visibility: "async" });
  console.log(`\nSeeded ${docs.length} documents and ${assets.size} images into ${projectId}/${dataset}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
