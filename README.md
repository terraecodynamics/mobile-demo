# TerraEco Mobile Demo (Next.js)

UI-only **Next.js** replica of `project-mobile-native` (Kronis soft-UI).  
**Dummy data only** — no backend, auth, WebSocket, or AI.

## Screens

| Route | Matches mobile |
|--------|----------------|
| `/home` | Pump home — map, weather rain, dial, Manual/Auto, flow/soil |
| `/rentals` | Rentals list + add sheet |
| `/notifications` | Alert list |
| `/profile` | Profile + settings rows |
| `/farm` | Farm boundary Detect / Edit / Confirm (dummy) |

## Run

```bash
cd mobile-demo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — phone frame on desktop, full-bleed on small screens.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Lucide icons
- Kronis palette from native (`src/lib/kronis.ts`)
- Dummy data in `src/data/dummy.ts`

## Note

Designs follow the native soft-UI (neumorph chips, dial, orange brand). Interactions are local React state for demo purposes.
