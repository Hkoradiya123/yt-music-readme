const fs = require("fs");
const fetch = require("node-fetch");

const USERNAME = "Hkoradiya123";
const API_KEY = process.env.LASTFM_API_KEY; // 🔐 secure
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150?text=No+Cover";

function pickBestImage(source) {
    const images = Array.isArray(source?.image) ? source.image : [];

    // Last.fm often leaves the largest slot empty, so scan for the first real URL.
    const candidates = images
        .map((entry) => entry?.["#text"] || "")
        .map((url) => url.trim())
        .filter(Boolean);

    return candidates[candidates.length - 1] || "";
}

function hasRealImage(url) {
    return Boolean(url) && !url.includes("placeholder.com");
}

async function fetchJson(url) {
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Last.fm request failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

async function getProfileImage() {
    const data = await fetchJson(
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${USERNAME}&api_key=${API_KEY}&format=json`
    );

    const user = data.user;
    const image =
        pickBestImage(user) ||
        user?.image?.["#text"]?.trim() ||
        "";

    return hasRealImage(image) ? image : PLACEHOLDER_IMAGE;
}

async function getTrackImage(track) {
    const recentImage = pickBestImage(track);
    if (hasRealImage(recentImage)) {
        return recentImage;
    }

    const artist = track.artist?.["#text"] || track.artist?.name || "Unknown";
    const name = track.name || "Unknown";
    const data = await fetchJson(
        `https://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(name)}&autocorrect=1&api_key=${API_KEY}&format=json`
    );

    const info = data.track;
    const albumImage =
        pickBestImage(info?.album) ||
        pickBestImage(info) ||
        info?.album?.image?.["#text"]?.trim() ||
        "";

    return hasRealImage(albumImage) ? albumImage : PLACEHOLDER_IMAGE;
}

async function updateReadme() {
    try {
        const [profileImage, data] = await Promise.all([
            getProfileImage(),
            fetchJson(
                `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json`
            ),
        ]);

        if (!data.recenttracks || !data.recenttracks.track) {
            console.log("No tracks found");
            return;
        }

        const tracks = Array.isArray(data.recenttracks.track)
            ? data.recenttracks.track.slice(0, 3)
            : [data.recenttracks.track].filter(Boolean);

        const cards = await Promise.all(tracks.map(async (t) => {
            const name = t.name || "Unknown";
            const artist = t.artist?.["#text"] || "Unknown";
            const img = await getTrackImage(t);

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
        }));

        const content = `
<table align="center">
<tr>
<td align="center">
  <img src="${profileImage}" width="96" height="96" style="border-radius:50%;object-fit:cover;" />
</td>
<td align="left">
  <h3 align="left">🎧 Recently Played</h3>
</td>
</tr>
</table>

<table align="center">
<tr>
${cards.join("")}
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
