/**
 * Plausible Analytics: cookieless and without personal data, so no consent banner is
 * needed. Rendered only when NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL is set (the per-site script
 * URL shown in Plausible under Site settings → Site installation). React hoists the async
 * script into <head>; the inline stub queues events (such as "Enquiry") until it loads.
 */
const stub =
  "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()";

export function Analytics() {
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL;
  if (!src) return null;
  return (
    <>
      <script async src={src} />
      <script dangerouslySetInnerHTML={{ __html: stub }} />
    </>
  );
}
