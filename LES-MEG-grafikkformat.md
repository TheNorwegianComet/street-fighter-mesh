# Grafikk-info til Claude Code

Dette er sprite-grafikken til fightingspillet. Les dette før du kobler grafikk til kode.

## Format (gjelder ALLE karakterer og animasjoner)
- Hver animasjon finnes i to former — bruk det du foretrekker:
  1. **Separate frames**: nummererte PNG-filer (01.png, 02.png, ...) — én frame per fil
  2. **Samlet spritesheet**: `_spritesheet.png` — alle frames i ett ark
- Hver enkelt frame er **256 x 256 piksler**, transparent PNG (RGBA)
- Det samlede spritesheetet er **1280 x 1280 piksler** = et **5 x 5 rutenett** (25 ruter à 256x256),
  lest venstre-til-høyre, topp-til-bunn (rute 1 = øverst venstre, rute 5 = øverst høyre,
  rute 6 = andre rad venstre, osv.)
- Det er ingen JSON-atlas — den trengs ikke, fordi rutenettet er helt regelmessig (256x256)
  og framene er nummerert i avspillingsrekkefølge.

## Viktig om plassering i ruta
Figuren fyller ikke hele 256x256-ruta. Den står omtrent sentrert, og er relativt smal
(ca. 80-90 px bred, ca. 165 px høy, plassert rundt midten). Føttene står omtrent på
samme høyde i alle frames. Bruk gjerne hver frames innhold som det er — ikke anta at
figuren fyller hele ruta. Hvis du trenger en hitboks, beregn den ut fra figurens faktiske
piksler (den ikke-transparente delen), ikke ut fra hele 256x256-ruta.

## Karakteren som finnes nå
- **runar_red** (visningsnavn: "Runar Red") — spiller 1 / første kollega
  - `idle/` — 25 frames, rolig kampstilling med vektforskyvning (spilles når man står stille)
  - `walk/` — 25 frames, gangsyklus (spilles når man beveger seg)
  - Mangler foreløpig: attack, hit, knockout (kommer senere — bygg motoren slik at
    disse er lette å legge til som nye mapper med samme format)

## Slik legges en ny animasjon eller karakter til
- Ny animasjon: legg en ny mappe (f.eks. `attack/`) med samme format (256x256 frames,
  nummerert, + valgfritt `_spritesheet.png`).
- Ny karakter: lag en ny mappe under `characters/` (f.eks. `characters/sanna_blue/`)
  med samme undermapper. Alt skal være data-drevet — ingen ny motorkode skal trengs.
