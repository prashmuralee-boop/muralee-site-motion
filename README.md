# muralee-site-motion

Motion code for the MURALEE website (muralee.co): menu, page transitions, scroll effects, the booking form steps and the hero coordinate roll.

## Files
| Path | What it is |
|---|---|
| src/muralee-motion.js | Readable source |
| dist/muralee-motion.min.js | Minified build loaded by the site |

## How the site loads it
Pinned to a tag on jsDelivr, with Subresource Integrity:

```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.4/dist/lenis.min.js" integrity="sha384-FKTX0CNJ8ngN1oGMBReVu7mvjTJyjFiD5etb1NKnYxc+8eFI2O0KWnksTN+oTFcu" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/gh/OWNER/muralee-site-motion@v0.1.1/dist/muralee-motion.min.js" integrity="SRI_HASH" crossorigin="anonymous" defer></script>
```

## Dependencies (not in this repo)
* GSAP 3 with ScrollTrigger, from Webflow's built in GSAP setting (or the official jsDelivr npm package).
* Lenis 1.3.4, from the official jsDelivr npm package.

Without GSAP, or with reduced motion switched on, the code falls back to a flat, fully readable page.

## Releasing a change
1. Edit src, rebuild dist.
2. Commit, then tag a new version (v0.1.1 and so on). Never move an existing tag.
3. Update the URL and the integrity hash in the Webflow footer code.

## Licence
All rights reserved. See LICENSE.
