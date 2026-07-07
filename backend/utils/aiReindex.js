// Fire-and-forget trigger for the AI service's corpus reindex, called after
// any Drive mutation that changes the knowledge base (upload, delete, corpus
// toggle, saved conversation). The AI service coalesces triggers server-side
// (one run at a time, extra triggers collapse into a single follow-up), so
// calling this on every mutation is safe and cheap.
//
// Needs two env vars on the backend:
//   AI_SERVICE_URL  - e.g. https://afc-estate-ai.<...>.azurecontainerapps.io
//   REINDEX_TOKEN   - same shared secret the AI service holds
// When either is missing this is a silent no-op, so local dev and any
// environment without the AI service keep working unchanged.
const triggerAiReindex = (reason) => {
    const base = (process.env.AI_SERVICE_URL || "").replace(/\/+$/, "");
    const token = process.env.REINDEX_TOKEN || "";
    if (!base || !token) return;

    // Deliberately not awaited: the user's request shouldn't wait on (or fail
    // because of) reindexing. AbortSignal covers the whole request.
    fetch(`${base}/corpus/reindex-trigger`, {
        method: "POST",
        headers: { "X-Reindex-Token": token },
        signal: AbortSignal.timeout(10000),
    })
        .then((res) => {
            if (!res.ok) {
                console.error(
                    `AI reindex trigger (${reason}) returned ${res.status}`
                );
            }
        })
        .catch((err) => {
            console.error(`AI reindex trigger (${reason}) failed:`, err.message);
        });
};

module.exports = { triggerAiReindex };
