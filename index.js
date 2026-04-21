const fs = require("fs");
const fetch = require("node-fetch");

const USERNAME = "Hkoradiya123";
const API_KEY = "1edeb5cd45110ebb56880c005039b503";

async function updateReadme() {
    const res = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json`
    );

    const data = await res.json();

    const tracks = data.recenttracks.track.slice(0, 5);

    const list = tracks
        .map(
            (t) => `- ${t.name} — ${t.artist["#text"]}`
        )
        .join("\n");

    const content = `## 🎧 Recently Played (YouTube Music)

${list}
`;

    fs.writeFileSync("README.md", content);
}

updateReadme();