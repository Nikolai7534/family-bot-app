(function () {
  const SETTINGS_TITLE = "[UI_SETTINGS]";
  const STORAGE_PREFIX = "hh_ui_settings_v1_";
  const WEATHER_CACHE_PREFIX = "hh_weather_cache_v2_";
  const WEATHER_TTL_MS = 15 * 60 * 1000;

  const UI_COLORS = [
    { id: "blue",    bg: "linear-gradient(135deg, #2563EB, #60A5FA)", accent: "#60A5FA", soft: "rgba(59, 130, 246, 0.18)" },
    { id: "emerald", bg: "linear-gradient(135deg, #059669, #34D399)", accent: "#34D399", soft: "rgba(16, 185, 129, 0.18)" },
    { id: "amber",   bg: "linear-gradient(135deg, #D97706, #FBBF24)", accent: "#FBBF24", soft: "rgba(245, 158, 11, 0.18)" },
    { id: "crimson", bg: "linear-gradient(135deg, #DC2626, #F87171)", accent: "#F87171", soft: "rgba(239, 68, 68, 0.18)" },
    { id: "pink",    bg: "linear-gradient(135deg, #DB2777, #F472B6)", accent: "#F472B6", soft: "rgba(236, 72, 153, 0.18)" },
    { id: "purple",  bg: "linear-gradient(135deg, #7C3AED, #A78BFA)", accent: "#A78BFA", soft: "rgba(139, 92, 246, 0.18)" },
    { id: "cyan",    bg: "linear-gradient(135deg, #0284C7, #38BDF8)", accent: "#38BDF8", soft: "rgba(14, 165, 233, 0.18)" },
    { id: "teal",    bg: "linear-gradient(135deg, #0D9488, #2DD4BF)", accent: "#2DD4BF", soft: "rgba(20, 184, 166, 0.18)" },
    { id: "orange",  bg: "linear-gradient(135deg, #EA580C, #FB923C)", accent: "#FB923C", soft: "rgba(249, 115, 22, 0.18)" },
    { id: "indigo",  bg: "linear-gradient(135deg, #4338CA, #818CF8)", accent: "#818CF8", soft: "rgba(99, 102, 241, 0.18)" },
    { id: "lime",    bg: "linear-gradient(135deg, #65A30D, #A3E635)", accent: "#A3E635", soft: "rgba(132, 204, 22, 0.18)" },
    { id: "rose",    bg: "linear-gradient(135deg, #E11D48, #FB7185)", accent: "#FB7185", soft: "rgba(244, 63, 94, 0.18)" },
    { id: "fuchsia", bg: "linear-gradient(135deg, #C026D3, #E879F9)", accent: "#E879F9", soft: "rgba(217, 70, 239, 0.18)" },
    { id: "slate",   bg: "linear-gradient(135deg, #475569, #94A3B8)", accent: "#94A3B8", soft: "rgba(148, 163, 184, 0.18)" },
    { id: "bronze",  bg: "linear-gradient(135deg, #92400E, #D97706)", accent: "#F59E0B", soft: "rgba(217, 119, 6, 0.18)" },
    { id: "mint",    bg: "linear-gradient(135deg, #0F766E, #5EEAD4)", accent: "#5EEAD4", soft: "rgba(45, 212, 191, 0.18)" }
  ];

  const DEFAULT_MODULES = [
    { id: "tasks",    label: "Tasks",    icon: "✅", screen: "screen-tasks",    color: "purple",  size: "1x1", visible: true },
    { id: "calendar", label: "Calendar", icon: "📅", screen: "screen-calendar", color: "teal",    size: "1x1", visible: true },
    { id: "shopping", label: "Shopping", icon: "🛒", screen: "screen-shopping", color: "amber",   size: "2x1", visible: true },
    { id: "order",    label: "To Order", icon: "📦", screen: "screen-order",    color: "emerald", size: "1x1", visible: true },
    { id: "wishlist", label: "Wishlist", icon: "🎁", screen: "screen-wishlist", color: "pink",    size: "1x1", visible: true },
    { id: "finance",  label: "Finance",  icon: "💰", screen: "screen-finance",  color: "cyan",    size: "1x1", visible: true },
    { id: "notes",    label: "Notes",    icon: "📝", screen: "screen-notes",    color: "blue",    size: "1x1", visible: true },
    { id: "places",   label: "Places",   icon: "📍", screen: "screen-places",   color: "indigo",  size: "1x1", visible: true },
    { id: "tastings", label: "Tastings", icon: "🥃", screen: "screen-tastings", color: "bronze",  size: "1x1", visible: true },
    { id: "media",    label: "Watchlist", icon: "🎬", screen: "screen-media",   color: "rose",    size: "1x1", visible: true }
  ];

  const START_SCREENS = [
    { id: "screen-dashboard", label: "🏠 Dashboard" },
    { id: "screen-shopping",  label: "🛒 Shopping" },
    { id: "screen-calendar",  label: "📅 Calendar" },
    { id: "screen-tasks",     label: "✅ Tasks" },
    { id: "screen-notes",     label: "📝 Notes" },
    { id: "screen-media",     label: "🎬 Watchlist" }
  ];

  const WEATHER_CITIES = [
    { id: "karmiel",   name: "Karmiel",    lat: 32.9199, lon: 35.2901 },
    { id: "haifa",     name: "Haifa",      lat: 32.7940, lon: 34.9896 },
    { id: "tel_aviv",  name: "Tel Aviv",   lat: 32.0853, lon: 34.7818 },
    { id: "jerusalem", name: "Jerusalem",  lat: 31.7683, lon: 35.2137 },
    { id: "nahariya",  name: "Nahariya",   lat: 33.0059, lon: 35.0941 },
    { id: "tiberias",  name: "Tiberias",   lat: 32.7922, lon: 35.5312 },
    { id: "netanya",   name: "Netanya",    lat: 32.3215, lon: 34.8532 },
    { id: "ashdod",    name: "Ashdod",     lat: 31.8044, lon: 34.6553 },
    { id: "beer_sheva",name: "Be'er Sheva",lat: 31.2530, lon: 34.7915 },
    { id: "eilat",     name: "Eilat",      lat: 29.5577, lon: 34.9519 }
  ];

  let uiSettings = null;
  let settingsNoteId = null;
  let openColorPickerId = null;
  let liveCache = { notes: [], shopping: [], calendar: [] };
  let weatherData = {};
  let quickModalType = null;
  let quickTaskOwner = "Nikolai";
  let quickNoteShared = true;
  let searchQuery = "";
  let searchResultsCache = [];
  let startScreenApplied = false;

  function esc(str) {
    const d = document.createElement("div");
    d.innerText = str == null ? "" : String(str);
    return d.innerHTML;
  }

  function getUid() {
    return typeof currentUserId !== "undefined" ? currentUserId : (Number(localStorage.getItem("hh_uid")) || 547418372);
  }

  function getUname() {
    return typeof userName !== "undefined" ? userName : (localStorage.getItem("hh_uname") || "User");
  }

  function getTimeGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 18) return "Good afternoon";
    if (h >= 18 && h < 23) return "Good evening";
    return "Good night";
  }

  function getColorObj(id) {
    return UI_COLORS.find(c => c.id === id) || UI_COLORS[0];
  }

  function getCityObj(id) {
    return WEATHER_CITIES.find(c => c.id === id) || null;
  }

  function weatherCodeInfo(code) {
    if (code === 0) return { icon: "☀️", desc: "Clear" };
    if (code <= 2) return { icon: "⛅", desc: "Partly cloudy" };
    if (code === 3) return { icon: "☁️", desc: "Cloudy" };
    if (code <= 48) return { icon: "🌫️", desc: "Fog" };
    if (code <= 57) return { icon: "🌦️", desc: "Drizzle" };
    if (code <= 67) return { icon: "🌧️", desc: "Rain" };
    if (code <= 77) return { icon: "❄️", desc: "Snow" };
    if (code <= 82) return { icon: "🌧️", desc: "Showers" };
    if (code >= 95) return { icon: "⛈️", desc: "Storm" };
    return { icon: "🌤️", desc: "Fair" };
  }

  function getDefaultSettings() {
    return {
      version: 1,
      mode: "classic",
      hideFinance: false,
      startScreen: "screen-dashboard",
      showSmartBar: true,
      weatherCity1: "karmiel",
      weatherCity2: "none",
      modules: DEFAULT_MODULES.map(m => ({ ...m }))
    };
  }

  function normalizeSettings(raw) {
    const base = getDefaultSettings();
    if (!raw || typeof raw !== "object") return base;
    const mode = raw.mode === "bento" ? "bento" : "classic";
    const hideFinance = !!raw.hideFinance;
    const startScreen = START_SCREENS.some(s => s.id === raw.startScreen) ? raw.startScreen : "screen-dashboard";
    const showSmartBar = raw.showSmartBar !== false;
    const weatherCity1 = (raw.weatherCity1 === "none" || getCityObj(raw.weatherCity1)) ? raw.weatherCity1 : "karmiel";
    const weatherCity2 = (raw.weatherCity2 === "none" || getCityObj(raw.weatherCity2)) ? raw.weatherCity2 : "none";

    const incoming = Array.isArray(raw.modules) ? raw.modules : [];
    const byId = new Map(DEFAULT_MODULES.map(m => [m.id, m]));
    const merged = [];
    const seen = new Set();

    incoming.forEach(item => {
      const def = byId.get(item.id);
      if (def && !seen.has(item.id)) {
        seen.add(item.id);
        merged.push({
          ...def,
          color: UI_COLORS.some(c => c.id === item.color) ? item.color : def.color,
          size: item.size === "2x1" ? "2x1" : "1x1",
          visible: item.visible !== false
        });
      }
    });

    DEFAULT_MODULES.forEach(def => {
      if (!seen.has(def.id)) merged.push({ ...def });
    });

    return { version: 1, mode, hideFinance, startScreen, showSmartBar, weatherCity1, weatherCity2, modules: merged };
  }

  function loadLocalSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + getUid());
      if (raw) return normalizeSettings(JSON.parse(raw));
    } catch (e) {}
    return getDefaultSettings();
  }

  function saveLocalSettings() {
    try {
      localStorage.setItem(STORAGE_PREFIX + getUid(), JSON.stringify(uiSettings));
    } catch (e) {}
  }

  async function saveDbSettings() {
    saveLocalSettings();
    if (typeof currentAuthKey === "undefined" || !currentAuthKey) return;
    const payload = JSON.stringify(uiSettings);
    try {
      if (settingsNoteId) {
        await fetch(`${API_BASE}/api/notes/${settingsNoteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: payload })
        });
      } else {
        const res = await fetch(`${API_BASE}/api/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: SETTINGS_TITLE, is_shared: false, content: payload })
        });
        if (res.ok) {
          const notesRes = await fetch(`${API_BASE}/api/notes`);
          if (notesRes.ok) {
            const notes = await notesRes.json();
            const found = notes.find(n => n.title === SETTINGS_TITLE && !n.is_shared);
            if (found) settingsNoteId = found.id;
          }
        }
      }
    } catch (e) {}
  }

 async function fetchCityWeather(cityId) {
    const city = getCityObj(cityId);
    if (!city) return null;

    const now = Date.now();
    if (weatherData[cityId] && typeof weatherData[cityId].temp === "number" && (now - weatherData[cityId].ts) < WEATHER_TTL_MS) {
      return weatherData[cityId];
    }

    try {
      const cached = localStorage.getItem(WEATHER_CACHE_PREFIX + cityId);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.temp === "number" && (now - parsed.ts) < WEATHER_TTL_MS) {
          weatherData[cityId] = parsed;
          return parsed;
        }
      }
    } catch (e) {}

    function xhrJson(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.timeout = 10000;
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(new Error("JSON")); }
          } else reject(new Error("HTTP " + xhr.status));
        };
        xhr.onerror = () => reject(new Error("Net"));
        xhr.ontimeout = () => reject(new Error("Timeout"));
        xhr.send();
      });
    }

    function codeInfo(code) {
      const c = Number(code);
      if (c === 0) return { icon: "☀️", desc: "Clear" };
      if (c <= 2) return { icon: "⛅", desc: "Partly cloudy" };
      if (c === 3) return { icon: "☁️", desc: "Cloudy" };
      if (c <= 48) return { icon: "🌫️", desc: "Fog" };
      if (c <= 57) return { icon: "🌦️", desc: "Drizzle" };
      if (c <= 67) return { icon: "🌧️", desc: "Rain" };
      if (c <= 77) return { icon: "❄️", desc: "Snow" };
      if (c <= 82) return { icon: "🌧️", desc: "Showers" };
      if (c >= 95) return { icon: "⛈️", desc: "Storm" };
      return { icon: "🌤️", desc: "Fair" };
    }

    let lastErr = "Err";
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}¤t_weather=true`;
      const data = await xhrJson(url);
      if (data && data.current_weather) {
        const info = codeInfo(data.current_weather.weathercode);
        const entry = {
          temp: Math.round(data.current_weather.temperature),
          icon: info.icon,
          desc: info.desc,
          name: city.name,
          ts: now
        };
        weatherData[cityId] = entry;
        try { localStorage.setItem(WEATHER_CACHE_PREFIX + cityId, JSON.stringify(entry)); } catch (e) {}
        return entry;
      }
    } catch (e) {
      lastErr = e.message || "OM err";
    }

    try {
      const data = await xhrJson(`https://wttr.in/${encodeURIComponent(city.name)}?format=j1`);
      const cur = data && data.current_condition && data.current_condition[0];
      if (cur) {
        const desc = (cur.weatherDesc && cur.weatherDesc[0] && cur.weatherDesc[0].value) || "Fair";
        const low = desc.toLowerCase();
        const icon = low.includes("rain") || low.includes("shower") ? "🌧️" :
                     low.includes("storm") || low.includes("thunder") ? "⛈️" :
                     low.includes("cloud") || low.includes("overcast") ? "☁️" :
                     low.includes("fog") || low.includes("mist") ? "🌫️" : "☀️";
        const entry = {
          temp: Math.round(Number(cur.temp_C)),
          icon,
          desc,
          name: city.name,
          ts: now
        };
        weatherData[cityId] = entry;
        try { localStorage.setItem(WEATHER_CACHE_PREFIX + cityId, JSON.stringify(entry)); } catch (e) {}
        return entry;
      }
    } catch (e) {
      lastErr = e.message || lastErr;
    }

    weatherData[cityId] = { temp: "?", icon: "⚠️", desc: lastErr, name: city.name, ts: 0 };
    return null;
  }

  async function refreshWeatherForSettings() {
    if (!uiSettings || !uiSettings.showSmartBar) return;
    const ids = [];
    if (uiSettings.weatherCity1 && uiSettings.weatherCity1 !== "none") ids.push(uiSettings.weatherCity1);
    if (uiSettings.weatherCity2 && uiSettings.weatherCity2 !== "none" && uiSettings.weatherCity2 !== uiSettings.weatherCity1) {
      ids.push(uiSettings.weatherCity2);
    }
    if (ids.length === 0) return;

    await Promise.all(ids.map(fetchCityWeather));
    const searchEl = document.getElementById("hh-bento-search");
    if (!searchEl || document.activeElement !== searchEl) {
      renderDashboard();
    }
  }

  function injectStyles() {
    if (document.getElementById("hh-dash-styles")) return;
    const style = document.createElement("style");
    style.id = "hh-dash-styles";
    style.textContent = `
      /* SMOOTH SCREEN TRANSITIONS */
      @keyframes hhScreenIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .screen.active { animation: hhScreenIn 0.22s cubic-bezier(0.22, 1, 0.36, 1); }

      .hh-top-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 5; }
      .hh-icon-pill { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: rgba(11, 17, 32, 0.42); color: #fff; font-size: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(6px); transition: 0.15s; }
      .hh-icon-pill:active { transform: scale(0.92); }
      .welcome-card .logout-pill { display: none !important; }

      /* BENTO HEADER, SMART DAY BAR, SEARCH & GRID */
      .bento-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 2px 10px 2px; }
      .bento-date { font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: capitalize; margin-bottom: 2px; }
      .bento-greet { font-size: 22px; font-weight: 800; color: #F8FAFC; margin: 0; letter-spacing: -0.3px; }
      .bento-hdr-btns { display: flex; gap: 8px; }
      .bento-hdr-btn { width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #E2E8F0; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.15s; }
      .bento-hdr-btn:active { transform: scale(0.92); }

      .bento-smart-bar { background: linear-gradient(135deg, rgba(30, 58, 138, 0.36), rgba(19, 28, 49, 0.92)); border: 1px solid rgba(96, 165, 250, 0.22); border-radius: 15px; padding: 10px 12px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 7px; }
      .bento-weather-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
      .bento-weather-chip { display: inline-flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 4px 9px; font-size: 12px; font-weight: 700; color: #F1F5F9; }
      .bento-weather-temp { color: #7DD3FC; font-weight: 800; }
      @keyframes hhTicker {
        0%, 12% { transform: translateX(0); }
        100%    { transform: translateX(-50%); }
      }
      .bento-focus-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; color: #CBD5E1; cursor: pointer; }
      .bento-focus-viewport { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; mask-image: linear-gradient(90deg, transparent, #000 4%, #000 94%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 4%, #000 94%, transparent); }
      .bento-focus-track { display: inline-block; font-weight: 600; }
      .bento-focus-track.scrolling { animation: hhTicker 12s linear infinite; }
      .bento-focus-meta { font-size: 11px; color: #94A3B8; white-space: nowrap; flex-shrink: 0; }
      
      .bento-search-wrap { position: relative; margin-bottom: 14px; }
      .bento-search-ico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.65; pointer-events: none; }
      .bento-search-input { width: 100%; box-sizing: border-box; background: rgba(19, 28, 49, 0.92); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 11px 36px 11px 36px; color: #F8FAFC; font-size: 14px; outline: none; transition: 0.15s; }
      .bento-search-input:focus { border-color: rgba(96, 165, 250, 0.55); background: rgba(24, 36, 62, 0.98); }
      .bento-search-input::placeholder { color: #64748B; }
      .bento-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; border: none; background: rgba(255,255,255,0.12); color: #CBD5E1; font-size: 11px; font-weight: 800; cursor: pointer; display: none; align-items: center; justify-content: center; }

      .bento-search-results { display: none; flex-direction: column; gap: 8px; margin-bottom: 16px; }
      .bento-search-results.open { display: flex; }
      .bento-sr-item { background: rgba(19, 28, 49, 0.95); border: 1px solid rgba(255,255,255,0.09); border-radius: 13px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.12s; }
      .bento-sr-item:active { transform: scale(0.98); }
      .bento-sr-ico { width: 32px; height: 32px; border-radius: 10px; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
      .bento-sr-body { flex: 1; min-width: 0; }
      .bento-sr-title { font-size: 14px; font-weight: 700; color: #F8FAFC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bento-sr-sub { font-size: 11px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
      .bento-sr-tag { font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 7px; background: rgba(59, 130, 246, 0.16); color: #93C5FD; flex-shrink: 0; }

      .bento-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-flow: dense; gap: 11px; padding-bottom: 18px; }
      .bento-card { background: rgba(19, 28, 49, 0.92); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 14px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 116px; transition: transform 0.15s ease, border-color 0.2s ease; position: relative; overflow: hidden; }
      .bento-card:active { transform: scale(0.97); }
      .bento-card.wide { grid-column: span 2; min-height: 102px; }
      .bento-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .bento-icon-box { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
      .bento-act-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.07); color: #E2E8F0; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; line-height: 1; }
      .bento-act-btn:active { transform: scale(0.9); }
      .bento-mid { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 5px; }
      .bento-title { font-size: 16px; font-weight: 800; color: #F8FAFC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bento-badge { font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 8px; white-space: nowrap; flex-shrink: 0; }
      .bento-preview { font-size: 12px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 16px; }

      /* SETTINGS SCREEN */
      .set-mode-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
      .set-mode-card { background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 10px; text-align: center; cursor: pointer; transition: 0.15s; }
      .set-mode-card.active { background: rgba(37, 99, 235, 0.22); border-color: #60A5FA; }
      .set-mode-ico { font-size: 26px; margin-bottom: 6px; }
      .set-mode-name { font-size: 14px; font-weight: 800; color: #F8FAFC; }
      .set-mode-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; }

      .set-start-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
      .set-start-chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #CBD5E1; border-radius: 10px; padding: 7px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
      .set-start-chip.active { background: rgba(37, 99, 235, 0.28); border-color: #60A5FA; color: #fff; }

      .set-weather-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px; margin-bottom: 14px; }
      .set-weather-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .set-weather-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); }
      .set-select-lbl { font-size: 11px; color: #94A3B8; font-weight: 700; margin-bottom: 4px; display: block; }
      .set-select { width: 100%; background: #0B1120; border: 1px solid rgba(255,255,255,0.14); color: #F8FAFC; border-radius: 10px; padding: 8px 10px; font-size: 13px; font-weight: 600; outline: none; }

      .set-sec-lbl { font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.6px; margin: 14px 0 8px 2px; }
      .set-mod-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 10px 12px; margin-bottom: 8px; }
      .set-mod-card.hidden-mod { opacity: 0.48; }
      .set-mod-row { display: flex; align-items: center; gap: 8px; }
      .set-swatch { width: 28px; height: 28px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.28); cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
      .set-mod-name { flex: 1; font-size: 14px; font-weight: 700; color: #F8FAFC; }
      .set-ctrl-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: #E2E8F0; border-radius: 8px; padding: 5px 8px; font-size: 11px; font-weight: 800; cursor: pointer; }
      .set-ctrl-btn.active { background: rgba(59, 130, 246, 0.28); border-color: #60A5FA; color: #BAE6FD; }
      .set-palette { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); }
      .set-color-dot { height: 28px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; }
      .set-color-dot.active { border-color: #fff; transform: scale(1.08); box-shadow: 0 0 0 2px rgba(255,255,255,0.25); }
      .set-reset-btn { width: 100%; margin-top: 14px; padding: 12px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.14); color: #FCA5A5; font-size: 13px; font-weight: 800; cursor: pointer; }

      /* QUICK ADD MODAL */
      .hh-qmodal-bg { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.72); z-index: 1000; align-items: center; justify-content: center; padding: 16px; }
      .hh-qmodal-bg.open { display: flex; animation: hhScreenIn 0.18s ease; }
      .hh-qmodal-card { width: 100%; max-width: 360px; background: #131C31; border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 18px; }
      .hh-qtoggle-row { display: flex; gap: 8px; margin-bottom: 12px; }
      .hh-qtoggle-btn { flex: 1; padding: 9px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color: #94A3B8; font-size: 13px; font-weight: 700; cursor: pointer; }
      .hh-qtoggle-btn.active { background: #2563EB; border-color: #60A5FA; color: #fff; }
    `;
    document.head.appendChild(style);
  }

  function injectDom() {
    const dash = document.getElementById("screen-dashboard");
    if (dash) {
      const welcome = dash.querySelector(".welcome-card");
      if (welcome && !welcome.querySelector(".hh-top-actions")) {
        welcome.style.position = "relative";
        const bar = document.createElement("div");
        bar.className = "hh-top-actions";
        bar.innerHTML = `
          <button type="button" class="hh-icon-pill" title="Settings" onclick="window.hhDash.openSettings()">⚙️</button>
          <button type="button" class="hh-icon-pill" title="Switch / Lock" onclick="openAuthLock()">🔒</button>
        `;
        welcome.appendChild(bar);
      }
      if (!document.getElementById("hh-bento-root")) {
        const bento = document.createElement("div");
        bento.id = "hh-bento-root";
        bento.style.display = "none";
        dash.appendChild(bento);
      }
    }

    if (!document.getElementById("screen-settings")) {
      const setScreen = document.createElement("div");
      setScreen.id = "screen-settings";
      setScreen.className = "screen";
      setScreen.innerHTML = `
        <div class="nav-header">
          <button class="back-btn" onclick="openScreen('screen-dashboard')">←</button>
          <h2>Interface Settings</h2>
        </div>
        <div class="set-sec-lbl">Dashboard Layout</div>
        <div class="set-mode-row" id="set-mode-row"></div>
        <div class="set-sec-lbl">Smart Day Bar & Weather (Bento)</div>
        <div id="set-weather-box"></div>
        <div class="set-sec-lbl">Start Screen on Launch</div>
        <div class="set-start-row" id="set-start-row"></div>
        <div class="set-sec-lbl">Modules (Color • Order • Bento Size • Show)</div>
        <div id="set-modules-list"></div>
        <button type="button" class="set-reset-btn" onclick="window.hhDash.resetSettings()">↺ Reset to Default</button>
      `;
      document.body.appendChild(setScreen);
    }

    if (!document.getElementById("hh-quick-modal")) {
      const qm = document.createElement("div");
      qm.id = "hh-quick-modal";
      qm.className = "hh-qmodal-bg";
      qm.onclick = function (e) { if (e.target === qm) window.hhDash.closeQuickModal(); };
      qm.innerHTML = `
        <div class="hh-qmodal-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div id="hh-qmodal-title" style="font-size:16px; font-weight:800; color:#fff;">Quick Add</div>
            <button class="del-btn" onclick="window.hhDash.closeQuickModal()">✕</button>
          </div>
          <div id="hh-qmodal-toggle" class="hh-qtoggle-row" style="display:none;"></div>
          <input type="text" id="hh-qmodal-input" class="wish-input" placeholder="..." onkeypress="if(event.key==='Enter') window.hhDash.submitQuickModal()">
          <button type="button" class="wish-submit" style="background:#2563EB;" onclick="window.hhDash.submitQuickModal()">Save</button>
        </div>
      `;
      document.body.appendChild(qm);
    }
  }

  function computeMonthlyExpense(finNotes) {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let sum = 0;

    function addTx(tx) {
      if (!tx || typeof tx !== "object") return;
      const amt = Number(tx.amount || tx.sum || 0);
      if (!amt) return;
      const isExp = tx.type ? String(tx.type).toLowerCase() === "expense" : true;
      if (!isExp) return;
      const dt = String(tx.date || tx.created_at || "");
      if (!dt || dt.startsWith(ym)) sum += Math.abs(amt);
    }

    finNotes.forEach(n => {
      try {
        const parsed = JSON.parse(n.content);
        if (Array.isArray(parsed)) parsed.forEach(addTx);
        else addTx(parsed);
      } catch (e) {}
    });
    return Math.round(sum);
  }

  function getLiveStats() {
    const notes = liveCache.notes || [];
    const shop = liveCache.shopping || [];
    const cal = liveCache.calendar || [];
    const todayIso = new Date().toLocaleDateString("en-CA");
    const monthShort = new Date().toLocaleDateString("en-US", { month: "short" });

    const tasks = notes.filter(n => n.title.startsWith("[TASK_N]") || n.title.startsWith("[TASK_P]")).sort((a, b) => b.id - a.id);
    const activeShop = shop.filter(i => !i.is_bought);
    const orders = notes.filter(n => n.title.startsWith("[ORDER]")).sort((a, b) => b.id - a.id);
    const wishes = notes.filter(n => n.title.startsWith("[WISH]") || n.title.startsWith("[WISH_P]") || n.title.startsWith("[WISH_N]")).sort((a, b) => b.id - a.id);
    const finNotes = notes.filter(n => n.title.startsWith("[FIN]"));
    const places = notes.filter(n => n.title.startsWith("[PLACE_T]") || n.title.startsWith("[PLACE_F]")).sort((a, b) => b.id - a.id);
    const tastings = notes.filter(n => n.title.startsWith("[TASTE]")).sort((a, b) => b.id - a.id);
    const mediaList = notes.filter(n => n.title.startsWith("[MEDIA]")).sort((a, b) => b.id - a.id);
    const activeMedia = mediaList.filter(n => {
      try { return !(JSON.parse(n.content) || {}).watched; } catch (e) { return true; }
    });
    let mediaPreview = "Nothing to watch";
    if (activeMedia.length > 0) {
      const top = activeMedia[0];
      const topName = top.title.replace(/^\[MEDIA\]\s*/, "");
      let meta = {};
      try { meta = JSON.parse(top.content) || {}; } catch (e) {}
      mediaPreview = meta.type === "series"
        ? `${topName} • S${meta.season || 1} E${meta.episode || 1}`
        : topName;
    }
    const plainNotes = notes.filter(n =>
      !n.title.startsWith("[WISH") && !n.title.startsWith("[ORDER]") &&
      !n.title.startsWith("[TASK_") && !n.title.startsWith("[FIN]") &&
      !n.title.startsWith("[PLACE_") && !n.title.startsWith("[TASTE]") &&
      !n.title.startsWith("[MEDIA]") &&
      !n.title.startsWith("[SHOP_CHIPS]") && !n.title.startsWith(SETTINGS_TITLE)
    ).sort((a, b) => b.id - a.id);

    const activeCal = cal.filter(p => !p.is_done);
    const todayEvents = activeCal.filter(p => p.start_date <= todayIso && (p.end_date || p.start_date) >= todayIso);
    const futureEvents = activeCal.filter(p => p.start_date > todayIso).sort((a, b) => a.start_date.localeCompare(b.start_date));

    let calBadge = "Clear";
    let calPreview = "No upcoming events";
    let smartFocus = "✨ Clear schedule today";
    if (todayEvents.length > 0) {
      const ev = todayEvents[0];
      calBadge = `Today (${todayEvents.length})`;
      calPreview = (ev.event_time ? `${ev.event_time} • ` : "") + ev.title;
      smartFocus = `📅 Today: ${calPreview}`;
    } else if (futureEvents.length > 0) {
      const ev = futureEvents[0];
      const parts = ev.start_date.split("-");
      calBadge = `${parts[2]}.${parts[1]}`;
      calPreview = (ev.event_time ? `${ev.event_time} • ` : "") + ev.title;
      smartFocus = `✨ Free today • Next ${parts[2]}.${parts[1]}: ${ev.title}`;
    }

    const finExp = computeMonthlyExpense(finNotes);

    return {
      smartFocus,
      smartMeta: `${tasks.length} tasks • ${activeShop.length} shop`,
      tasks: {
        badge: tasks.length ? `${tasks.length} active` : "Empty",
        preview: tasks.length ? tasks[0].title.replace(/^\[TASK_[NP]\]\s*/, "") : "All tasks done",
        quickAdd: "tasks"
      },
      calendar: { badge: calBadge, preview: calPreview },
      shopping: {
        badge: activeShop.length ? `${activeShop.length} items` : "Empty",
        preview: activeShop.length ? activeShop.slice(0, 4).map(i => i.title).join(", ") : "Grocery list is empty",
        quickAdd: "shopping"
      },
      order: {
        badge: orders.length ? `${orders.length} items` : "Empty",
        preview: orders.length ? orders[0].title.replace(/^\[ORDER\]\s*/, "") : "Nothing to order"
      },
      wishlist: {
        badge: wishes.length ? `${wishes.length} ideas` : "Empty",
        preview: wishes.length ? wishes[0].title.replace(/^\[WISH[_NP]*\]\s*/, "") : "No wishes yet"
      },
      finance: {
        badge: `${monthShort} spent`,
        preview: uiSettings.hideFinance ? "•••• ₪" : `${finExp.toLocaleString()} ₪`,
        isFinance: true
      },
      notes: {
        badge: plainNotes.length ? `${plainNotes.length} notes` : "Empty",
        preview: plainNotes.length ? plainNotes[0].title : "No notes yet",
        quickAdd: "notes"
      },
      places: {
        badge: places.length ? `${places.length} spots` : "Empty",
        preview: places.length ? places[0].title.replace(/^\[PLACE_[TF]\]\s*/, "") : "No saved places"
      },
      tastings: {
        badge: tastings.length ? `${tastings.length} drinks` : "Empty",
        preview: tastings.length ? tastings[0].title.replace(/^\[TASTE\]\s*/, "") : "No tastings yet"
      },
      media: {
        badge: activeMedia.length ? `${activeMedia.length} to watch` : "Empty",
        preview: mediaPreview
      }
    };
  }

  function buildSmartBarHtml(stats) {
    if (!uiSettings.showSmartBar) return "";

    const cityIds = [];
    if (uiSettings.weatherCity1 && uiSettings.weatherCity1 !== "none") cityIds.push(uiSettings.weatherCity1);
    if (uiSettings.weatherCity2 && uiSettings.weatherCity2 !== "none" && uiSettings.weatherCity2 !== uiSettings.weatherCity1) {
      cityIds.push(uiSettings.weatherCity2);
    }

    let weatherRowHtml = "";
    if (cityIds.length > 0) {
      const chips = cityIds.map(id => {
        const city = getCityObj(id);
        const w = weatherData[id];
        if (w) {
          return `<span class="bento-weather-chip">${w.icon} <span class="bento-weather-temp">${w.temp}°</span> ${esc(w.desc)} · ${esc(w.name)}</span>`;
        }
        return `<span class="bento-weather-chip">🌤️ ${esc(city ? city.name : id)}...</span>`;
      }).join("");
      weatherRowHtml = `<div class="bento-weather-row">${chips}</div>`;
    }

    const focusText = stats.smartFocus || "";
    const isLong = focusText.length > 26;
    const trackContent = isLong
      ? `${esc(focusText)}   •   ${esc(focusText)}   •   `
      : esc(focusText);

    return `
      <div class="bento-smart-bar">
        ${weatherRowHtml}
        <div class="bento-focus-line" onclick="openScreen('screen-calendar')">
          <div class="bento-focus-viewport">
            <span class="bento-focus-track ${isLong ? "scrolling" : ""}">${trackContent}</span>
          </div>
          <span class="bento-focus-meta">${esc(stats.smartMeta)}</span>
        </div>
      </div>
    `;
  }

  function runGlobalSearch(rawQuery) {
    const q = (rawQuery || "").trim().toLowerCase();
    if (!q) return [];
    const results = [];

    (liveCache.shopping || []).filter(i => !i.is_bought).forEach(i => {
      if (String(i.title || "").toLowerCase().includes(q)) {
        results.push({ icon: "🛒", tag: "Shopping", title: i.title, sub: i.added_by ? `Added by ${i.added_by}` : "Grocery list", screen: "screen-shopping" });
      }
    });

    (liveCache.calendar || []).filter(p => !p.is_done).forEach(p => {
      const hay = `${p.title || ""} ${p.start_date || ""}`.toLowerCase();
      if (hay.includes(q)) {
        const parts = (p.start_date || "").split("-");
        const dStr = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : p.start_date;
        results.push({ icon: "📅", tag: "Calendar", title: p.title, sub: dStr + (p.event_time ? ` • ${p.event_time}` : ""), screen: "screen-calendar" });
      }
    });

    (liveCache.notes || []).forEach(n => {
      const t = n.title || "";
      if (t.startsWith("[SHOP_CHIPS]") || t.startsWith(SETTINGS_TITLE) || t.startsWith("[FIN]")) return;

      let icon = "📝", tag = "Notes", screen = "screen-notes", clean = t, isFolder = true, noteShared = !!n.is_shared;
      if (t.startsWith("[TASK_N]") || t.startsWith("[TASK_P]")) {
        icon = "✅"; tag = "Tasks"; screen = "screen-tasks"; clean = t.replace(/^\[TASK_[NP]\]\s*/, "");
      } else if (t.startsWith("[ORDER]")) {
        icon = "📦"; tag = "To Order"; screen = "screen-order"; clean = t.replace(/^\[ORDER\]\s*/, ""); isFolder = false;
      } else if (t.startsWith("[WISH")) {
        icon = "🎁"; tag = "Wishlist"; screen = "screen-wishlist"; clean = t.replace(/^\[WISH[_NP]*\]\s*/, ""); isFolder = false;
      } else if (t.startsWith("[PLACE_")) {
        icon = "📍"; tag = "Places"; screen = "screen-places"; clean = t.replace(/^\[PLACE_[TF]\]\s*/, ""); isFolder = false;
      } else if (t.startsWith("[TASTE]")) {
        icon = "🥃"; tag = "Tastings"; screen = "screen-tastings"; clean = t.replace(/^\[TASTE\]\s*/, ""); isFolder = false;
      } else if (t.startsWith("[MEDIA]")) {
        icon = "🎬"; tag = "Watchlist"; screen = "screen-media"; clean = t.replace(/^\[MEDIA\]\s*/, ""); isFolder = false;
      }

      let matchedSub = "";
      if (isFolder) {
        try {
          const items = JSON.parse(n.content);
          if (Array.isArray(items)) {
            const hit = items.find(it => String(it.text || "").toLowerCase().includes(q));
            if (hit) matchedSub = `• ${hit.text}`;
          }
        } catch (e) {}
      }

      if (clean.toLowerCase().includes(q) || matchedSub) {
        results.push({
          icon, tag, title: clean,
          sub: matchedSub || (screen === "screen-notes" ? (noteShared ? "Shared note" : "Personal note") : tag),
          screen, noteId: isFolder ? n.id : null, noteShared
        });
      }
    });

    return results.slice(0, 15);
  }

  function renderSearchResultsOnly() {
    const box = document.getElementById("hh-bento-search-results");
    const grid = document.getElementById("hh-bento-grid");
    const clr = document.getElementById("hh-bento-search-clear");
    if (!box || !grid) return;

    const q = searchQuery.trim();
    if (clr) clr.style.display = q ? "flex" : "none";

    if (!q) {
      box.classList.remove("open");
      box.innerHTML = "";
      grid.style.display = "grid";
      return;
    }

    searchResultsCache = runGlobalSearch(q);
    grid.style.display = "none";
    box.classList.add("open");

    if (searchResultsCache.length === 0) {
      box.innerHTML = `<div style="text-align:center; padding:26px; color:#64748B; font-size:13px;">Nothing found for "${esc(q)}"</div>`;
      return;
    }

    box.innerHTML = searchResultsCache.map((r, idx) => `
      <div class="bento-sr-item" onclick="window.hhDash.openSearchResult(${idx})">
        <div class="bento-sr-ico">${r.icon}</div>
        <div class="bento-sr-body">
          <div class="bento-sr-title">${esc(r.title)}</div>
          <div class="bento-sr-sub">${esc(r.sub)}</div>
        </div>
        <span class="bento-sr-tag">${esc(r.tag)}</span>
      </div>
    `).join("");
  }

  function renderDashboard() {
    const dash = document.getElementById("screen-dashboard");
    if (!dash || !uiSettings) return;
    const welcome = dash.querySelector(".welcome-card");
    const grid = dash.querySelector(".grid-menu");
    const bentoRoot = document.getElementById("hh-bento-root");
    const visibleMods = uiSettings.modules.filter(m => m.visible);

    if (uiSettings.mode === "bento") {
      if (welcome) welcome.style.display = "none";
      if (grid) grid.style.display = "none";
      if (bentoRoot) {
        bentoRoot.style.display = "block";
        const stats = getLiveStats();
        const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" });

        const cardsHtml = visibleMods.map(m => {
          const col = getColorObj(m.color);
          const st = stats[m.id] || { badge: "", preview: "" };
          let topRight = "";
          if (st.quickAdd) {
            topRight = `<button type="button" class="bento-act-btn" onclick="event.stopPropagation(); window.hhDash.openQuickModal('${st.quickAdd}')">+</button>`;
          } else if (st.isFinance) {
            topRight = `<button type="button" class="bento-act-btn" onclick="event.stopPropagation(); window.hhDash.toggleFinanceHide()">${uiSettings.hideFinance ? "🙈" : "👁️"}</button>`;
          }
          return `
            <div class="bento-card ${m.size === "2x1" ? "wide" : ""}" style="border-color: ${col.soft};" onclick="openScreen('${m.screen}')">
              <div class="bento-top">
                <div class="bento-icon-box" style="background:${col.soft}; border:1px solid ${col.soft};">${m.icon}</div>
                ${topRight}
              </div>
              <div>
                <div class="bento-mid">
                  <div class="bento-title">${esc(m.label)}</div>
                  <div class="bento-badge" style="background:${col.soft}; color:${col.accent};">${esc(st.badge)}</div>
                </div>
                <div class="bento-preview">${esc(st.preview)}</div>
              </div>
            </div>
          `;
        }).join("");

        bentoRoot.innerHTML = `
          <div class="bento-header">
            <div>
              <div class="bento-date">${esc(dateStr)}</div>
              <h2 class="bento-greet">${esc(getTimeGreeting())}, ${esc(getUname())}!</h2>
            </div>
            <div class="bento-hdr-btns">
              <button type="button" class="bento-hdr-btn" title="Settings" onclick="window.hhDash.openSettings()">⚙️</button>
              <button type="button" class="bento-hdr-btn" title="Switch / Lock" onclick="openAuthLock()">🔒</button>
            </div>
          </div>
          ${buildSmartBarHtml(stats)}
          <div class="bento-search-wrap">
            <span class="bento-search-ico">🔍</span>
            <input type="text" id="hh-bento-search" class="bento-search-input" value="${esc(searchQuery)}" placeholder="Search notes, tasks, shopping, calendar..." oninput="window.hhDash.onSearchInput(this.value)">
            <button type="button" id="hh-bento-search-clear" class="bento-search-clear" onclick="window.hhDash.clearSearch()">✕</button>
          </div>
          <div id="hh-bento-search-results" class="bento-search-results"></div>
          <div id="hh-bento-grid" class="bento-grid">${cardsHtml}</div>
        `;
        renderSearchResultsOnly();
      }
    } else {
      if (welcome) welcome.style.display = "";
      if (bentoRoot) bentoRoot.style.display = "none";
      if (grid) {
        grid.style.display = "";
        grid.innerHTML = visibleMods.map(m => {
          const col = getColorObj(m.color);
          return `
            <div class="grid-item" style="background: ${col.bg};" onclick="openScreen('${m.screen}')">
              <div class="grid-icon">${m.icon}</div>
              <div class="grid-label">${esc(m.label)}</div>
            </div>
          `;
        }).join("");
      }
    }
  }

  function renderSettingsScreen() {
    const modeRow = document.getElementById("set-mode-row");
    const weatherBox = document.getElementById("set-weather-box");
    const startRow = document.getElementById("set-start-row");
    const list = document.getElementById("set-modules-list");
    if (!modeRow || !list) return;

    modeRow.innerHTML = `
      <div class="set-mode-card ${uiSettings.mode === "classic" ? "active" : ""}" onclick="window.hhDash.setMode('classic')">
        <div class="set-mode-ico">⊞</div>
        <div class="set-mode-name">Classic 3×3</div>
        <div class="set-mode-sub">Colorful icon tiles</div>
      </div>
      <div class="set-mode-card ${uiSettings.mode === "bento" ? "active" : ""}" onclick="window.hhDash.setMode('bento')">
        <div class="set-mode-ico">✨</div>
        <div class="set-mode-name">Bento Smart</div>
        <div class="set-mode-sub">Live previews & weather</div>
      </div>
    `;

    if (weatherBox) {
      const cityOptions = (selectedId, allowOffLabel) => {
        const offOpt = `<option value="none" ${selectedId === "none" ? "selected" : ""}>${allowOffLabel}</option>`;
        return offOpt + WEATHER_CITIES.map(c =>
          `<option value="${c.id}" ${selectedId === c.id ? "selected" : ""}>${esc(c.name)}</option>`
        ).join("");
      };

      weatherBox.innerHTML = `
        <div class="set-weather-box">
          <div class="set-weather-top">
            <div>
              <div style="font-size:14px; font-weight:700; color:#F8FAFC;">🌤️ Smart Day Bar</div>
              <div style="font-size:11px; color:#94A3B8;">Weather (1 or 2 cities) + today's focus</div>
            </div>
            <button type="button" class="set-ctrl-btn ${uiSettings.showSmartBar ? "active" : ""}" onclick="window.hhDash.toggleSmartBar()">${uiSettings.showSmartBar ? "ON" : "OFF"}</button>
          </div>
          ${uiSettings.showSmartBar ? `
            <div class="set-weather-grid">
              <div>
                <label class="set-select-lbl">City 1</label>
                <select class="set-select" onchange="window.hhDash.setWeatherCity(1, this.value)">
                  ${cityOptions(uiSettings.weatherCity1, "Off (no weather)")}
                </select>
              </div>
              <div>
                <label class="set-select-lbl">City 2 (optional)</label>
                <select class="set-select" onchange="window.hhDash.setWeatherCity(2, this.value)">
                  ${cityOptions(uiSettings.weatherCity2, "Off (1 city only)")}
                </select>
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }

    if (startRow) {
      startRow.innerHTML = START_SCREENS.map(s => `
        <button type="button" class="set-start-chip ${uiSettings.startScreen === s.id ? "active" : ""}" onclick="window.hhDash.setStartScreen('${s.id}')">${s.label}</button>
      `).join("");
    }

    list.innerHTML = uiSettings.modules.map((m, idx) => {
      const col = getColorObj(m.color);
      const isPaletteOpen = openColorPickerId === m.id;
      const paletteHtml = isPaletteOpen ? `
        <div class="set-palette">
          ${UI_COLORS.map(c => `<div class="set-color-dot ${c.id === m.color ? "active" : ""}" style="background:${c.bg};" onclick="window.hhDash.setColor('${m.id}', '${c.id}')"></div>`).join("")}
        </div>
      ` : "";

      return `
        <div class="set-mod-card ${m.visible ? "" : "hidden-mod"}">
          <div class="set-mod-row">
            <div class="set-swatch" style="background:${col.bg};" title="Pick Color" onclick="window.hhDash.togglePalette('${m.id}')">${m.icon}</div>
            <div class="set-mod-name">${esc(m.label)}</div>
            <button type="button" class="set-ctrl-btn ${m.size === "2x1" ? "active" : ""}" onclick="window.hhDash.toggleSize('${m.id}')">${m.size}</button>
            <button type="button" class="set-ctrl-btn" onclick="window.hhDash.moveMod(${idx}, -1)">▲</button>
            <button type="button" class="set-ctrl-btn" onclick="window.hhDash.moveMod(${idx}, 1)">▼</button>
            <button type="button" class="set-ctrl-btn ${m.visible ? "active" : ""}" onclick="window.hhDash.toggleVis('${m.id}')">${m.visible ? "👁️" : "🚫"}</button>
          </div>
          ${paletteHtml}
        </div>
      `;
    }).join("");
  }

  async function syncFromServer() {
    if (typeof currentAuthKey === "undefined" || !currentAuthKey) return;
    try {
      const [nRes, sRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/api/notes`),
        fetch(`${API_BASE}/api/shopping`),
        fetch(`${API_BASE}/api/calendar`)
      ]);
      if (nRes.ok) {
        liveCache.notes = await nRes.json();
        const found = liveCache.notes.find(n => n.title === SETTINGS_TITLE && !n.is_shared);
        if (found) {
          settingsNoteId = found.id;
          try {
            uiSettings = normalizeSettings(JSON.parse(found.content));
            saveLocalSettings();
          } catch (e) {}
        } else {
          settingsNoteId = null;
        }
      }
      if (sRes.ok) liveCache.shopping = await sRes.json();
      if (cRes.ok) liveCache.calendar = await cRes.json();

      const searchEl = document.getElementById("hh-bento-search");
      if (searchEl && document.activeElement === searchEl) {
        renderSearchResultsOnly();
      } else {
        renderDashboard();
      }

      if (document.getElementById("screen-settings")?.classList.contains("active")) {
        renderSettingsScreen();
      }
      refreshWeatherForSettings();
    } catch (e) {}
  }

  function applyStartScreenOnce() {
    if (startScreenApplied) return;
    if (typeof currentAuthKey === "undefined" || !currentAuthKey) return;
    startScreenApplied = true;
    if (uiSettings && uiSettings.startScreen && uiSettings.startScreen !== "screen-dashboard") {
      if (typeof openScreen === "function") {
        openScreen(uiSettings.startScreen);
      }
    }
  }

  function renderQuickToggles() {
    const box = document.getElementById("hh-qmodal-toggle");
    if (!box) return;
    if (quickModalType === "tasks") {
      box.style.display = "flex";
      box.innerHTML = `
        <button type="button" class="hh-qtoggle-btn ${quickTaskOwner === "Nikolai" ? "active" : ""}" onclick="window.hhDash.setQuickTaskOwner('Nikolai')">👤 Nikolai</button>
        <button type="button" class="hh-qtoggle-btn ${quickTaskOwner === "Polly" ? "active" : ""}" onclick="window.hhDash.setQuickTaskOwner('Polly')">👤 Polly</button>
      `;
    } else if (quickModalType === "notes") {
      box.style.display = "flex";
      box.innerHTML = `
        <button type="button" class="hh-qtoggle-btn ${quickNoteShared ? "active" : ""}" onclick="window.hhDash.setQuickNoteShared(true)">👨‍👩‍👧 Shared</button>
        <button type="button" class="hh-qtoggle-btn ${!quickNoteShared ? "active" : ""}" onclick="window.hhDash.setQuickNoteShared(false)">🔒 Personal</button>
      `;
    } else {
      box.style.display = "none";
      box.innerHTML = "";
    }
  }

  window.hhDash = {
    openSettings: function () {
      openColorPickerId = null;
      openScreen("screen-settings");
      renderSettingsScreen();
    },
    setMode: function (mode) {
      uiSettings.mode = mode;
      renderSettingsScreen();
      renderDashboard();
      saveDbSettings();
      if (mode === "bento") syncFromServer();
    },
    toggleSmartBar: function () {
      uiSettings.showSmartBar = !uiSettings.showSmartBar;
      renderSettingsScreen();
      renderDashboard();
      saveDbSettings();
      if (uiSettings.showSmartBar) refreshWeatherForSettings();
    },
    setWeatherCity: function (slot, cityId) {
      if (slot === 1) uiSettings.weatherCity1 = cityId;
      else uiSettings.weatherCity2 = cityId;
      renderSettingsScreen();
      renderDashboard();
      saveDbSettings();
      refreshWeatherForSettings();
    },
    setStartScreen: function (screenId) {
      uiSettings.startScreen = screenId;
      renderSettingsScreen();
      saveDbSettings();
    },
    togglePalette: function (id) {
      openColorPickerId = (openColorPickerId === id) ? null : id;
      renderSettingsScreen();
    },
    setColor: function (id, colorId) {
      const m = uiSettings.modules.find(x => x.id === id);
      if (m) m.color = colorId;
      openColorPickerId = null;
      renderSettingsScreen();
      renderDashboard();
      saveDbSettings();
    },
    toggleSize: function (id) {
      const m = uiSettings.modules.find(x => x.id === id);
      if (m) m.size = m.size === "2x1" ? "1x1" : "2x1";
      renderSettingsScreen();
      renderDashboard();
      saveDbSettings();
    },
    toggleVis: function (id) {
      const m = uiSettings.modules.find(x => x.id === id);
      if (!m) return;
      const visCount = uiSettings.modules.filter(x => x.visible).length;
      if (m.visible && visCount <= 1) return;
      m.visible = !m.visible;
      renderSettingsScreen();
      renderDashboard();
      saveDbSettings();
    },
    moveMod: function (idx, dir) {
      const target = idx + dir;
      if (target < 0 || target >= uiSettings.modules.length) return;
      const arr = uiSettings.modules;
      const tmp = arr[idx];
      arr[idx] = arr[target];
      arr[target] = tmp;
      renderSettingsScreen();
      renderDashboard();
      saveDbSettings();
    },
    resetSettings: function () {
      if (!confirm("Reset layout & colors to default?")) return;
      uiSettings = getDefaultSettings();
      openColorPickerId = null;
      renderSettingsScreen();
      renderDashboard();
      saveDbSettings();
      refreshWeatherForSettings();
    },
    toggleFinanceHide: function () {
      uiSettings.hideFinance = !uiSettings.hideFinance;
      renderDashboard();
      saveDbSettings();
    },
    onSearchInput: function (val) {
      searchQuery = val;
      renderSearchResultsOnly();
    },
    clearSearch: function () {
      searchQuery = "";
      const inp = document.getElementById("hh-bento-search");
      if (inp) inp.value = "";
      renderSearchResultsOnly();
    },
    openSearchResult: function (idx) {
      const r = searchResultsCache[idx];
      if (!r) return;
      searchQuery = "";
      if (r.noteId && typeof expandedNotes !== "undefined") {
        expandedNotes[r.noteId] = true;
      }
      if (r.screen === "screen-notes" && typeof setNotesTab === "function") {
        setNotesTab(!!r.noteShared);
      }
      openScreen(r.screen);
    },
    openQuickModal: function (type) {
      quickModalType = type;
      const titles = { shopping: "🛒 Quick Add to Shopping", tasks: "✅ Quick Add Task", notes: "📝 Quick Add Note" };
      const phs = { shopping: "Items (comma separated)...", tasks: "Task title...", notes: "Note folder title..." };
      document.getElementById("hh-qmodal-title").textContent = titles[type] || "Quick Add";
      const inp = document.getElementById("hh-qmodal-input");
      inp.value = "";
      inp.placeholder = phs[type] || "...";
      renderQuickToggles();
      document.getElementById("hh-quick-modal").classList.add("open");
      syncBackButton();
      setTimeout(() => inp.focus(), 60);
    },
    closeQuickModal: function () {
      quickModalType = null;
      document.getElementById("hh-quick-modal").classList.remove("open");
      syncBackButton();
    },
    setQuickTaskOwner: function (who) {
      quickTaskOwner = who;
      renderQuickToggles();
    },
    setQuickNoteShared: function (shared) {
      quickNoteShared = shared;
      renderQuickToggles();
    },
    submitQuickModal: async function () {
      const inp = document.getElementById("hh-qmodal-input");
      const val = inp.value.trim();
      if (!val || !quickModalType) return;
      const type = quickModalType;
      window.hhDash.closeQuickModal();
      try {
        if (type === "shopping") {
          await fetch(`${API_BASE}/api/shopping`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: val })
          });
        } else if (type === "tasks") {
          const prefix = quickTaskOwner === "Nikolai" ? "[TASK_N]" : "[TASK_P]";
          await fetch(`${API_BASE}/api/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `${prefix} ${val}`, is_shared: true, content: "[]" })
          });
        } else if (type === "notes") {
          await fetch(`${API_BASE}/api/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: val, is_shared: quickNoteShared, content: "[]" })
          });
        }
        await syncFromServer();
      } catch (e) {
        alert("Quick save failed: " + e.message);
      }
    }
  };

  let handlingPopState = false;

  function syncBackButton() {
    const bb = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton;
    if (!bb) return;
    const activeScreen = document.querySelector(".screen.active");
    const isDash = !activeScreen || activeScreen.id === "screen-dashboard";
    const quickOpen = document.getElementById("hh-quick-modal")?.classList.contains("open");
    const calMoveOpen = document.getElementById("cal-move-modal")?.classList.contains("open");
    if (!isDash || quickOpen || calMoveOpen) {
      bb.show();
    } else {
      bb.hide();
    }
  }

  function handleBackAction(fromPopState) {
    const quickModal = document.getElementById("hh-quick-modal");
    if (quickModal && quickModal.classList.contains("open")) {
      window.hhDash.closeQuickModal();
      return true;
    }
    const calMoveModal = document.getElementById("cal-move-modal");
    if (calMoveModal && calMoveModal.classList.contains("open") && typeof closeCalMove === "function") {
      closeCalMove();
      syncBackButton();
      return true;
    }
    const activeScreen = document.querySelector(".screen.active");
    if (activeScreen && activeScreen.id !== "screen-dashboard") {
      if (fromPopState) handlingPopState = true;
      if (typeof openScreen === "function") openScreen("screen-dashboard");
      handlingPopState = false;
      return true;
    }
    syncBackButton();
    return false;
  }

  function initBackButton() {
    const tgApp = window.Telegram && window.Telegram.WebApp;
    const bb = tgApp && tgApp.BackButton;
    if (bb && !bb._hhBound) {
      bb._hhBound = true;
      bb.onClick(function () {
        handleBackAction(false);
      });
    }
    if (!window._hhPopBound) {
      window._hhPopBound = true;
      window.addEventListener("popstate", function () {
        handleBackAction(true);
      });
    }
    syncBackButton();
  }

  function hookAppLifecycle() {
    if (typeof window.openScreen === "function" && !window.openScreen._hhWrapped) {
      const origOpen = window.openScreen;
      window.openScreen = function (screenId, devTitle) {
        origOpen(screenId, devTitle);
        if (screenId === "screen-dashboard") {
          renderDashboard();
          syncFromServer();
        } else if (!handlingPopState) {
          try {
            if (!history.state || history.state.hhScreen !== screenId) {
              history.pushState({ hhScreen: screenId }, "");
            }
          } catch (e) {}
        }
        syncBackButton();
      };
      window.openScreen._hhWrapped = true;
    }

    if (typeof window.submitAppLogin === "function" && !window.submitAppLogin._hhWrapped) {
      const origLogin = window.submitAppLogin;
      window.submitAppLogin = async function () {
        await origLogin();
        const overlay = document.getElementById("auth-overlay");
        if (!overlay || overlay.style.display === "none") {
          settingsNoteId = null;
          searchQuery = "";
          uiSettings = loadLocalSettings();
          renderDashboard();
          syncFromServer();
          syncBackButton();
        }
      };
      window.submitAppLogin._hhWrapped = true;
    }
  }

  injectStyles();
  injectDom();
  uiSettings = loadLocalSettings();
  hookAppLifecycle();
  renderDashboard();
  syncFromServer();
  refreshWeatherForSettings();
  applyStartScreenOnce();
  initBackButton();
})();
