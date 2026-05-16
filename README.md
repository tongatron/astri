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

### ✅ Tappa 0 — Bootstrap
- [x] Vite + React + TypeScript, Tailwind, ESLint, Prettier, Vitest
- [x] Dipendenze: `astronomy-engine`, `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`
- [x] Layout dark mode, header, sidebar

### ✅ Tappa 1 — Posizione e tempo
- [x] Geolocation + ricerca città (Nominatim) + localStorage
- [x] Time provider: reale, simulato, scrubbing, step
- [x] Indicatore tempo in header

### ✅ Tappa 2 — Sole e Luna
- [x] Pannelli Sole/Luna, traiettoria giornaliera, orizzonte 2D, calendario fasi
- [x] Test unitari su `sun.ts` e `moon.ts`

### ✅ Tappa 3 — Pianeti
- [x] 7 pianeti con alt/az, magnitudine, distanza, elongazione, rise/set/transit

### ✅ Tappa 4 — Sfera celeste 3D
- [x] Canvas r3f, catalogo stelle (sottoinsieme), linee costellazioni IAU
- [x] Equatore, eclittica, meridiano locale, orizzonte
- [x] Click → info panel

### ✅ Tappa 5 — Sistema solare 3D
- [x] Vista eliocentrica con orbite, time scrubbing, info pianeta

### ✅ Tappa 6 — Eventi astronomici
- [x] Pianeti (opposizioni, elongazioni), stagioni, eclissi lunari/solari, sciami meteorici
- [x] Filtro per visibilità dalla latitudine utente
- [x] Export ICS

### ✅ Catalogo Messier + Share URL
- [x] 110 oggetti Messier J2000 come layer della sfera celeste
- [x] Colore per tipo, dimensione per magnitudine, toggle e cursore mag. limite
- [x] Share URL: location + view + tempo encoded in query string, pulsante "Condividi"

---

## 🎯 Prossimi passi

Ordine consigliato di implementazione. Ogni voce è autonoma e rilasciabile.

### Tappa 7a — PWA + offline (priorità alta)
**Obiettivo**: app installabile su mobile/desktop, funziona senza rete dopo la prima visita.
- [ ] Aggiungere `vite-plugin-pwa` con strategia `injectManifest`
- [ ] Creare `public/manifest.webmanifest` (nome, icone 192/512, theme color `#020617`, display `standalone`)
- [ ] Service worker: cache di app shell + asset statici (`workbox-precaching`)
- [ ] Cache runtime per Nominatim (stale-while-revalidate, TTL 24h)
- [ ] Banner "installa app" condizionale su `beforeinstallprompt`
- [ ] Test offline manuale: chiudere la rete e ricaricare → l'app risponde

### Tappa 7b — Accessibilità (priorità alta)
**Obiettivo**: WCAG 2.1 AA, navigazione completa da tastiera.
- [ ] Audit con `axe-core` (script `npm run a11y`) integrato in CI
- [ ] ARIA labels su tutti i bottoni icon-only (Condividi, Esporta ICS, chiudi info, +/- tempo)
- [ ] Focus ring visibile (Tailwind `focus-visible:ring-2 ring-amber-300`)
- [ ] Navigazione tastiera nella scena 3D: tasti freccia per ruotare la camera, `Tab` per selezionare oggetti, `Enter` per aprire info
- [ ] Skip-link "vai al contenuto principale"
- [ ] Verifica contrasti AA su tutti i testi (specialmente `text-night-300/400` su sfondi scuri)

### Tappa 7c — Pianificatore osservativo
**Obiettivo**: rispondere a "quando e dove guardo X?" data una location.
- [ ] Nuovo file `core/astronomy/planner.ts` con `bestObservingWindow(target, observer, days)`
- [ ] Per ogni oggetto target (pianeta, Messier, evento): trova la finestra in cui l'altitudine massima è > 20° e il Sole è < -12° (crepuscolo nautico)
- [ ] Tiene conto della fase lunare (penalizza notti con Luna piena vicina al target)
- [ ] UI: nuova vista "Pianifica" con dropdown target + tabella delle 3 migliori finestre nelle prossime 4 settimane
- [ ] Bottone "aggiungi all'ICS" per finestra selezionata

### Tappa 7d — DeviceOrientation (modo "alza il telefono")
**Obiettivo**: su mobile, la sfera celeste segue l'orientamento del dispositivo.
- [ ] Hook `useDeviceOrientation()` che legge `alpha/beta/gamma` (con permission iOS 13+)
- [ ] Toggle "Modalità AR" in Sfera 3D: disabilita OrbitControls e collega yaw/pitch della camera all'orientamento
- [ ] Calibrazione iniziale (tocca per allineare nord magnetico/geografico)
- [ ] Fallback grazioso quando l'API non è disponibile

### Tappa 7e — i18n (it/en)
**Obiettivo**: tutti i testi UI traducibili, default in base al browser.
- [ ] Setup `@lingui/core` + macro o struttura più semplice basata su context
- [ ] Estrazione di tutte le stringhe in `src/i18n/{it,en}.ts`
- [ ] Toggle lingua in header
- [ ] Tradurre nomi italiani (es. costellazioni: "Orsa Maggiore" ↔ "Ursa Major")

### Tappa 8 — Catalogo deep-sky esteso
**Obiettivo**: oltre i 110 Messier, oggetti notevoli del catalogo NGC/Caldwell.
- [ ] Importare lista Caldwell (109 oggetti) in `src/data/caldwell.ts` con stesso schema di `messier.ts`
- [ ] Importare oggetti NGC notevoli (top ~200 per magnitudine apparente) da fonte CC-BY
- [ ] Filtro tipo nel pannello Layer della Sfera 3D
- [ ] Pannello "lista oggetti visibili adesso" sopra l'orizzonte ordinata per altitudine

### Tappa 9 — Lune di Giove e Saturno
**Obiettivo**: vedere Galileiane e Titano come fanno gli astrofili.
- [ ] In `core/astronomy/planets.ts` esporre `jupiterMoons(date)` con Io/Europa/Ganimede/Callisto via astronomy-engine `JupiterMoons`
- [ ] Idem per Titano (calcolo orbitale semplificato)
- [ ] Pannello pianeta esteso: mini-grafico configurazione delle lune al tempo corrente
- [ ] Nella Sfera 3D, quando Giove è selezionato, mostra le lune come piccoli punti accanto

### Tappa 10 — Comete e asteroidi notevoli
**Obiettivo**: tracciare oggetti orbitali non standard.
- [ ] Definire elementi orbitali (osculating) per Halley, Hale-Bopp, Tsuchinshan-ATLAS, Cerere, Vesta
- [ ] Propagatore kepleriano in `core/astronomy/orbit.ts`
- [ ] Layer dedicato nella Sfera 3D con magnitudine stimata

### Tappa 11 — Forecast meteo
**Obiettivo**: "stanotte il cielo sarà visibile?"
- [ ] Integrare Open-Meteo (gratuita, no API key): cloud cover, visibilità, umidità per le prossime 24h
- [ ] Componente `SkyConditions` nella dashboard con timeline grafica
- [ ] Cache 1h per location

### Tappa 12 — CI/CD e qualità
**Obiettivo**: ogni PR è testata e ha preview.
- [ ] GitHub Action: install + `npm run lint` + `npm test` + `npm run build`
- [ ] Vercel/Netlify preview automatiche per le PR
- [ ] Coverage badge in README (>80%)
- [ ] E2E con Playwright: smoke test su tre viste principali

## Decisioni aperte

- **Catalogo stellare**: Hipparcos completo (~118k stelle, ~5MB) o sottoinsieme magnitudo 6 (~5k stelle, ~200KB)? → partire dal sottoinsieme, caricare il resto on-demand
- **Coordinate equinozio**: J2000 (più semplice, errore ~minuto d'arco) o data corrente con precessione/nutazione (astronomy-engine lo fa)? → data corrente
- **Modello atmosferico**: applicare rifrazione atmosferica alle altezze (rilevante per alba/tramonto)? → sì, è già in astronomy-engine

## Riferimenti

- [astronomy-engine docs](https://github.com/cosinekitty/astronomy)
- *Astronomical Algorithms*, Jean Meeus — testo di riferimento
- [Stellarium](https://stellarium.org/) — ispirazione UX
- [In-The-Sky.org](https://in-the-sky.org/) — ispirazione contenuti
