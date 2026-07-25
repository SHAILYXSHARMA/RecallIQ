const API_URL = "http://localhost:3000";

function extractPageText() {
    const title = document.title || "";
    const article = document.querySelector("article");
    const root = article || document.body;
    let text = root ? root.innerText : "";
    text = text.replace(/\s+/g, " ").trim().slice(0, 5000);
    return { title, text, url: location.href };
}

async function capturePage(tabId, url) {
    if (!url || !url.startsWith("http")) return;

    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId },
            func: extractPageText
        });

        if (!result || !result.text || result.text.length < 100) return;

        await fetch(`${API_URL}/ingest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: result.url,
                title: result.title,
                text: result.text,
                visitedAt: new Date().toISOString()
            })
        });
    } catch (err) {
        console.warn("RecallIQ capture failed:", err.message);
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        capturePage(tabId, tab.url);
    }
});