(function () {
  const SETTINGS_TITLE = "[UI_SETTINGS]";
  const STORAGE_PREFIX = "hh_ui_settings_v1_";

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
    { id: "tastings", label: "Tastings", icon: "🥃", screen: "screen-tastings", color: "bronze",  size: "1x1", visible: true }
  ];

  let uiSettings = null;
  let settingsNoteId = null;
  let openColorPickerId = null;
  let liveCache = { notes: [], shopping: [], calendar: [] };
  let quickModalType = null;
  let quickTaskOwner = "Nikolai";
  let quickNoteShared = true;

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

  function getColorObj(id) {
    return UI_COLORS.find(c => c.id === id) || UI_COLORS[0];
  }

  function getDefaultSettings() {
    return {
      version: 1,
      mode: "classic",
      hideFinance: false,
      modules: DEFAULT_MODULES.map(m => ({ ...m }))
    };
  }

  function normalizeSettings(raw) {
    const base = getDefaultSettings();
    if (!raw || typeof raw !== "object") return base;
    const mode = raw.mode === "bento" ? "bento" : "classic";
    const hideFinance = !!raw.hideFinance;
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

    return { version: 1, mode, hideFinance, modules: merged };
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

  function injectStyles() {
    if (document.getElementById("hh-dash-styles")) return;
    const style = document.createElement("style");
    style.id = "hh-dash-styles";
    style.textContent = `
      .hh-top-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 5; }
      .hh-icon-pill { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: rgba(11, 17, 32, 0.42); color: #fff; font-size: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(6px); transition: 0.15s; }
      .hh-icon-pill:active { transform: scale(0.92); }
      .welcome-card .logout-pill { display: none !important; }

      /* BENTO HEADER & GRID */
      .bento-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 2px 16px 2px; }
      .bento-date { font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: capitalize; margin-bottom: 2px; }
      .bento-greet { font-size: 24px; font-weight: 800; color: #F8FAFC; margin: 0; letter-spacing: -0.3px; }
      .bento-hdr-btns { display: flex; gap: 8px; }
      .bento-hdr-btn { width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #E2E8F0; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      .bento-hdr-btn:active { transform: scale(0.92); }

      .bento-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-flow: dense; gap: 11px; padding-bottom: 18px; }
      .bento-card { background: rgba(19, 28, 49, 0.92); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 14px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 116px; transition: 0.15s; position: relative; overflow: hidden; }
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
      .set-mode-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
      .set-mode-card { background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 10px; text-align: center; cursor: pointer; transition: 0.15s; }
      .set-mode-card.active { background: rgba(37, 99, 235, 0.22); border-color: #60A5FA; }
      .set-mode-ico { font-size: 26px; margin-bottom: 6px; }
      .set-mode-name { font-size: 14px; font-weight: 800; color: #F8FAFC; }
      .set-mode-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; }

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
      .hh-qmodal-bg.open { display: flex; }
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
    const plainNotes = notes.filter(n =>
      !n.title.startsWith("[WISH") && !n.title.startsWith("[ORDER]") &&
      !n.title.startsWith("[TASK_") && !n.title.startsWith("[FIN]") &&
      !n.title.startsWith("[PLACE_") && !n.title.startsWith("[TASTE]") &&
      !n.title.startsWith("[SHOP_CHIPS]") && !n.title.startsWith(SETTINGS_TITLE)
    ).sort((a, b) => b.id - a.id);

    const activeCal = cal.filter(p => !p.is_done);
    const todayEvents = activeCal.filter(p => p.start_date <= todayIso && (p.end_date || p.start_date) >= todayIso);
    const futureEvents = activeCal.filter(p => p.start_date > todayIso).sort((a, b) => a.start_date.localeCompare(b.start_date));

    let calBadge = "Clear";
    let calPreview = "No upcoming events";
    if (todayEvents.length > 0) {
      const ev = todayEvents[0];
      calBadge = `Today (${todayEvents.length})`;
      calPreview = (ev.event_time ? `${ev.event_time} • ` : "") + ev.title;
    } else if (futureEvents.length > 0) {
      const ev = futureEvents[0];
      const parts = ev.start_date.split("-");
      calBadge = `${parts[2]}.${parts[1]}`;
      calPreview = (ev.event_time ? `${ev.event_time} • ` : "") + ev.title;
    }

    const finExp = computeMonthlyExpense(finNotes);

    return {
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
      }
    };
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
              <h2 class="bento-greet">Hello, ${esc(getUname())}!</h2>
            </div>
            <div class="bento-hdr-btns">
              <button type="button" class="bento-hdr-btn" title="Settings" onclick="window.hhDash.openSettings()">⚙️</button>
              <button type="button" class="bento-hdr-btn" title="Switch / Lock" onclick="openAuthLock()">🔒</button>
            </div>
          </div>
          <div class="bento-grid">${cardsHtml}</div>
        `;
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
        <div class="set-mode-sub">Live previews & quick +</div>
      </div>
    `;

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
      renderDashboard();
      if (document.getElementById("screen-settings")?.classList.contains("active")) {
        renderSettingsScreen();
      }
    } catch (e) {}
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
    },
    toggleFinanceHide: function () {
      uiSettings.hideFinance = !uiSettings.hideFinance;
      renderDashboard();
      saveDbSettings();
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
      setTimeout(() => inp.focus(), 60);
    },
    closeQuickModal: function () {
      quickModalType = null;
      document.getElementById("hh-quick-modal").classList.remove("open");
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

  function hookAppLifecycle() {
    if (typeof window.openScreen === "function" && !window.openScreen._hhWrapped) {
      const origOpen = window.openScreen;
      window.openScreen = function (screenId, devTitle) {
        origOpen(screenId, devTitle);
        if (screenId === "screen-dashboard") {
          renderDashboard();
          syncFromServer();
        }
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
          uiSettings = loadLocalSettings();
          renderDashboard();
          syncFromServer();
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
})();
