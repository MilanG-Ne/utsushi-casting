/**
 * One GROQ query returns the whole (small) site. Every page reads from this single,
 * tag-cached result, and a Sanity webhook revalidates it on publish.
 */
const IMAGE = `{
  "url": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  "lqip": asset->metadata.lqip,
  alt
}`;

const VIDEO = `{ title, description, url, durationSeconds, uploadDate, hasAudio, "poster": poster${IMAGE} }`;

const SERVICE_REF = `{ "slug": slug.current, title, shortSummary }`;

export const CONTENT_QUERY = /* groq */ `{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    name, tagline, description, email, foundingYear,
    studios[]{ city, area, addressLocality, addressCountry }
  },
  "pages": *[_type == "page" && defined(key)]{
    key, title, eyebrow, heading, intro, body,
    stats[]{ value, label },
    "featuredCaseStudies": featuredCaseStudies[]->slug.current,
    "showreel": showreel${VIDEO},
    process[]{ title, body },
    seo{ title, description }
  },
  "services": *[_type == "service" && defined(slug.current)] | order(order asc){
    "slug": slug.current, title, shortSummary, summary,
    "heroImage": heroImage${IMAGE},
    body, deliverables,
    process[]{ title, body },
    faq[]{ question, answer },
    order,
    seo{ title, description }
  },
  "caseStudies": *[_type == "caseStudy" && defined(slug.current)] | order(order asc){
    "slug": slug.current, title, client, year, format, locations, rolesCast, summary,
    "heroImage": heroImage${IMAGE},
    "video": video${VIDEO},
    body,
    outcomes[]{ value, label },
    credits[]{ role, name },
    "services": services[]->${SERVICE_REF},
    order,
    seo{ title, description }
  }
}`;

/** Cache tag shared by every Sanity fetch; the webhook route revalidates it. */
export const CONTENT_TAG = "sanity:content";
