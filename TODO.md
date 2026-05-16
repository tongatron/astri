# TODO — Astri

Punto della situazione e roadmap di migliorie. Priorità: **P0** = blocco/qualità di base, **P1** = alto valore utente, **P2** = nice-to-have.

---

## Stato attuale (sintesi)

- Stack solido: React 18 + Vite + TS + Zustand + Tailwind v4, `astronomy-engine` per i calcoli.
- `core/` ben isolato dalla UI (pure functions, testabili).
- Test presenti solo sul layer astronomico (`sun`, `moon`, `events`, `phases`, `heliocentric`, `horizon`). UI e store senza test.
- Componenti grossi da spezzare: [SkySphere3D.tsx](src/components/scene3d/SkySphere3D.tsx) 687 LoC, [ObservingDashboard.tsx](src/components/ui/ObservingDashboard.tsx) 531, [sky-chart-draw.ts](src/core/astronomy/sky-chart-draw.ts) 336, [SolarSystem3D.tsx](src/components/scene3d/SolarSystem3D.tsx) 293.
- [Sidebar.tsx](src/components/ui/Sidebar.tsx) presente ma App non la usa (35 LoC orfane — possibile residuo dell'8dc4bf6).
- Persistenza store molto parziale (solo `location`, `speed`, `view`): tempo simulato, play/pause non sopravvivono al reload.

---

## P0 — Qualità / fondamenta

- [ ] **Rimuovere `Sidebar.tsx`** se davvero non usata (App.tsx non la importa) — dead code.
- [ ] **Coverage test UI minima**: smoke test su `App`, `ObservingDashboard`, `TonightReport` con jsdom + `@testing-library/react`. Almeno render senza crash + ipotesi base.
- [ ] **Test su `observing-planner.ts`** (logica di scoring/finestre): è la parte più "di prodotto" senza test.
- [ ] **CI GitHub Actions**: `.github/workflows/ci.yml` con `npm ci`, `tsc -b`, `eslint`, `vitest run`, `vite build`. Oggi nulla blocca un commit rotto.
- [ ] **Error boundary** intorno alle viste 3D lazy: se Three.js esplode (es. WebGL off) oggi crasha tutta l'app.
- [ ] **Gestione errori geolocalizzazione**: feedback chiaro su denied/timeout/unsupported in [LocationPicker.tsx](src/components/ui/LocationPicker.tsx).
- [ ] **i18n consistente**: il progetto è in italiano (UI, README, commit). Confermare e centralizzare le stringhe per evitare drift, o aprire all'inglese con `i18next`.

## P1 — Funzionalità di valore

- [ ] **Notifiche / promemoria** per la "notte migliore" del pianificatore (Web Push o reminder locale via `Notification` API + service worker già presente PWA).
- [ ] **Condivisione**: oltre alla GIF, link condivisibile con stato (location + data) codificato in URL → apre l'app sulla stessa vista.
- [ ] **Catalogo Deep-Sky** (Messier almeno) sulla mappa 2D e sulla sfera 3D, con filtro per tipo (nebulose, ammassi, galassie) e visibilità da location.
- [ ] **Meteo / nuvolosità** integrato in "Questa notte" (Open-Meteo è gratis e CORS-friendly): score di qualità reale, non solo astronomico.
- [ ] **Inquinamento luminoso** stimato dalla location (Bortle approssimato via API o dataset statico) → impatta la qualità osservativa mostrata.
- [ ] **ISS / satelliti** prominenti: passaggi visibili stasera con orari (libreria `satellite.js` + TLE da Celestrak).
- [ ] **Modalità "rosso notturno"** (preserva visione scotopica) — toggle nell'header che applica un filtro/tema rosso.
- [ ] **Confronto magnitudini reali** sulla mappa 2D (oggi i pianeti sembrano tutti simili a colpo d'occhio).

## P1 — UX

- [ ] **Onboarding al primo avvio**: chiedi posizione, spiega 4 viste, fast-tour. Oggi se rifiuti la geo non sai dove sei.
- [ ] **Salva location preferite** (casa, montagna, vacanza) invece di una sola.
- [ ] **Time controls da tastiera**: ←/→ step, spazio play/pause, `n` = now.
- [ ] **Mobile polish**: testare ergonomia su schermi <380px, e gesture (pinch su mappa 2D per zoom?).
- [ ] **Persistenza più ricca**: dark/light, ultima vista, ultime selezioni pianeti nel grafico altitudine.

## P1 — Performance

- [ ] **Memoizzazione calcoli**: in [ObservingDashboard.tsx](src/components/ui/ObservingDashboard.tsx) le posizioni dei pianeti sembrano ricalcolarsi a ogni tick. `useMemo` su chiave `(t, lat, lon)` quantizzata al minuto.
- [ ] **Web Worker per `observing-planner`**: range 60 giorni × N pianeti può freezare il main thread.
- [ ] **GIF encoding in worker** (gif.js lo supporta già) — verificare che non blocchi UI durante la generazione.
- [ ] **Bundle analysis**: `rollup-plugin-visualizer` e valutare code-split di `astronomy-engine` se pesa.

## P2 — Architettura / DX

- [ ] **Estrarre `SkySphere3D.tsx`** (687 LoC) in sotto-componenti: `Stars`, `Constellations`, `Planets`, `Grid`, `GifRecorder`.
- [ ] **Estrarre `ObservingDashboard.tsx`** (531 LoC) in sezioni autonome già citate nel JSX.
- [ ] **`sky-chart-draw.ts`** spezzabile in moduli per layer (stelle / griglia / corpi / etichette).
- [ ] **Path alias** (`@/core`, `@/components`) in `tsconfig` + `vite.config.ts`, oggi import relativi a profondità variabile.
- [ ] **Strict TS audit**: scorrere per `any` impliciti e `as` non necessari.
- [ ] **Storybook** (o Ladle, più leggero) per i componenti UI: facilita lo sviluppo della carta stellare senza far girare tutto.
- [ ] **Visual regression test** sulla mappa 2D (snapshot canvas → PNG hash) — la libreria di disegno è la più fragile.

## P2 — Dati / accuratezza

- [ ] **Estendere catalogo stellare** sotto mag 3.5 (oggi taglia troppo per binocolo): tetto configurabile, magari live in funzione dell'inquinamento luminoso.
- [ ] **Rifrazione atmosferica** vicino all'orizzonte (astronomy-engine la supporta — verificare uso).
- [ ] **Parallasse lunare** per location estreme (la Luna a basse altitudini cambia ~1° con la parallasse).
- [ ] **Comete principali** del periodo (TLE-like per orbite, fetch da JPL o catalogo statico aggiornato).

## P2 — Infra

- [ ] **Versioning vero**: oggi `version: 0.0.0` in `package.json`, "versione" nell'header è la data dell'ultimo commit. Adottare semver o tagging.
- [ ] **Deploy CI** (Vercel / Netlify / Pages) con preview per PR.
- [ ] **Telemetria opt-in** anonima (Plausible / Umami) per capire quali viste vengono usate davvero.
- [ ] **Accessibilità**: audit con axe-core, contrasti, focus ring sui controlli temporali, ARIA su mappa canvas (descrizione testuale di "cosa si vede").

---

## Suggerimenti su come procedere

1. **Prima ondata (1–2 sessioni)** — pulizia: rimuovi `Sidebar` se inutile, aggiungi CI, scrivi test su `observing-planner`, error boundary sulle 3D. È lavoro a basso rischio che alza subito la barra di qualità.
2. **Seconda ondata** — un feature ad alto impatto: meteo + qualità reale in "Questa notte" è probabilmente il singolo miglioramento più percepibile dall'utente. Subito dopo, notifiche PWA per la notte migliore.
3. **Terza ondata** — refactor mirato: spezza `SkySphere3D` e `ObservingDashboard` *quando* devi aggiungere una feature lì (refactor preventivo è churn). Memoizzazioni dove il profiler segnala.
4. **Quarta ondata** — espansione cataloghi (Messier, ISS, comete) — è "altro contenuto", non richiede tocchi all'architettura.

Vuoi che apra subito uno di questi (es. CI + cleanup `Sidebar` + test `observing-planner`), o preferisci discutere prima la priorità di una feature specifica?
