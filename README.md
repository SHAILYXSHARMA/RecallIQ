# RecallIQ 🔎

AI-powered Chrome extension that turns your browsing history into a searchable memory. Uses semantic search (embeddings) so you can find pages by *meaning*, not exact keywords — e.g. searching "the react hooks article" finds it even if the page never used those exact words.

> **Status:** MVP / personal-use project. Runs entirely locally — no external API keys, no cloud account, no cost.

## How it works

1. A Chrome extension captures the text of pages you visit in the background.
2. A local Node.js server converts that text into an embedding (a vector representing its meaning) using a free, open-source model that runs on your own machine — no OpenAI key needed.
3. When you search, your query is embedded the same way and compared against stored pages using cosine similarity. The closest matches are returned.
4. Pages older than 30 days are automatically deleted.

```
Chrome Extension  --HTTP-->  Node.js Backend  --stores-->  SQLite (recalliq.db)
  (capture + UI)              (embed + search)
```

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- Google Chrome

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/SHAILYXSHARMA/RecallIQ.git
cd recalliq_mvp
```

### 2. Start the backend

```bash
cd backend
npm install
node server.js
```

First run will download the embedding model (~90MB) — this happens once and is cached locally. You should see:

```
Loading embedding model... (first run downloads it, be patient)
Model ready.
RecallIQ backend running on http://localhost:3000
```

Leave this terminal running — the extension needs it active to capture pages and search.

### 3. Load the Chrome extension

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension` folder from this repo

The RecallIQ icon should now appear in your toolbar (pin it via the puzzle-piece icon if it's hidden).

### 4. Use it

- Browse a few real pages (articles, blog posts — anything with actual text content)
- Click the RecallIQ icon
- Type a natural language query (e.g. `"that article about react hooks"`) and press Enter

## Project structure

```
recalliq_mvp/
├── README.md
├── .gitignore
├── backend/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js          # Express server — /ingest and /search endpoints
│   └── recalliq.db        # SQLite database (auto-created on first run)
│
└── extension/
    ├── manifest.json
    ├── background.js      # captures page content on page load
    ├── popup.html         # search UI
    ├── popup.js
    └── icons/
        └── icon128.png
```

## Notes & limitations

- **Backend must be running** for capture and search to work. If it's stopped, new pages simply won't be saved (Chrome's own history is unaffected).
- **Data stays local** — everything is stored in `backend/recalliq.db` on your machine. Nothing is sent anywhere except your own local server.
- **No domain exclusion yet** — every page with enough text content gets captured, including potentially sensitive ones. Be mindful while testing.
- **History older than 30 days is auto-deleted** to keep the database small.
- **Old browsing history (from before installing the extension) is not imported** — only new page visits are captured going forward.

## Roadmap ideas

- [ ] Domain exclusion / pause capture toggle
- [ ] Import existing Chrome history on install
- [ ] Multi-user support + auth (for a hosted version)
- [ ] Deploy backend to the cloud instead of localhost

## License

MIT — do whatever you'd like with this.
