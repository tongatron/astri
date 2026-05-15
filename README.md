# Astri

Applicazione web interattiva per esplorare il cielo notturno, i movimenti di Sole e Luna, i pianeti e il sistema solare in 3D — calcolati in tempo reale dalla posizione dell'utente.

## Obiettivo

Un'unica web app che risponda a domande come:
- *Dove sono Sole e Luna in questo momento dalla mia posizione?*
- *A che ora sorge la Luna stasera? In che fase è?*
- *Quali pianeti sono visibili adesso e dove guardare?*
- *Com'è fatta l'orbita di Marte rispetto alla Terra?*

Senza dipendere da servizi esterni per i calcoli: tutto offline-capable nel browser.

## Stack

| Area | Scelta | Motivo |
|---|---|---|
| Framework | **React + Vite + TypeScript** | DX rapida, build veloce, ecosistema maturo |
| 3D | **three.js + @react-three/fiber + drei** | Rendering 3D dichiarativo in React |
| 2D / grafici | **D3** (selettivamente) | Diagrammi traiettoria Sole/Luna, grafici fase |
| Calcoli astronomici | **astronomy-engine** | Posizioni precise (Sole, Luna, pianeti, eventi) — MIT, no dipendenze |
| Stato globale | **Zustand** | Posizione utente, tempo simulato, layer attivi |
| Stile | **Tailwind CSS** | UI rapida, dark mode out-of-the-box |
| Mappe / luoghi | **Browser Geolocation API** + fallback ricerca via **Nominatim** (OpenStreetMap) | Niente API key |
| Test | **Vitest** + **Playwright** | Unit + e2e |
| Deploy | **Vercel** o **Netlify** | Static hosting, zero config |

### Perché astronomy-engine

- Implementa VSOP87, ELP2000, algoritmi Meeus → precisione arcsec
- Calcola: posizioni equatoriali/orizzontali, rise/set/transit, fasi lunari, eclissi, elongazioni, stagioni
- ~100KB, nessuna dipendenza, funziona in browser e Node
- In alternativa valutata: *Stellarium Web Engine* (più completo ma WASM rigido), *NASA Horizons API* (richiede rete + rate limit)

## Architettura

```
src/
├── core/                 # Logica pura, niente React
│   ├── astronomy/        # Wrapper su astronomy-engine (Sun, Moon, Planets, Events)
│   ├── coords/           # Conversioni equatoriali ↔ orizzontali ↔ schermo
│   └── time/             # Time provider (reale, simulato, scrubbing)
├── state/                # Store Zustand (location, time, layers, selection)
├── components/
│   ├── scene3d/          # Canvas r3f, sfera celeste, sistema solare
│   ├── skymap/           # Vista 2D del cielo (stereografica)
│   ├── panels/           # Info Sole/Luna/pianeta, eventi, calendario
│   └── ui/               # Controlli tempo, location picker, layer toggle
├── data/                 # Catalogo stellare (Hipparcos sottoinsieme), costellazioni
└── pages/                # Home, viste dedicate
```

**Principio**: `core/` non importa nulla da React/three. Tutto puro e testabile. I componenti chiamano `core/` e renderizzano.

## Roadmap a tappe

Ogni tappa è una versione utilizzabile, non un work-in-progress.

### Tappa 0 — Bootstrap (1–2 giorni)
- [ ] `npm create vite@latest astri -- --template react-ts`
- [ ] Setup Tailwind, ESLint, Prettier, Vitest
- [ ] Installa `astronomy-engine`, `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`
- [ ] Layout base con dark mode, header, sidebar
- [ ] Deploy iniziale (anche solo "hello sky") su Vercel per testare CI

### Tappa 1 — Posizione e tempo (2–3 giorni)
- [ ] Geolocation con permission flow + fallback ricerca città (Nominatim)
- [ ] Persistenza località in localStorage
- [ ] Time provider: ora reale, pausa, scrubbing (slider ±1 anno), step (minuto/ora/giorno)
- [ ] Indicatore tempo + fuso orario in header

### Tappa 2 — Sole e Luna (v1 funzionale) (1 settimana)
- [ ] Pannello **Sole**: altitudine/azimut correnti, orario alba/tramonto/transito, durata giorno, declinazione
- [ ] Pannello **Luna**: altitudine/azimut, alba/tramonto, fase (% illuminata + nome + icona), distanza, librazione
- [ ] Grafico traiettoria giornaliera Sole e Luna (D3, altitudine vs ora)
- [ ] Vista 2D orizzonte: cerchio dei 360°, posizioni Sole/Luna ora
- [ ] Calendario fasi lunari del mese corrente
- [ ] Test unitari su `core/astronomy/sun.ts` e `moon.ts` con date note (es. equinozi)

### Tappa 3 — Pianeti (3–5 giorni)
- [ ] Posizioni dei 7 pianeti visibili (più Plutone opzionale)
- [ ] Quali sono sopra l'orizzonte *adesso* + altitudine/azimut
- [ ] Magnitudine apparente, distanza, costellazione di sfondo
- [ ] Eventi: massime elongazioni di Mercurio/Venere, opposizioni di Marte/Giove/Saturno

### Tappa 4 — Sfera celeste 3D (1–2 settimane)
- [ ] Canvas r3f a tutto schermo con sfera celeste navigabile
- [ ] Catalogo stellare (sottoinsieme Hipparcos, ~5000 stelle fino a mag 6)
- [ ] Linee costellazioni (IAU) con etichette
- [ ] Equatore celeste, eclittica, meridiano locale
- [ ] Sole, Luna, pianeti renderizzati con texture e dimensioni proporzionate
- [ ] Modalità "punta verso": click su un oggetto → camera si orienta
- [ ] Toggle: orizzonte locale (clipping sotto l'orizzonte) vs cielo completo

### Tappa 5 — Sistema solare 3D (1 settimana)
- [ ] Vista "out of body": Sole al centro, orbite dei pianeti in scala (con switch scala realistica/scala visibile)
- [ ] Time scrubbing → pianeti si muovono lungo le orbite
- [ ] Lune principali di Giove/Saturno
- [ ] Click pianeta → camera segue, pannello info dedicato

### Tappa 6 — Eventi e notifiche (3–5 giorni)
- [ ] Calendario eventi prossimi 12 mesi: eclissi, congiunzioni strette, sciami meteorici (date fisse), solstizi/equinozi
- [ ] Filtro per visibilità dalla località utente
- [ ] Export ICS per calendario

### Tappa 7 — Rifiniture (in corso)
- [ ] PWA + offline: app installabile, dati catalogo cached
- [ ] i18n (it/en)
- [ ] Bussola/giroscopio su mobile (DeviceOrientation API) per modo "alza il telefono"
- [ ] Accessibilità: contrasti, navigazione tastiera, ARIA labels
- [ ] Condivisione: link con location+tempo encoded in URL

## Decisioni aperte

- **Catalogo stellare**: Hipparcos completo (~118k stelle, ~5MB) o sottoinsieme magnitudo 6 (~5k stelle, ~200KB)? → partire dal sottoinsieme, caricare il resto on-demand
- **Coordinate equinozio**: J2000 (più semplice, errore ~minuto d'arco) o data corrente con precessione/nutazione (astronomy-engine lo fa)? → data corrente
- **Modello atmosferico**: applicare rifrazione atmosferica alle altezze (rilevante per alba/tramonto)? → sì, è già in astronomy-engine

## Riferimenti

- [astronomy-engine docs](https://github.com/cosinekitty/astronomy)
- *Astronomical Algorithms*, Jean Meeus — testo di riferimento
- [Stellarium](https://stellarium.org/) — ispirazione UX
- [In-The-Sky.org](https://in-the-sky.org/) — ispirazione contenuti
