import { getSiteSettings } from "../content";
import type { Image } from "../content/types";
import type { Locale } from "../i18n/config";
import { absoluteUrl, href, type AppRoute } from "../i18n/routes";
import { breadcrumbNode, graph, organizationNode, webPageNode, websiteNode, type Crumb } from "./jsonld";

type Input = {
  lang: Locale;
  route: AppRoute;
  title: string;
  description: string;
  type?: Parameters<typeof webPageNode>[0]["type"];
  crumbs?: Crumb[];
  primaryImage?: Image;
  mainEntityId?: string;
  extra?: Record<string, unknown>[];
};

/** Organization + WebSite + WebPage (+ BreadcrumbList) + page-specific nodes, as one @graph. */
export async function pageGraph(input: Input) {
  const [en, ja] = await Promise.all([getSiteSettings("en"), getSiteSettings("ja")]);
  const url = absoluteUrl(href(input.route, input.lang));
  return graph([
    organizationNode({ en, ja }, input.lang),
    websiteNode(input.lang),
    webPageNode({
      type: input.type,
      route: input.route,
      lang: input.lang,
      title: input.title,
      description: input.description,
      hasBreadcrumb: Boolean(input.crumbs?.length),
      primaryImage: input.primaryImage,
      mainEntityId: input.mainEntityId,
    }),
    ...(input.crumbs?.length ? [breadcrumbNode(url, input.crumbs)] : []),
    ...(input.extra ?? []),
  ]);
}
