/**
 * Native popovers (services panel, mobile menu) light-dismiss on click and Esc, but not
 * when keyboard focus moves past them. This tiny inline script closes an open popover as
 * soon as focus leaves it and its trigger, so focus is never hidden behind an open panel
 * (WCAG 2.2 SC 2.4.11). ~300 bytes, no framework code.
 */
const script = `document.addEventListener("focusin",function(e){var t=e.target;document.querySelectorAll("[popover]").forEach(function(p){if(!p.matches(":popover-open"))return;var i=document.querySelector('[popovertarget="'+p.id+'"]');if(!p.contains(t)&&!(i&&i.contains(t)))p.hidePopover()})});`;

export function PopoverFocusGuard() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
