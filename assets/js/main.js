// ---------------------------------------------------------------------------
// Theme toggle (initial theme is applied inline in <head> to avoid a flash)
// ---------------------------------------------------------------------------
function initThemeToggle() {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const current = () => root.dataset.theme || (media.matches ? "dark" : "light");

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
    });
  });
}

// ---------------------------------------------------------------------------
// Menu dropdowns: close on outside click, Escape, or when another one opens
// ---------------------------------------------------------------------------
function initDropdowns() {
  const dropdowns = [...document.querySelectorAll("[data-dropdown]")];
  if (!dropdowns.length) return;
  const closeAll = (except) => dropdowns.forEach((d) => d !== except && d.removeAttribute("open"));
  dropdowns.forEach((d) => d.addEventListener("toggle", () => d.open && closeAll(d)));
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-dropdown]")) closeAll();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = dropdowns.find((d) => d.open);
    if (open) {
      open.removeAttribute("open");
      open.querySelector("summary").focus();
    }
  });
}

// ---------------------------------------------------------------------------
// Lightweight YouTube embeds: only load the iframe when the user clicks play
// ---------------------------------------------------------------------------
function initLiteYouTube() {
  document.querySelectorAll(".lite-yt").forEach((el) => {
    el.querySelector(".lite-play").addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${el.dataset.youtube}?autoplay=1&rel=0`;
      iframe.title = el.dataset.title || "YouTube video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      el.replaceChildren(iframe);
      // Pause any music that is playing.
      document.querySelectorAll("audio").forEach((a) => a.pause());
    });
  });
}

// ---------------------------------------------------------------------------
// Audio player with playlist
// ---------------------------------------------------------------------------
const formatTime = (s) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

function initPlayer(root) {
  const $ = (sel) => root.querySelector(sel);
  const audio = $("[data-audio]");
  const tracks = [...root.querySelectorAll(".track")];
  const playBtn = $("[data-play]");
  const seek = $("[data-seek]");
  const volume = $("[data-volume]");
  const currentEl = $("[data-current]");
  const durationEl = $("[data-duration]");
  const titleEl = $("[data-title]");
  const artistEl = $("[data-artist]");
  const coverEl = $("[data-cover]");
  const placeholderCover = coverEl.innerHTML;
  let index = -1;
  let seeking = false;

  const setFill = (input, ratio) => input.style.setProperty("--fill", `${(ratio * 100).toFixed(2)}%`);

  function load(i, autoplay) {
    index = (i + tracks.length) % tracks.length;
    const t = tracks[index].dataset;
    audio.src = t.src;
    titleEl.textContent = t.title;
    artistEl.textContent = t.artist;
    coverEl.innerHTML = t.cover ? `<img src="${t.cover}" alt="">` : placeholderCover;
    currentEl.textContent = "0:00";
    seek.value = 0;
    setFill(seek, 0);
    tracks.forEach((el, j) => {
      el.classList.toggle("is-current", j === index);
      if (j === index) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        artwork: t.cover ? [{ src: new URL(t.cover, location.href).href }] : [],
      });
    }
    if (autoplay) play();
  }

  function play() {
    if (index < 0) load(0, false);
    // Only one player/audio element at a time.
    document.querySelectorAll("audio").forEach((a) => a !== audio && a.pause());
    audio.play().catch(() => {});
  }

  const toggle = () => (audio.paused ? play() : audio.pause());
  const next = () => load(index + 1, true);
  const prev = () => (audio.currentTime > 3 ? (audio.currentTime = 0) : load(index - 1, true));

  playBtn.addEventListener("click", toggle);
  $("[data-next]").addEventListener("click", next);
  $("[data-prev]").addEventListener("click", prev);
  tracks.forEach((el, i) => el.addEventListener("click", () => (i === index ? toggle() : load(i, true))));

  audio.addEventListener("play", () => {
    root.classList.add("is-playing");
    playBtn.setAttribute("aria-label", "Pause");
  });
  audio.addEventListener("pause", () => {
    root.classList.remove("is-playing");
    playBtn.setAttribute("aria-label", "Play");
  });
  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
    const dur = tracks[index]?.querySelector(".track-dur");
    if (dur && !dur.textContent.trim()) dur.textContent = formatTime(audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    if (seeking || !audio.duration) return;
    const ratio = audio.currentTime / audio.duration;
    seek.value = ratio * 1000;
    setFill(seek, ratio);
    currentEl.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener("ended", () => {
    if (index < tracks.length - 1) next();
  });
  audio.addEventListener("error", () => {
    tracks[index]?.classList.add("has-error");
  });

  seek.addEventListener("input", () => {
    seeking = true;
    const ratio = seek.value / 1000;
    setFill(seek, ratio);
    currentEl.textContent = formatTime(ratio * (audio.duration || 0));
  });
  seek.addEventListener("change", () => {
    if (index < 0) load(0, false);
    if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
    seeking = false;
  });

  volume.addEventListener("input", () => {
    audio.volume = volume.value;
    audio.muted = false;
    setFill(volume, volume.value);
    root.classList.toggle("is-muted", audio.volume === 0);
  });
  $("[data-mute]").addEventListener("click", () => {
    audio.muted = !audio.muted;
    root.classList.toggle("is-muted", audio.muted);
    setFill(volume, audio.muted ? 0 : volume.value);
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", () => audio.pause());
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initDropdowns();
  initLiteYouTube();
  document.querySelectorAll("[data-player]").forEach(initPlayer);
});
