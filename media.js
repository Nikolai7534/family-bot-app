(function () {
  const MEDIA_PREFIX = "[MEDIA]";
  let mediaItems = [];
  let activeTab = "series"; // "series" | "movies" | "games"
  let expandedMedia = {};
  let showWatched = false;
  let randomPickId = null;
  let isSpinning = false;

  function esc(str) {
    const d = document.createElement("div");
    d.innerText = str == null ? "" : String(str);
    return d.innerHTML;
  }

  function getActorName() {
    if (typeof userName !== "undefined" && userName) return userName;
    const uid = typeof currentUserId !== "undefined" ? currentUserId : Number(localStorage.getItem("hh_uid"));
    return uid === 191692918 ? "Polly" : "Nikolai";
  }

  function parseMeta(raw) {
    let obj = {};
    try { obj = JSON.parse(raw) || {}; } catch (e) {}
    return {
      type: ["series", "movies", "games"].includes(obj.type) ? obj.type : "series",
      season: Math.max(1, Number(obj.season) || 1),
      episode: Math.max(1, Number(obj.episode) || 1),
      time: typeof obj.time === "string" ? obj.time : "",
      note: typeof obj.note === "string" ? obj.note : "",
      added_by: obj.added_by || "Family",
      watched: !!obj.watched,
      rating: Math.min(5, Math.max(0, Number(obj.rating) || 0))
    };
  }

  function injectStyles() {
    if (document.getElementById("hh-media-styles")) return;
    const style = document.createElement("style");
    style.id = "hh-media-styles";
    style.textContent = `
      .med-add-row { display: flex; gap: 8px; margin-bottom: 10px; }
      .med-add-btn { background: linear-gradient(135deg, #E11D48, #FB7185); color: #fff; border: none; border-radius: 12px; padding: 0 16px; font-size: 14px; font-weight: 800; cursor: pointer; flex-shrink: 0; }
      .med-add-btn:active { transform: scale(0.95); }

      .med-tools-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 14px; }
      .med-random-btn { flex: 1; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(167, 139, 250, 0.45); color: #DDD6FE; border-radius: 12px; padding: 10px 12px; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.15s; }
      .med-random-btn:active { transform: scale(0.97); }
      .med-count-pill { font-size: 12px; font-weight: 700; color: #94A3B8; padding: 0 6px; white-space: nowrap; }

      .med-card { background: rgba(19, 28, 49, 0.92); border: 1px solid rgba(255,255,255,0.08); border-radius: 15px; margin-bottom: 10px; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s; }
      .med-card.picked { border-color: #F472B6; box-shadow: 0 0 0 2px rgba(244, 114, 182, 0.35); transform: scale(1.01); }
      .med-card.watched-card { opacity: 0.78; border-color: rgba(34, 197, 94, 0.22); }

      .med-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 13px 12px; cursor: pointer; }
      .med-head-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
      .med-chev { font-size: 11px; color: #94A3B8; transition: transform 0.2s; flex-shrink: 0; }
      .med-title-col { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
      .med-title { font-size: 15px; font-weight: 700; color: #F8FAFC; word-break: break-word; line-height: 1.25; }
      .med-sub-row { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
      .med-prog-pill { font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 7px; background: rgba(56, 189, 248, 0.16); color: #7DD3FC; }
      .med-time-pill { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 7px; background: rgba(245, 158, 11, 0.16); color: #FDE68A; }
      .med-star-pill { font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 7px; background: rgba(250, 204, 21, 0.16); color: #FDE047; }
      .med-author { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; }
      .med-author.nikolai { background: rgba(59, 130, 246, 0.2); color: #93C5FD; }
      .med-author.polly { background: rgba(236, 72, 153, 0.2); color: #F9A8D4; }
      .med-author.other { background: rgba(148, 163, 184, 0.18); color: #CBD5E1; }

      .med-head-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
      .med-del { background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(239, 68, 68, 0.28); color: #FCA5A5; border-radius: 8px; padding: 5px 8px; font-size: 12px; font-weight: 700; cursor: pointer; line-height: 1; }

      .med-body { padding: 0 12px 13px 12px; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(11, 17, 32, 0.35); }
      .med-ctrl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 11px; }
      .med-stepper { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 8px; text-align: center; }
      .med-step-lbl { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
      .med-step-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
      .med-step-btn { width: 32px; height: 30px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.08); color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .med-step-btn.plus { background: rgba(56, 189, 248, 0.22); border-color: rgba(56, 189, 248, 0.45); color: #BAE6FD; }
      .med-step-btn:active { transform: scale(0.92); }
      .med-step-val { font-size: 16px; font-weight: 800; color: #F8FAFC; min-width: 28px; }

      .med-time-row { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
      .med-time-inp { flex: 1; background: #0B1120; border: 1px solid rgba(255,255,255,0.12); color: #F8FAFC; border-radius: 10px; padding: 9px 11px; font-size: 13px; outline: none; }
      .med-time-inp:focus { border-color: #60A5FA; }
      .med-save-btn { background: #2563EB; color: #fff; border: none; border-radius: 10px; padding: 9px 14px; font-size: 12px; font-weight: 800; cursor: pointer; flex-shrink: 0; }

      .med-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); }
      .med-stars { display: flex; gap: 3px; }
      .med-star-btn { background: transparent; border: none; font-size: 19px; padding: 2px; cursor: pointer; opacity: 0.28; filter: grayscale(1); transition: 0.12s; }
      .med-star-btn.on { opacity: 1; filter: none; transform: scale(1.06); }
      .med-done-btn { background: rgba(22, 163, 74, 0.22); border: 1px solid rgba(34, 197, 94, 0.45); color: #86EFAC; border-radius: 10px; padding: 7px 11px; font-size: 12px; font-weight: 800; cursor: pointer; white-space: nowrap; }
      .med-done-btn.undo { background: rgba(148, 163, 184, 0.16); border-color: rgba(148, 163, 184, 0.35); color: #CBD5E1; }

      .med-watched-toggle { width: 100%; margin: 14px 0 10px 0; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #94A3B8; border-radius: 12px; padding: 10px 12px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
    `;
    document.head.appendChild(style);
  }

  function injectDom() {
    if (document.getElementById("screen-media")) return;
    const screen = document.createElement("div");
    screen.id = "screen-media";
    screen.className = "screen";
    screen.innerHTML = `
      <div class="nav-header">
        <button class="back-btn" onclick="openScreen('screen-dashboard')">←</button>
        <h2>Watchlist & Media</h2>
      </div>
      <div class="tabs">
        <button class="tab-btn active" id="tab-med-series" onclick="window.hhMedia.setTab('series')">📺 Series</button>
        <button class="tab-btn" id="tab-med-movies" onclick="window.hhMedia.setTab('movies')">🍿 Movies</button>
        <button class="tab-btn" id="tab-med-games" onclick="window.hhMedia.setTab('games')">🎲 Games</button>
      </div>
      <div class="med-add-row">
        <input type="text" id="med-new-title" class="wish-input" style="margin-bottom:0; flex:1;" placeholder="Add series title..." onkeypress="if(event.key==='Enter') window.hhMedia.addItem()">
        <button type="button" class="med-add-btn" onclick="window.hhMedia.addItem()">+ Add</button>
      </div>
      <div class="med-tools-row">
        <button type="button" class="med-random-btn" id="med-random-btn" onclick="window.hhMedia.pickRandom()">🎲 Pick Random</button>
        <span class="med-count-pill" id="med-count-pill"></span>
      </div>
      <div id="med-list-container"></div>
    `;
    document.body.appendChild(screen);
  }

  async function fetchMedia() {
    if (typeof currentAuthKey === "undefined" || !currentAuthKey) {
      if (typeof openAuthLock === "function") openAuthLock();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/notes`);
      if (res.status === 401) { if (typeof openAuthLock === "function") openAuthLock(); return; }
      if (!res.ok) throw new Error("Status " + res.status);
      const notes = await res.json();
      mediaItems = notes
        .filter(n => n.title && n.title.startsWith(MEDIA_PREFIX))
        .map(n => ({
          id: n.id,
          title: n.title.replace(MEDIA_PREFIX, "").trim(),
          meta: parseMeta(n.content)
        }))
        .sort((a, b) => b.id - a.id);
      renderMedia();
    } catch (e) {
      alert("Watchlist error: " + e.message);
    }
  }

  async function saveMeta(item) {
    renderMedia();
    try {
      await fetch(`${API_BASE}/api/notes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify(item.meta) })
      });
    } catch (e) {}
  }

  function buildCardHtml(item) {
    const m = item.meta;
    const isExp = !!expandedMedia[item.id];
    const isPicked = randomPickId === item.id;
    const whoLow = String(m.added_by || "").toLowerCase();
    const whoClass = whoLow === "nikolai" ? "nikolai" : (whoLow === "polly" ? "polly" : "other");

    let badges = "";
    if (m.type === "series" && !m.watched) {
      badges += `<span class="med-prog-pill">S${m.season} · E${m.episode}</span>`;
    }
    if (m.time && !m.watched) {
      badges += `<span class="med-time-pill">⏱ ${esc(m.time)}</span>`;
    }
    if (m.type === "games" && m.note && !m.watched) {
      badges += `<span class="med-prog-pill">${esc(m.note)}</span>`;
    }
    if (m.rating > 0) {
      badges += `<span class="med-star-pill">⭐ ${m.rating}/5</span>`;
    }
    if (m.added_by) {
      badges += `<span class="med-author ${whoClass}">${esc(m.added_by)}</span>`;
    }

    let bodyControls = "";
    if (isExp) {
      if (m.type === "series") {
        bodyControls += `
          <div class="med-ctrl-grid">
            <div class="med-stepper">
              <div class="med-step-lbl">Season</div>
              <div class="med-step-row">
                <button type="button" class="med-step-btn" onclick="window.hhMedia.step(${item.id}, 'season', -1)">−</button>
                <span class="med-step-val">${m.season}</span>
                <button type="button" class="med-step-btn plus" onclick="window.hhMedia.step(${item.id}, 'season', 1)">+</button>
              </div>
            </div>
            <div class="med-stepper">
              <div class="med-step-lbl">Episode</div>
              <div class="med-step-row">
                <button type="button" class="med-step-btn" onclick="window.hhMedia.step(${item.id}, 'episode', -1)">−</button>
                <span class="med-step-val">${m.episode}</span>
                <button type="button" class="med-step-btn plus" onclick="window.hhMedia.step(${item.id}, 'episode', 1)">+</button>
              </div>
            </div>
          </div>
          <div class="med-time-row">
            <input type="text" id="med-time-${item.id}" class="med-time-inp" value="${esc(m.time)}" placeholder="Stopped at (e.g. 34:15)" onkeypress="if(event.key==='Enter') window.hhMedia.saveTime(${item.id})">
            <button type="button" class="med-save-btn" onclick="window.hhMedia.saveTime(${item.id})">Save</button>
          </div>
        `;
      } else if (m.type === "movies") {
        bodyControls += `
          <div class="med-time-row">
            <input type="text" id="med-time-${item.id}" class="med-time-inp" value="${esc(m.time)}" placeholder="Paused at (e.g. 45:10)" onkeypress="if(event.key==='Enter') window.hhMedia.saveTime(${item.id})">
            <button type="button" class="med-save-btn" onclick="window.hhMedia.saveTime(${item.id})">Save</button>
          </div>
        `;
      } else {
        bodyControls += `
          <div class="med-time-row">
            <input type="text" id="med-note-${item.id}" class="med-time-inp" value="${esc(m.note)}" placeholder="Players / duration / notes..." onkeypress="if(event.key==='Enter') window.hhMedia.saveNote(${item.id})">
            <button type="button" class="med-save-btn" onclick="window.hhMedia.saveNote(${item.id})">Save</button>
          </div>
        `;
      }

      const starsHtml = [1, 2, 3, 4, 5].map(n =>
        `<button type="button" class="med-star-btn ${m.rating >= n ? "on" : ""}" onclick="window.hhMedia.setRating(${item.id}, ${n})">⭐</button>`
      ).join("");

      const doneLabel = m.watched
        ? "↺ Move to Active"
        : (m.type === "games" ? "✓ Played" : "✓ Watched");

      bodyControls += `
        <div class="med-foot">
          <div class="med-stars">${starsHtml}</div>
          <button type="button" class="med-done-btn ${m.watched ? "undo" : ""}" onclick="window.hhMedia.toggleWatched(${item.id})">${doneLabel}</button>
        </div>
      `;
    }

    return `
      <div class="med-card ${isPicked ? "picked" : ""} ${m.watched ? "watched-card" : ""}" id="med-card-${item.id}">
        <div class="med-head" onclick="window.hhMedia.toggleCard(${item.id})">
          <div class="med-head-left">
            <span class="med-chev" style="transform: ${isExp ? "rotate(180deg)" : "rotate(0deg)"};">▼</span>
            <div class="med-title-col">
              <div class="med-title">${esc(item.title)}</div>
              <div class="med-sub-row">${badges}</div>
            </div>
          </div>
          <div class="med-head-right">
            <button type="button" class="med-del" onclick="window.hhMedia.deleteItem(event, ${item.id})">✕</button>
          </div>
        </div>
        ${isExp ? `<div class="med-body">${bodyControls}</div>` : ""}
      </div>
    `;
  }

  function renderMedia() {
    const container = document.getElementById("med-list-container");
    const countPill = document.getElementById("med-count-pill");
    const inp = document.getElementById("med-new-title");
    const rndBtn = document.getElementById("med-random-btn");
    if (!container) return;

    const phMap = { series: "Add series title...", movies: "Add movie title...", games: "Add board or video game..." };
    const rndMap = { series: "🎲 Pick Random Series", movies: "🎲 Pick Random Movie", games: "🎲 Pick Random Game" };
    if (inp) inp.placeholder = phMap[activeTab];
    if (rndBtn) rndBtn.textContent = rndMap[activeTab];

    const inTab = mediaItems.filter(i => i.meta.type === activeTab);
    const active = inTab.filter(i => !i.meta.watched);
    const watched = inTab.filter(i => i.meta.watched);

    if (countPill) countPill.textContent = `${active.length} active`;

    let html = "";
    if (active.length === 0) {
      html += `<div style="text-align:center; padding:30px 16px; color:#64748B; font-size:14px;">Nothing in this list yet</div>`;
    } else {
      html += active.map(buildCardHtml).join("");
    }

    if (watched.length > 0) {
      const doneWord = activeTab === "games" ? "Played" : "Watched";
      html += `
        <button type="button" class="med-watched-toggle" onclick="window.hhMedia.toggleWatchedList()">
          <span>✓ ${doneWord} (${watched.length})</span>
          <span>${showWatched ? "▲ Hide" : "▼ Show"}</span>
        </button>
      `;
      if (showWatched) {
        html += watched.map(buildCardHtml).join("");
      }
    }

    container.innerHTML = html;
  }

  window.hhMedia = {
    setTab: function (tab) {
      activeTab = tab;
      randomPickId = null;
      ["series", "movies", "games"].forEach(t => {
        const el = document.getElementById(`tab-med-${t}`);
        if (el) el.classList.toggle("active", t === tab);
      });
      renderMedia();
    },
    addItem: async function () {
      const inp = document.getElementById("med-new-title");
      const title = inp ? inp.value.trim() : "";
      if (!title) return;
      const meta = {
        type: activeTab,
        season: 1,
        episode: 1,
        time: "",
        note: "",
        added_by: getActorName(),
        watched: false,
        rating: 0
      };
      inp.value = "";
      try {
        await fetch(`${API_BASE}/api/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `${MEDIA_PREFIX} ${title}`, is_shared: true, content: JSON.stringify(meta) })
        });
        await fetchMedia();
      } catch (e) {
        alert("Failed to add: " + e.message);
      }
    },
    toggleCard: function (id) {
      expandedMedia[id] = !expandedMedia[id];
      renderMedia();
    },
    step: function (id, field, delta) {
      const item = mediaItems.find(i => i.id === id);
      if (!item) return;
      if (field === "season") {
        const next = Math.max(1, item.meta.season + delta);
        if (next !== item.meta.season) {
          item.meta.season = next;
          if (delta > 0) {
            item.meta.episode = 1;
            item.meta.time = "";
          }
        }
      } else if (field === "episode") {
        const next = Math.max(1, item.meta.episode + delta);
        if (next !== item.meta.episode) {
          item.meta.episode = next;
          if (delta > 0) item.meta.time = "";
        }
      }
      saveMeta(item);
    },
    saveTime: function (id) {
      const item = mediaItems.find(i => i.id === id);
      const inp = document.getElementById(`med-time-${id}`);
      if (!item || !inp) return;
      item.meta.time = inp.value.trim();
      saveMeta(item);
    },
    saveNote: function (id) {
      const item = mediaItems.find(i => i.id === id);
      const inp = document.getElementById(`med-note-${id}`);
      if (!item || !inp) return;
      item.meta.note = inp.value.trim();
      saveMeta(item);
    },
    setRating: function (id, stars) {
      const item = mediaItems.find(i => i.id === id);
      if (!item) return;
      item.meta.rating = item.meta.rating === stars ? 0 : stars;
      saveMeta(item);
    },
    toggleWatched: function (id) {
      const item = mediaItems.find(i => i.id === id);
      if (!item) return;
      item.meta.watched = !item.meta.watched;
      if (item.meta.watched) {
        item.meta.time = "";
        expandedMedia[id] = false;
      }
      saveMeta(item);
    },
    toggleWatchedList: function () {
      showWatched = !showWatched;
      renderMedia();
    },
    deleteItem: async function (e, id) {
      e.stopPropagation();
      if (!confirm("Delete this item?")) return;
      try {
        await fetch(`${API_BASE}/api/notes/${id}`, { method: "DELETE" });
        await fetchMedia();
      } catch (err) {}
    },
    pickRandom: function () {
      if (isSpinning) return;
      const active = mediaItems.filter(i => i.meta.type === activeTab && !i.meta.watched);
      if (active.length === 0) { alert("No active items to pick from."); return; }
      if (active.length === 1) {
        randomPickId = active[0].id;
        expandedMedia[active[0].id] = true;
        renderMedia();
        return;
      }

      isSpinning = true;
      let ticks = 0;
      const timer = setInterval(() => {
        const rnd = active[Math.floor(Math.random() * active.length)];
        randomPickId = rnd.id;
        renderMedia();
        ticks++;
        if (ticks >= 8) {
          clearInterval(timer);
          isSpinning = false;
          expandedMedia[randomPickId] = true;
          renderMedia();
          const el = document.getElementById(`med-card-${randomPickId}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 85);
    }
  };

  function hookOpenScreen() {
    if (typeof window.openScreen === "function" && !window.openScreen._hhMediaWrapped) {
      const origOpen = window.openScreen;
      window.openScreen = function (screenId, devTitle) {
        origOpen(screenId, devTitle);
        if (screenId === "screen-media") {
          fetchMedia();
        }
      };
      window.openScreen._hhMediaWrapped = true;
    }
  }

  injectStyles();
  injectDom();
  hookOpenScreen();
})();
