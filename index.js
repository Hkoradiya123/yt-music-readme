const fs = require("fs");
const fetch = require("node-fetch");

const USERNAME = "Hkoradiya123";
const API_KEY = process.env.LASTFM_API_KEY; // 🔐 secure

function pickTrackImage(track) {
    const images = Array.isArray(track.image) ? track.image : [];

    // Last.fm often leaves the largest slot empty, so scan for the first real URL.
    const candidates = images
        .map((entry) => entry?.["#text"] || "")
        .map((url) => url.trim())
        .filter(Boolean);

    return candidates[candidates.length - 1] ||
        "https://via.placeholder.com/150?text=No+Cover";
}

async function updateReadme() {
    try {
        const res = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json`
        );

        const data = await res.json();

        if (!data.recenttracks || !data.recenttracks.track) {
            console.log("No tracks found");
            return;
        }

        const tracks = data.recenttracks.track.slice(0, 3);

        const cards = tracks.map((t) => {
            const name = t.name || "Unknown";
            const artist = t.artist?.["#text"] || "Unknown";
            const img = pickTrackImage(t);

            const url = t.url || "#";
            const nowPlaying = t["@attr"]?.nowplaying;

            return `
<td align="center">
  <a href="${url}">
    <img src="${img}" width="120" style="border-radius:10px;" /><br/>
    <b>${name}</b><br/>
    <sub>${artist}</sub><br/>
    ${nowPlaying ? "🟢 Now Playing" : ""}
  </a>
</td>
`;
        }).join("");

        const content = `
<h3 align="center">🎧 Recently Played</h3>

<table align="center">
<tr>
${cards}
</tr>
</table>

<p align="center">🕒 Last Updated: ${new Date().toLocaleString()}</p>
`;

        // ✅ IMPORTANT: Do NOT overwrite full README
        const readme = fs.readFileSync("README.md", "utf-8");

        const newReadme = readme.replace(
            /<!-- MUSIC:START -->[\s\S]*<!-- MUSIC:END -->/,
            `<!-- MUSIC:START -->\n${content}\n<!-- MUSIC:END -->`
        );

        if (newReadme === readme) {
            throw new Error("README marker block was not replaced");
        }

        fs.writeFileSync("README.md", newReadme);

        console.log("README updated!");
    } catch (err) {
        console.error("Error:", err);
    }
}

updateReadme();
