import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { pipeline } from "@xenova/transformers";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ---------- DB setup ----------
const db = new Database("recalliq.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    title TEXT,
    text TEXT,
    embedding TEXT,
    visited_at TEXT
  )
`);

// ---------- Auto-delete pages older than 30 days ----------
function cleanupOldPages() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffISO = cutoff.toISOString();

    const result = db.prepare(`DELETE FROM pages WHERE visited_at < ?`).run(cutoffISO);
    if (result.changes > 0) {
        console.log(`Cleaned up ${result.changes} pages older than 30 days.`);
    }
}

cleanupOldPages(); // run once on startup
setInterval(cleanupOldPages, 24 * 60 * 60 * 1000); // run every 24 hours

// ---------- Load embedding model once ----------
console.log("Loading embedding model... (first run downloads it, be patient)");
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
console.log("Model ready.");

async function embed(text) {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

function cosineSimilarity(a, b) {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot;
}

// ---------- Routes ----------

app.post("/ingest", async (req, res) => {
    try {
        const { url, title, text, visitedAt } = req.body;
        if (!text || text.length < 50) {
            return res.status(400).json({ error: "text too short, skipped" });
        }

        const vector = await embed(text);

        db.prepare(`
      INSERT INTO pages (url, title, text, embedding, visited_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(url, title, text, JSON.stringify(vector), visitedAt);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/search", async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "query required" });

        const queryVector = await embed(query);
        const rows = db.prepare(`SELECT * FROM pages`).all();

        const scored = rows.map((row) => {
            const vector = JSON.parse(row.embedding);
            const score = cosineSimilarity(queryVector, vector);
            return {
                url: row.url,
                title: row.title,
                snippet: row.text.slice(0, 150) + "...",
                visitedAt: row.visited_at,
                score
            };
        });

        scored.sort((a, b) => b.score - a.score);
        res.json({ results: scored.slice(0, 5) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`RecallIQ backend running on http://localhost:${PORT}`));