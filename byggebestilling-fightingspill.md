# Byggebestilling: 2D fightingspill med teamet som karakterer

## Kontekst til deg (Claude Code)
Jeg lager et gøy internt fightingspill (Street Fighter-stil) der karakterene er
kolleger på teamet mitt. Jeg er ikke en erfaren utvikler, så forklar valg
underveis og hold koden lesbar. Spillet skal kjøre i nettleseren med HTML5
Canvas og ren JavaScript — ingen tunge rammeverk, ingen byggesteg jeg må sette
opp. Jeg vil kunne åpne en fil i nettleseren og spille.

## Viktigst av alt: les dette først
IKKE skriv kode med en gang. Foreslå først en arkitektur og vent på at jeg
godkjenner. Når vi koder, lag ÉN komplett karakter og ÉN bane før vi lager
flere, så jeg ser at alt funker før vi multipliserer.

## Grafikken jeg leverer
Hver karakter kommer som ett transparent PNG-spritesheet i et fast rutenett,
pluss (der jeg har det) en JSON-atlas som beskriver hvor hver frame sitter.
Alle karakterer følger SAMME mal:
- Ren sidevisning, hel figur, transparent bakgrunn
- Samme rutestørrelse for alle: 256 x 256 piksler per frame
  (hvis spritesheet-verktøyet mitt gir meg en annen størrelse enn dette, sier
   jeg ifra og oppgir det faktiske tallet i stedet)
- Samme handlinger for alle, i denne rekkefølgen:
  idle, walk, punch, kick, hit, knockout
  (jeg fyller inn antall frames per handling når jeg vet det)

Bygg motoren slik at den LESER denne JSON-atlasen hvis den finnes. Hvis et
verktøy gir meg et annet JSON-format enn det du forventer, skriv en liten
omformer i stedet for at jeg må endre grafikken.

## Det data-drevne kravet (kritisk)
Hver karakter skal være ren DATA i en egen fil/objekt — ikke ny kode. En
karakter defineres av: visningsnavn, sti til spritesheet, sti til atlas,
helse, og for hver handling: hvilke frames den bruker + skade (for angrep).
Målet: for å legge til en ny kollega kopierer jeg én datablokk, bytter navn,
bilde og tall — uten å skrive programkode. Lag gjerne en kort
README-seksjon som viser nøyaktig hvordan jeg legger til karakter nr. N.

## Spillmekanikk (hold det enkelt)
- To spillere på samme tastatur (lokal kamp).
  Foreslå et fornuftig tastaturoppsett og skriv det på skjermen i spillet.
- Helsebar for hver spiller øverst.
- Bevegelse: gå venstre/høyre. (Hopp er valgfritt — foreslå om det er lett å
  legge til, ellers dropp det i første versjon.)
- Angrep: ett slag, ett spark. Treff trekker fra helse etter skadeverdien i
  karakterdataene.
- Treffdeteksjon med enkle rektangulære hitbokser:
  én kroppsboks (kan bli truffet) og én angrepsboks når man slår/sparker.
  Tegn gjerne hitboksene i en "debug-modus" jeg kan skru på, så jeg skjønner
  hva som skjer.
- Runde slutter når en helsebar er tom; vis hvem som vant og en
  "spill igjen"-knapp.

## Baner / bakgrunner
Hver bane er ett statisk bakgrunnsbilde. Gjør banevalg data-drevet på samme
måte som karakterer (navn + sti til bilde), så jeg lett kan legge til flere.
Lag en enkel skjerm der jeg velger karakter for hver spiller og velger bane,
før kampen starter.

## Mappestruktur jeg ønsker
Foreslå en ryddig struktur, gjerne noe sånt som:
- en HTML-fil jeg åpner
- /js for koden
- /characters for karakter-datafilene
- /images for spritesheets og bakgrunner
- /sound (valgfritt, kan vente)
Forklar kort hva hver fil gjør.

## Rekkefølge jeg vil jobbe i
1. Du foreslår arkitektur + mappestruktur + det nøyaktige spritesheet/atlas-
   formatet du forventer. Jeg godkjenner eller justerer.
2. Vi får ÉN karakter til å stå, bevege seg og animere riktig mot et tomt
   bakgrunnsbilde.
3. Vi legger til den andre spilleren + treff + helsebarer (full kamp).
4. Vi legger til valgskjerm for karakter og bane.
5. Når alt funker, dokumenterer du "slik legger du til en ny kollega" og
   "slik legger du til en ny bane".

## Ting jeg vil at du sier ifra om
- Hvis grafikken min ikke passer formatet, si det tydelig og foreslå enten en
  omformer eller nøyaktig hva jeg må endre i eksporten.
- Hvis noe blir mye enklere ved en liten endring i hvordan jeg lager
  spritesheetene, si det FØR jeg lager resten av kollegene.
- Hold meg oppdatert på hva jeg trygt kan endre selv (tall, navn, bilder) vs.
  hva som er motorkode jeg bør la deg ta.
