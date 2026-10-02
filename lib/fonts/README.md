Two `next/font/local` instances of the same file: next/font decides which fonts to preload
from the module graph of each route, so English routes import `en.ts` (preloaded) and
Japanese routes import `ja.ts` (not preloaded). Japanese headings are set in system
Mincho, so their LCP never waits for a Latin web font. `unicode-range` limits the face to
Latin, so CJK text never triggers a download either.
