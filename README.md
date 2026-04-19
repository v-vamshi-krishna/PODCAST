# PodcastHub

A full podcast website built with Claude AI as a KT project.

## Project Structure

```
podcasthub/
├── index.html          ← Main app (all pages in one SPA)
├── css/
│   └── styles.css      ← Dark editorial design system
├── js/
│   └── app.js          ← All app logic, routing, player, search
├── data/
│   └── episodes.json   ← Episode data (6 sample episodes)
└── README.md
```

## Pages

- **Home** — Hero section + featured episode + latest episodes grid
- **Episodes** — Full listing with category filter pills
- **Episode Detail** — Audio player + show notes + chapters + AI notes
- **Search** — RAG-style keyword search across all episodes
- **About** — Team, values, mission

## Features

- Multi-page SPA with client-side routing
- Functional audio player (play/pause, progress bar, speed, volume, skip)
- Episode tabs: Show Notes, Chapters, Transcript, AI Notes
- AI Show Notes generator (simulated Claude API call)
- Category filter on episodes page
- Keyword search with highlighted results + AI answer panel
- Dark editorial aesthetic (Playfair Display + DM Sans)
- Fully responsive

## How to Run Locally

```bash
# Option 1: Python (simplest)
cd podcasthub
python3 -m http.server 8080
# Open http://localhost:8080

# Option 2: Node.js
npx serve .

# Option 3: VS Code Live Server
# Right-click index.html → Open with Live Server
```

## AI Integration Points (Future)

- `js/app.js` → `generateAINotes()` — replace simulation with real Claude API call
- `js/app.js` → `performSearch()` — replace with real vector embedding + RAG
- Add backend: FastAPI + PostgreSQL + Pinecone for production

## Tech Stack

- HTML5 / CSS3 / Vanilla JS
- Google Fonts (Playfair Display + DM Sans)
- No frameworks, no build step
- Data: local JSON file

Built as a KT demo for learning Claude, agents, MCP, and RAG.
