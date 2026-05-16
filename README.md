# Astri

Applicazione web interattiva per esplorare il cielo notturno dal proprio balcone. Calcola in tempo reale posizioni di Sole, Luna e pianeti dalla posizione dell'utente, risponde alla domanda concreta "quando e dove guardare stasera" e genera mappe e GIF condivisibili.

## Funzionalità

### Dashboard osservativa
- **Posizioni istantanee** di Sole, Luna e 7 pianeti (altitudine, azimut, magnitudine)
- **Mappa orizzonte locale** con tutti i corpi visibili in proiezione polare
- **Grafico traiettoria** su 24 ore con toggle per ogni pianeta — linee colorate per Mercurio, Venere, Marte, Giove, Saturno, Urano, Nettuno
- **Calendario fasi lunari** del mese
- **Prossimi eventi planetari** (opposizioni, elongazioni massime) sui prossimi 12 mesi con date precise

### "Questa notte" — risposta immediata
Sezione in cima al dashboard che calcola la finestra di oscurità astronomica (sole < −12°) e mostra, per ogni corpo osservabile, la finestra oraria, la durata, il picco di altitudine e un punteggio qualità. Risponde a "cosa osservo stasera?" senza dover scorrere.

### Pianificatore osservativo
Seleziona un pianeta e un range di notti (14 / 30 / 60 giorni): tabella con ogni notte utile, orari finestra, picco, fase lunare e qualità (Ottima / Buona / Discreta). La notte migliore è evidenziata. Pulsante **"Aggiungi a calendario"** → export `.ics` con tutti gli eventi.

### Sfera celeste 3D
Vista interattiva (Three.js / React Three Fiber) con:
- Stelle dal catalogo con dimensioni proporzionali alla magnitudine
- Linee e nomi delle costellazioni
- Equatore celeste, eclittica, meridiano locale
- Sole, Luna, pianeti navigabili con click per info
- Pulsante **"GIF notte"**: genera una GIF animata della notte astronomica corrente (tramonto → alba, frame ogni 30 min) con download automatico

### Sistema solare 3D
Vista eliocentrica con Sole al centro, orbite in scala e pianeti in movimento reale. Time scrubbing per osservare i moti planetari nel tempo.

### Mappa 2D del cielo
Carta stellare classica in **proiezione azimutale equidistante** (zenith al centro, orizzonte al bordo, Est a sinistra — convenzione sky-chart) renderizzata su canvas 2D:
- Stelle con glow per le più luminose
- Linee costellazioni
- Eclittica tratteggiata
- Sole, Luna (con % illuminazione), pianeti con etichette
- Griglia altitudine / azimut, cardinali
- Pulsante **"Bussola"**: ruota la mappa in tempo reale in base alla direzione del dispositivo (`DeviceOrientationEvent`) — la direzione verso cui sei girato appare in basso, come guardare su con il telefono in mano. Su iOS richiede conferma permesso; disabilitato su desktop.
- Pulsante **"GIF notte"**: genera una GIF 640×640 della notte — completamente CPU-side, più leggibile della versione 3D

### Controllo del tempo
Modalità reale (ticking ogni secondo) o simulata con pausa, scrubbing e velocità variabile (1× → 86400×/giorno per secondo).

---

## Stack

| Area | Libreria |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| 3D | three.js + @react-three/fiber + drei |
| Calcoli astronomici | astronomy-engine (VSOP87, ELP2000) |
| Stato | Zustand con persistenza localStorage |
| Stile | Tailwind CSS v4 |
| GIF | gif.js (worker-based encoder) |
| Geolocalizzazione | Browser Geolocation API + Nominatim (OpenStreetMap) |
| PWA | vite-plugin-pwa + Workbox |
| Test | Vitest |

---

## Architettura

```
src/
├── core/
│   ├── astronomy/        # Wrapper astronomy-engine: sun, moon, planets, events,
│   │                     # observing-planner, sky-chart-draw, ics export
│   ├── coords/           # Conversioni equatoriali ↔ orizzontali ↔ cartesiane
│   ├── location/         # Geocoding via Nominatim
│   └── time/             # Formattatori
├── state/                # Store Zustand (location, timeMode, simulatedTime, view)
├── components/
│   ├── scene3d/          # SkySphere3D, SolarSystem3D, SkyChart2D
│   └── ui/               # Dashboard, TonightReport, ObservingPlanner,
│                         # AltitudeChart, MoonPhaseCalendar, UpcomingEvents,
│                         # LocationPicker, TimeControls, Header, Sidebar
└── data/                 # Catalogo stellare (mag ≲ 3.5), linee costellazioni
```

**Principio**: `core/` non importa nulla da React. Tutto pure functions, testabili in isolamento.

---

## Sviluppo

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest
npm run build     # build produzione (genera anche service worker PWA)
```

La versione nell'header mostra `V. 16 mag 2026, 19:30` — data e ora dell'ultimo commit, iniettate da Vite al build time tramite `execSync`.

---

## Riferimenti

- [astronomy-engine](https://github.com/cosinekitty/astronomy) — motore di calcolo
- *Astronomical Algorithms*, Jean Meeus
- [Stellarium](https://stellarium.org/) — ispirazione UX per la sfera 3D
- [In-The-Sky.org](https://in-the-sky.org/) — ispirazione contenuti
- [INAF – Osservatorio di Arcetri](http://www.arcetri.inaf.it) — ispirazione carta 2D
