import type { ElementType } from "react";
import type { Text } from "@/lib/content";

/**
 * Renders localized CMS text. When the requested translation was missing and the text
 * fell back to English, the element carries lang="en" so assistive tech reads it right.
 */
export function Txt({ value, as: Tag = "span", className, id }: { value: Text; as?: ElementType; className?: string; id?: string }) {
  if (!value.lang && !className && !id && Tag === "span") return <>{value.text}</>;
  return (
    <Tag lang={value.lang} className={className} id={id}>
      {value.text}
    </Tag>
  );
}
