/**
 * One-time helper to obtain a long-lived Google Drive refresh token for the
 * documents feature, authorising as the real Gmail account (which has storage
 * quota, unlike the service account).
 *
 * Prereqs in .env:
 *   GOOGLE_OAUTH_CLIENT_ID=...
 *   GOOGLE_OAUTH_CLIENT_SECRET=...
 *
 * Run:  node scripts/getDriveToken.js
 * Then open the printed URL, sign in as safecitiespermaculture@gmail.com, and
 * approve. The refresh token is saved back into .env automatically.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
require("dotenv").config();

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error(
        "❌ Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in backend/.env first."
    );
    process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT);
const authUrl = oauth2.generateAuthUrl({
    access_type: "offline", // request a refresh token
    prompt: "consent", // force a refresh token even on re-auth
    scope: ["https://www.googleapis.com/auth/drive.file"],
});

const server = http.createServer(async (req, res) => {
    const code = new URL(req.url, REDIRECT).searchParams.get("code");
    if (!code) {
        res.end("Waiting for Google redirect…");
        return;
    }
    try {
        const { tokens } = await oauth2.getToken(code);
        if (!tokens.refresh_token) {
            res.end(
                "No refresh token returned. Remove this app at https://myaccount.google.com/permissions and re-run."
            );
            console.error(
                "❌ No refresh_token. Revoke access at https://myaccount.google.com/permissions then re-run."
            );
            server.close();
            return process.exit(1);
        }

        const envPath = path.join(__dirname, "..", ".env");
        let env = fs.readFileSync(envPath, "utf8");
        if (/^GOOGLE_OAUTH_REFRESH_TOKEN=/m.test(env)) {
            env = env.replace(
                /^GOOGLE_OAUTH_REFRESH_TOKEN=.*$/m,
                `GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`
            );
        } else {
            env += `\nGOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        }
        fs.writeFileSync(envPath, env);

        res.end("✅ Success! Refresh token saved to .env. You can close this tab.");
        console.log("\n✅ Refresh token saved to backend/.env");
        server.close();
        process.exit(0);
    } catch (e) {
        res.end("Error: " + e.message);
        console.error("❌", e.message);
        server.close();
        process.exit(1);
    }
});

server.listen(PORT, () => {
    console.log("\n──────────────────────────────────────────────");
    console.log("1) Open this URL and sign in as safecitiespermaculture@gmail.com:\n");
    console.log(authUrl + "\n");
    console.log("2) Approve access — the token saves to .env automatically.");
    console.log("──────────────────────────────────────────────\n");
});
