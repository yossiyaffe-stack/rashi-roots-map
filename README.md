# Rashi Roots Map

An interactive scholarly mapping application for exploring medieval Jewish intellectual history, focusing on scholars, their works, and textual relationships across time and geography.

**Live Demo**: [rashi-roots-map.lovable.app](https://rashi-roots-map.lovable.app)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Edge Functions](#edge-functions)
- [Deployment](#deployment)

---

## Overview

This application visualizes the network of medieval Ashkenazi Jewish scholars (primarily the Rashi school and Tosafists, ~1000-1800 CE). It maps:

- **Scholar biographies** with birth, study, exile, and death locations
- **Textual relationships** between works (commentaries, supercommentaries, translations)
- **Geographic transmission** of manuscripts and printed editions
- **Historical context** with timeline integration

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS with custom HSL design tokens |
| **State Management** | TanStack Query (server state), React Context (UI state) |
| **Routing** | React Router v6 |
| **Backend** | Lovable Cloud (Supabase) - PostgreSQL + Edge Functions |
| **Maps** | Leaflet with custom tile layers |
| **UI Components** | shadcn/ui (Radix primitives) |

---

## Database Schema

### Core Tables

```
scholars              - Medieval scholars (name, hebrew_name, birth/death years, bio, coordinates)
works                 - Texts/books (title, hebrew_title, work_type, scholar_id FK, manuscript_url)
places                - Geographic locations with multilingual names
location_names        - Multilingual place name variants (Hebrew, Yiddish, Latin, Arabic)
locations             - Scholar life events (birth, study, exile, rabbinate, death)
```

### Relationship Tables (Three-Domain Architecture)

```
biographical_relationships  - Person-to-person (family, teacher-student)
textual_relationships       - Work-to-work (commentary chains with depth_level tracking)
intellectual_relationships  - Scholarly influence and methodology
```

### Supporting Tables

```
work_locations        - Text lifecycle events (composition, first_print, manuscript_copy)
historical_events     - Timeline context events with importance levels
user_roles            - Admin/editor/user role management
```

### Key Enums

```sql
work_type: commentary | responsa | talmud_commentary | halakha | philosophy | 
           kabbalah | supercommentary | poetry | grammar | ethics | homiletics | other

location_reason: birth | study | rabbinate | exile | refuge | travel | death

relationship_certainty: certain | probable | possible | speculated
```

---

## Features

### 1. Interactive Map (`/`)
- Toggle between **Scholars** and **Works** view modes
- Color-coded journey markers: 👶 birth, 📚 study, ⚠️ exile, 🪦 death
- Animated scholar journey playback with speed controls
- Medieval kingdom boundary overlays (Holy Roman Empire, France, etc.)
- Relationship connection lines:
  - **Family**: Amber (`#f59e0b`)
  - **Teacher-Student**: Green (`#22c55e`)
  - **Textual**: Blue dashed (`#3b82f6`)

### 2. Works Network (`/works`)
- **Timeline Mode**: Vertical layout by era, columns by commentary depth
- **Radial Mode**: Concentric rings from selected center work
- Depth-based coloring:
  - Depth 0 (Violet): Original/canonical texts
  - Depth 1 (Emerald): Direct commentaries
  - Depth 2 (Pink): Supercommentaries
  - Depth 3+ (Amber): Deeper layers

### 3. Nine Textual Relationship Categories
1. **Nosei Kelim** - Texts printed together
2. **Hasagot** - Criticisms
3. **Commentary** - Primary interpretation
4. **Super-Commentary** - Meta-commentary
5. **Hiddushim** - Novellae
6. **Abridgement** - Shortened versions
7. **Translation** - Language change
8. **Reorganization** - Topical restructuring
9. **Halakhic Dependency** - Legal chains

### 4. External Integrations
- **Sefaria API**: Author works lookup
- **NLI API**: National Library of Israel manuscript searches
- **IIIF Viewer**: High-resolution manuscript browsing

---

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── works-network/         # Network visualization components
│   ├── AppLayout.tsx          # Main sidebar navigation
│   ├── LeafletMap.tsx         # Map component
│   ├── ScholarDetailPanel.tsx # Scholar info panel
│   └── TextDetailPanel.tsx    # Work info panel
├── contexts/
│   ├── MapControlsContext.tsx         # Journey/map state
│   ├── RelationshipFilterContext.tsx  # Biographical filters
│   ├── CircleFilterContext.tsx        # Intellectual circle filters
│   └── ScholarsOverlayContext.tsx     # Selection state
├── hooks/
│   ├── useScholars.ts         # Scholar data fetching
│   ├── useWorks.ts            # Works + relationships fetching
│   └── usePlaceSearch.ts      # Geographic search
├── pages/
│   ├── Index.tsx              # Main map view
│   ├── WorksNetwork.tsx       # Text network visualization
│   ├── Scholars.tsx           # Scholar list
│   └── Texts.tsx              # Works list
└── integrations/
    └── supabase/
        ├── client.ts          # Auto-generated client
        └── types.ts           # Auto-generated types

supabase/
├── config.toml                # Supabase configuration
└── functions/
    ├── sefaria-api/           # Sefaria.org proxy
    └── nli-api/               # NLI manuscript API proxy
```

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd rashi-roots-map

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

---

## Environment Variables

The following environment variables are **auto-configured** by Lovable Cloud:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

### Edge Function Secrets

These are configured in Lovable Cloud (not in `.env`):

| Secret | Description |
|--------|-------------|
| `NLI_API_KEY` | National Library of Israel API key |
| `LOVABLE_API_KEY` | Lovable AI Gateway key (auto-provisioned) |
| `SUPABASE_URL` | Available in edge functions |
| `SUPABASE_ANON_KEY` | Available in edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access for edge functions |

---

## Edge Functions

### `sefaria-api`
Proxies requests to Sefaria.org for author works lookup.

```typescript
// Usage in frontend
const response = await supabase.functions.invoke('sefaria-api', {
  body: { author: 'Rashi' }
});
```

### `nli-api`
Authenticated proxy to National Library of Israel for manuscript searches.

```typescript
// Usage in frontend
const response = await supabase.functions.invoke('nli-api', {
  body: { query: 'Rashi Torah Commentary' }
});
```

---

## Deployment

### Lovable Platform (Recommended)

1. Push changes to the connected GitHub repository
2. Lovable automatically builds and deploys
3. Access via the published URL: [rashi-roots-map.lovable.app](https://rashi-roots-map.lovable.app)

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

The `dist/` folder can be deployed to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.).

### Database Migrations

Database schema changes are managed through Lovable's migration tool. Migrations are stored in `supabase/migrations/` and applied automatically.

---

## RLS Policies

All tables use Row-Level Security with the following pattern:

- **Public read**: Anyone can SELECT
- **Admin write**: Only users with `admin` role can INSERT/UPDATE/DELETE

The `is_admin()` function checks the `user_roles` table for admin permissions.

---

## Design System

The app uses a **"Deep Indigo and Gold"** dark theme with HSL-based design tokens:

```css
/* index.css */
:root {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --primary: 263 70% 50%;
  --accent: 45 93% 47%;
  /* ... */
}
```

All colors are semantic tokens—never use raw colors in components.

---

## Data Content

- **Scholars**: ~55+ medieval Jewish scholars (Rashi school, Tosafists, Rishonim)
- **Place Names**: 55+ multilingual variants (Rabbinic Hebrew, Yiddish, Latin, Arabic)
- **Lawee Dataset**: 18 scholars with 13 commentary relationships focusing on Rashi supercommentaries
- **Timeline**: 1000-1800 CE with historical events

---

## Contributing

1. Create a feature branch
2. Make changes in Lovable or locally
3. Push to GitHub (auto-syncs with Lovable)
4. Create a pull request

---

## Acknowledgments

- Dataset includes the Lawee dataset for Rashi supercommentary scholarship
- External APIs: Sefaria.org, National Library of Israel
- Built with [Lovable](https://lovable.dev)
