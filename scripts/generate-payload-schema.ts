/** Writes docs/enquiry-payload.schema.json from the zod schema the API uses. */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { enquiryPayloadSchema } from "../lib/enquiries/schema";

export function payloadJsonSchema() {
  return {
    $id: "https://github.com/MilanG-Ne/utsushi-casting/blob/main/docs/enquiry-payload.schema.json",
    title: "Utsushi Casting enquiry payload v1",
    ...z.toJSONSchema(enquiryPayloadSchema, { target: "draft-2020-12" }),
  };
}

if (process.argv[1]?.endsWith("generate-payload-schema.ts")) {
  const out = join(process.cwd(), "docs", "enquiry-payload.schema.json");
  writeFileSync(out, JSON.stringify(payloadJsonSchema(), null, 2) + "\n");
  console.log(`Wrote ${out}`);
}
