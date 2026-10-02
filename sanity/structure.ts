import type { StructureResolver } from "sanity/structure";
import { PAGE_KEYS } from "./schemaTypes/page";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings").title("Site settings")),
      S.listItem()
        .title("Pages")
        .child(
          S.list()
            .title("Pages")
            .items(
              PAGE_KEYS.map((p) =>
                S.listItem()
                  .title(p.title)
                  .id(`page.${p.value}`)
                  .child(S.document().schemaType("page").documentId(`page.${p.value}`).title(p.title)),
              ),
            ),
        ),
      S.divider(),
      S.documentTypeListItem("caseStudy").title("Case studies"),
      S.documentTypeListItem("service").title("Services"),
    ]);
