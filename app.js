const matchesContainer = document.getElementById("matches-container");
const liveCount = document.getElementById("live-count");

const playerModal = document.getElementById("player-modal");
const videoPlayer = document.getElementById("video-player");
const playerTitle = document.getElementById("player-title");
const playerMessage = document.getElementById("player-message");

let hls = null;

// --------------------------
// LOAD LIVE MATCHES
// --------------------------

async function loadLiveMatches() {
  try {
    const response = await fetch("/.netlify/functions/live");

    if (!response.ok) {
      throw new Error("Unable to load matches");
    }

    const result = await response.json();

    const matches = extractMatches(result);

    liveCount.textContent = `${matches.length} LIVE`;

    if (!matches.length) {
      matchesContainer.innerHTML = `
        <div class="empty-state">
          <h3>No live matches currently</h3>
          <p>Check back when live sports are available.</p>
        </div>
      `;
      return;
    }

    matchesContainer.innerHTML = matches
      .map(createMatchCard)
      .join("");

  } catch (error) {
    console.error(error);

    matchesContainer.innerHTML = `
      <div class="error-state">
        <h3>Unable to load live matches</h3>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

// Flexible API response parser
function extractMatches(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data.items)) return data.items;

  if (Array.isArray(data.matches)) return data.matches;

  if (Array.isArray(data.data)) return data.data;

  if (Array.isArray(data.results)) return data.results;

  if (data.data && Array.isArray(data.data.items)) {
    return data.data.items;
  }

  if (data.data && Array.isArray(data.data.matches)) {
    return data.data.matches;
  }

  return [];
}

// --------------------------
// MATCH CARD
// --------------------------

function createMatchCard(match) {

  const id =
    match.id ??
    match.matchId ??
    match.fixtureId ??
    match.fixture?.id;

  const home =
    match.homeTeam?.name ??
    match.home?.name ??
    match.homeTeam ??
    match.home ??
    match.team1?.name ??
    match.team1 ??
    "Home Team";

  const away =
    match.awayTeam?.name ??
    match.away?.name ??
    match.awayTeam ??
    match.away ??
    match.team2?.name ??
    match.team2 ??
    "Away Team";

  const homeLogo =
    match.homeTeam?.logo ??
    match.home?.logo ??
    match.team1?.logo ??
    "";

  const awayLogo =
    match.awayTeam?.logo ??
    match.away?.logo ??
    match.team2?.logo ??
    "";

  const league =
    match.league?.name ??
    match.competition?.name ??
    match.leagueName ??
    match.competition ??
    "Live Sports";

  return `
    <div class="match-card">

      <div class="match-top">
        <span class="match-league">
          ${escapeHTML(league)}
        </span>

        <span class="live-badge">● LIVE</span>
      </div>

      <div class="match-teams">

        <div class="team">
          ${
            homeLogo
              ? `<img src="${escapeHTML(homeLogo)}" alt="">`
              : ""
          }

          <div class="team-name">
            ${escapeHTML(home)}
          </div>
        </div>

        <div class="vs">VS</div>

        <div class="team">
          ${
            awayLogo
              ? `<img src="${escapeHTML(awayLogo)}" alt="">`
              : ""
          }

          <div class="team-name">
            ${escapeHTML(away)}
          </div>
        </div>

      </div>

      <div class="match-bottom">
        <button
          class="watch-match"
          onclick="watchMatch('${escapeHTML(String(id))}', '${escapeHTML(home)} vs ${escapeHTML(away)}')"
        >
          ▶ WATCH LIVE
        </button>
      </div>

    </div>
  `;
}

// --------------------------
// WATCH MATCH
// --------------------------

async function watchMatch(id, title) {

  playerModal.classList.add("active");

  playerTitle.textContent = title;

  playerMessage.style.display = "flex";
  playerMessage.textContent = "Loading live stream...";

  stopPlayer();

  try {

    const response = await fetch(
      `/.netlify/functions/stream?id=${encodeURIComponent(id)}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Stream unavailable");
    }

    const streamURL =
      result.url ||
      result.streamUrl ||
      result.stream ||
      result.data?.url ||
      result.data?.streamUrl;

    if (!streamURL) {
      throw new Error("No stream available for this match");
    }

    playerMessage.style.display = "none";

    playStream(streamURL);

  } catch (error) {

    console.error(error);

    playerMessage.style.display = "flex";
    playerMessage.textContent =
      error.message || "Unable to play stream";

  }
}

// --------------------------
// VIDEO PLAYER
// --------------------------

function playStream(url) {

  if (url.includes(".m3u8")) {

    if (videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
      videoPlayer.src = url;
      videoPlayer.play().catch(() => {});
    }

    else if (window.Hls && Hls.isSupported()) {

      hls = new Hls();

      hls.loadSource(url);
      hls.attachMedia(videoPlayer);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoPlayer.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, function(event, data) {

        if (data.fatal) {
          playerMessage.style.display = "flex";
          playerMessage.textContent = "Stream playback error";
        }

      });

    }

    else {
      playerMessage.style.display = "flex";
      playerMessage.textContent =
        "Your browser does not support this stream.";
    }

  } else {

    videoPlayer.src = url;
    videoPlayer.play().catch(() => {});

  }

}

// --------------------------
// CLOSE PLAYER
// --------------------------

document.getElementById("close-player")
  .addEventListener("click", closePlayer);

playerModal.addEventListener("click", function(event) {
  if (event.target === playerModal) {
    closePlayer();
  }
});

function closePlayer() {

  playerModal.classList.remove("active");

  stopPlayer();

}

function stopPlayer() {

  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();

  if (hls) {
    hls.destroy();
    hls = null;
  }

}

// --------------------------
// SECURITY
// --------------------------

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

// --------------------------
// AUTO REFRESH
// --------------------------

loadLiveMatches();

// Refresh matches every 60 seconds
setInterval(loadLiveMatches, 60000);