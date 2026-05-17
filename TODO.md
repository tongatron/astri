# TODO — Astri

Punto della situazione e roadmap di migliorie. Priorità: **P0** = blocco/qualità di base, **P1** = alto valore utente, **P2** = nice-to-have.

---

## Stato attuale (sintesi)

- Stack solido: React 18 + Vite + TS + Zustand + Tailwind v4, `astronomy-engine` per i calcoli.
- `core/` ben isolato dalla UI (pure functions, testabili).
- **83 test** verdi su 16 file. Coverage su layer astronomico (sun, moon, events, phases, heliocentric, horizon, observing-planner), light-pollution, weather, ISS e UI smoke (App, Header, TimeControls, OnboardingModal).
- CI GitHub Actions attiva (`tsc -b`, `vitest`, `vite build`) + deploy automatico su GitHub Pages.
- Componenti grossi da spezzare: [SkySphere3D.tsx](src/components/scene3d/SkySphere3D.tsx) ~700 LoC, [ObservingDashboard.tsx](src/components/ui/ObservingDashboard.tsx) ~530, [sky-chart-draw.ts](src/core/astronomy/sky-chart-draw.ts) ~336, [SolarSystem3D.tsx](src/components/scene3d/SolarSystem3D.tsx) ~293.
- Persistenza store completa: `location`, `speed`, `view`, `hasOnboarded`, `timeMode`, `simulatedTime`, `isPlaying`, `nightRedMode`, `notifications`.

---

## Completato di recente

- [x] **Stima Bortle** dalla posizione: dataset ~85 città IT/EU, legge di Walker modificata (esponente 2.15), chip cliccabile in "Questa notte" con legenda completa 1-9, penalità nello score osservativo (attenuata per Luna/Venere/Giove). 11 test calibrati.
- [x] **Notifiche locali (PWA opt-in)**: pannello impostazioni con master toggle + 4 categorie (notti ottime, fasi lunari, eventi astronomici, ISS placeholder). Scheduler eseguito all'apertura/visibility-change con throttle per categoria, Service Worker per il rendering. Limite onesto comunicato: niente push reali a app chiusa.
- [x] **Meteo / nuvolosità** in "Questa notte": Open-Meteo integrato, penalità nello score, badge nuvolosità per ogni corpo.
- [x] **Modalità rossa notturna**: toggle nell'header con tema rosso completo per preservare visione scotopica.
- [x] **Condivisione link**: URL con location + view + tempo simulato (`buildShareUrl` in `urlState.ts`).
- [x] **Onboarding al primo avvio**: `OnboardingModal` che chiede posizione e spiega le viste, gestito da flag `hasOnboarded`.
- [x] **Error boundary** sulle viste 3D lazy (`SceneErrorBoundary`).
- [x] **CI GitHub Actions** + workflow di deploy su Pages.
- [x] **Smoke test UI**: App, Header, TimeControls, OnboardingModal.
- [x] **Catalogo Messier**: dati in `src/data/messier.ts`, toggle "Messier" nelle viste 3D.
- [x] **Anteprima social**: og:image 1200×630 + twitter:summary_large_image.
- [x] **Badge tongatron.org** nell'header (link al sito personale).
- [x] **Path alias** `@/...` in tsconfig + vite.config.
- [x] **Rimosso `Sidebar.tsx`** orfano.
- [x] **`rollup-plugin-visualizer`** disponibile per bundle analysis.

---

## P0 — Qualità / fondamenta (residui)

- [ ] **Coverage test UI estesa**: `TonightReport`, `ObservingDashboard`, `SettingsPanel`, `LocationPicker` (oggi solo smoke su App/Header).
- [ ] **Test su `observing-planner.ts`** (logica di scoring/finestre): è la parte più "di prodotto" e attualmente senza test dedicati.
- [ ] **Gestione errori geolocalizzazione**: feedback chiaro su denied/timeout/unsupported in [LocationPicker.tsx](src/components/ui/LocationPicker.tsx).
- [ ] **i18n centralizzato**: stringhe oggi sparse, convertire in modulo `messages.it.ts` (e aprire potenzialmente a `i18next`).
- [ ] **Strict TS audit**: scorrere per `any` impliciti e `as` non necessari.

## P1 — Funzionalità di valore

- [ ] **ISS / satelliti** completo: passaggi visibili stasera con orari (`satellite.js` + TLE da Celestrak). Modulo `core/satellites/iss.ts` esiste come scaffold; collegare al pannello notifiche per la categoria "Passaggi ISS".
- [ ] **Confronto magnitudini reali** sulla mappa 2D (oggi i pianeti sembrano tutti simili a colpo d'occhio).
- [ ] **Comete principali** del periodo (orbite + visibilità, fetch da JPL o catalogo statico aggiornato).
- [ ] **Filtro Messier per tipo** (nebulose, ammassi, galassie) e per visibilità dalla location nelle viste 3D/2D.
- [ ] **Push notifications reali** (a app chiusa): richiederebbe backend leggero con VAPID + subscription store. Valutare Cloudflare Workers o simile.

## P1 — UX

- [ ] **Salva location preferite** (casa, montagna, vacanza) invece di una sola.
- [ ] **Time controls da tastiera**: ←/→ step, spazio play/pause, `n` = now.
- [ ] **Mobile polish**: testare ergonomia su schermi <380px, gesture (pinch su mappa 2D per zoom).
- [ ] **Persistenza UI**: ultime selezioni pianeti nel grafico altitudine, ultimo range del pianificatore.

## P1 — Performance

- [ ] **Memoizzazione calcoli pianeti** in [ObservingDashboard.tsx](src/components/ui/ObservingDashboard.tsx): `useMemo` su chiave `(t, lat, lon)` quantizzata al minuto. Parzialmente fatto con `useQuantizedDisplayTime`, verificare se le posizioni planetarie ne beneficiano davvero.
- [ ] **Web Worker per `observing-planner`**: range 60 giorni × N pianeti può freezare il main thread.
- [ ] **GIF encoding in worker** (gif.js lo supporta) — verificare che non blocchi UI durante la generazione.
- [ ] **Bundle analysis**: usare `rollup-plugin-visualizer` (già installato) per valutare code-split di `astronomy-engine` e three.js.

## P2 — Architettura / DX

- [ ] **Estrarre `SkySphere3D.tsx`** in sotto-componenti: `Stars`, `Constellations`, `Planets`, `Grid`, `GifRecorder`.
- [ ] **Estrarre `ObservingDashboard.tsx`** in sezioni autonome già citate nel JSX.
- [ ] **`sky-chart-draw.ts`** spezzabile in moduli per layer (stelle / griglia / corpi / etichette).
- [ ] **Storybook / Ladle** per i componenti UI: facilita lo sviluppo della carta stellare senza far girare tutto.
- [ ] **Visual regression test** sulla mappa 2D (snapshot canvas → PNG hash) — la libreria di disegno è la più fragile.

## P2 — Dati / accuratezza

- [ ] **Estendere catalogo stellare** sotto mag 3.5 (oggi taglia troppo per binocolo): tetto configurabile, magari live in funzione del Bortle stimato.
- [ ] **Rifrazione atmosferica** vicino all'orizzonte (astronomy-engine la supporta — verificare uso).
- [ ] **Parallasse lunare** per location estreme (la Luna a basse altitudini cambia ~1° con la parallasse).
- [ ] **Calibrazione Bortle**: confrontare l'output del modello attuale con misure SQM reali o l'atlante Falchi e regolare esponente/soglie. Considerare diffusione anisotropica per la pianura padana.

## P2 — Infra

- [ ] **Versioning vero**: oggi `version: 0.0.0` in `package.json`, "versione" nell'header è la data dell'ultimo commit. Adottare semver o tagging.
- [ ] **Telemetria opt-in** anonima (Plausible / Umami) per capire quali viste vengono usate davvero.
- [ ] **Accessibilità**: audit con axe-core, contrasti, focus ring sui controlli temporali, ARIA su mappa canvas (descrizione testuale di "cosa si vede").
- [ ] **Preview per PR**: deploy Vercel/Netlify per ogni branch (oggi solo `main` su GitHub Pages).

---

## Suggerimenti su come procedere

1. **Prima ondata** — chiudere i residui P0: test su `observing-planner`, gestione errori in `LocationPicker`, audit `any`.
2. **Seconda ondata** — completare ISS (modulo già scaffolded, manca il fetch TLE + UI), così la categoria notifiche "Passaggi ISS" diventa funzionale.
3. **Terza ondata** — refactor mirato di `SkySphere3D` e `ObservingDashboard` *quando* tocchi quelle aree (refactor preventivo è churn). Memoizzazioni dove il profiler segnala.
4. **Quarta ondata** — espansione cataloghi (Messier per tipo, comete, stelle sotto mag 3.5).
