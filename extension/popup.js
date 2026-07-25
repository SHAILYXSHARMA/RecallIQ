const input = document.getElementById("query");
const resultsDiv = document.getElementById("results");
const statusDiv = document.getElementById("status");

function timeAgo(isoString) {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

function domainOf(url) {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return url;
    }
}

function renderEmpty(message) {
    resultsDiv.innerHTML = `<div class="empty-state">${message}</div>`;
}

function renderResults(results) {
    resultsDiv.innerHTML = results
        .map(
            (r) => `
      <div class="result">
        <a class="result-title" href="${r.url}" target="_blank">${r.title || domainOf(r.url)}</a>
        <div class="result-meta">${domainOf(r.url)} · ${timeAgo(r.visitedAt)}</div>
        <p class="result-snippet">${r.snippet}</p>
      </div>`
        )
        .join("");
}

input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    const query = input.value.trim();
    if (!query) return;

    statusDiv.textContent = "searching…";
    resultsDiv.innerHTML = "";

    try {
        const res = await fetch("http://localhost:3000/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await res.json();

        statusDiv.textContent = "";

        if (!data.results || data.results.length === 0) {
            renderEmpty("Nothing matched that yet. Try different words.");
            return;
        }

        renderResults(data.results);
    } catch (err) {
        statusDiv.textContent = "";
        renderEmpty("Backend not reachable. Is server.js running?");
    }
});

document.getElementById("openOptions").addEventListener("click", () => {
    chrome.runtime.openOptionsPage?.();
});