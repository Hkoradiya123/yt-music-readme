const fs = require("fs");
const fetch = require("node-fetch");

const USERNAME = "Hkoradiya123";
const API_KEY = "1edeb5cd45110ebb56880c005039b503"; 

async function updateReadme() {
    try {
        const res = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json`
        );

        const data = await res.json();

        if (!data.recenttracks || !data.recenttracks.track) {
            fs.writeFileSync(
                "README.md",
                `## 🎧 Recently Played\n\n⚠️ No data available`
            );
            return;
        }

        const tracks = data.recenttracks.track.slice(0, 3);

        const cards = tracks.map((t) => {
            const name = t.name || "Unknown";
            const artist = t.artist?.["#text"] || "Unknown";
            const img = t.image?.[3]?.["#text"]; // large image
            const url = t.url || "#";
            const nowPlaying = t["@attr"]?.nowplaying;

            return `
<a href="${url}" target="_blank">
  <img src="${img}" width="120" style="margin:10px;border-radius:10px;" />
</a>
<br/>
<b>${name}</b><br/>
<sub>${artist}</sub><br/>
${nowPlaying ? "🟢 Now Playing" : ""}
<br/><br/>
`;
        }).join("");

        const content = `
<h2 align="center">🎧 Recently Played (YouTube Music)</h2>

<div align="center">

${cards}

</div>

---

<p align="center">🔄 Auto-updated via Last.fm</p>
`;

        fs.writeFileSync("README.md", content);
    } catch (err) {
        fs.writeFileSync(
            "README.md",
            `## 🎧 Recently Played\n\n❌ Error loading music`
        );
    }
}

updateReadme();