const fs = require("fs");
const fetch = require("node-fetch");

const USERNAME = "Hkoradiya123";
const API_KEY = "YOUR_NEW_API_KEY";

async function updateReadme() {
    const res = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json`
    );

    const data = await res.json();
    const tracks = data.recenttracks.track.slice(0, 5);

    const cards = tracks.map((t) => {
        const name = t.name;
        const artist = t.artist["#text"];
        const img = t.image[2]["#text"]; // medium image
        const nowPlaying = t["@attr"]?.nowplaying ? "🟢" : "";

        return `
<tr>
  <td><img src="${img}" width="60"/></td>
  <td>
    <b>${name}</b><br/>
    <sub>${artist}</sub><br/>
    ${nowPlaying}
  </td>
</tr>
`;
    }).join("");

    const content = `
## 🎧 Recently Played (YouTube Music)

<table>
${cards}
</table>

---
🔄 Auto-updated via Last.fm
`;

    fs.writeFileSync("README.md", content);
}

updateReadme();