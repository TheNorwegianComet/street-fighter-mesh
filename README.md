# Street Fighter Mesh — Mandora Edition

Et 2D fighting-spill i klassisk Street Fighter II-stil, bygget med HTML5 Canvas og vanilla JavaScript. Pictures are made with chatgpt and used as a base for creating animation (Sprite sheets).  Alle sprites er AI-generert med [AutoSprite](https://autosprite.io), stemmer med [ElevenLabs](https://elevenlabs.io).

## Spill

Åpne `index.html` via en lokal webserver, f.eks.:

```bash
npx serve
```

og gå til http://localhost:3000

## Moduser

- **1 spiller** — kjemp mot CPU-en
- **2 spillere** — lokal multiplayer på samme tastatur
- **Bonus Stage** — knus logoen før tiden går ut (à la SF2 sin bil-bane)

## Kontroller

| Handling | Spiller 1 | Spiller 2 |
|---|---|---|
| Gå | A / D | ← / → |
| Hopp | W | ↑ |
| Slag | F | N |
| Spark | G | M |
| Sittende spark | S + G | ↓ + M |
| Spesialslag | S + F | ↓ + N |
| Blokk | Hold bakover | Hold bakover |

Best av 3 runder, 99 sekunders timer, spesial-cooldown med meter. Trykk Y for å vise hitbokser (debug).

## Fighters

10 spillbare karakterer, hver med eget spesialslag, jubel-animasjon og kamprop på sitt eget språk.
