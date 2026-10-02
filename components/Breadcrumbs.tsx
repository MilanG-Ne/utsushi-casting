import Link from "next/link";

export type Crumb = { label: string; href: string; lang?: string };

/** Visible breadcrumb trail. The matching BreadcrumbList JSON-LD is built from the same items. */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav className="breadcrumbs" aria-label={label}>
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href}>
              {last ? (
                <span aria-current="page" lang={item.lang}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} lang={item.lang}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
