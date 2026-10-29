const API_BASE = "https://uplifting-fled-squiggly.ngrok-free.dev";
const WISH_PREFIX = "[WISH]";

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const currentUserId = tg.initDataUnsafe?.user?.id || 547418372;
const userName = tg.initDataUnsafe?.user?.first_name || "User";
document.getElementById("user-greeting").textContent = `Hello, ${userName}!`;

let allData = [];

function openScreen(screenId, devTitle = "") {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  if (screenId === 'screen-dev') document.getElementById('dev-title').textContent = devTitle;
  if (screenId === 'screen-notes' || screenId === 'screen-wishlist') fetchAllData();
}

async function fetchAllData() {
  try {
    const res = await fetch(`${API_BASE}/api/notes`, { 
      headers: { "x-user-id": currentUserId, "ngrok-skip-browser-warning": "true" } 
    });
    if (!res.ok) throw new Error();
    allData = await res.json();
    
    // Call render functions from other modules
    if (typeof renderNotes === "function") renderNotes();
    if (typeof renderWishes === "function") renderWishes();
  } catch (err) { 
    alert("Connection error! Make sure the server and tunnel are running.");
  }
}

async function deleteItem(e, id) {
  e.stopPropagation();
  if (!confirm("Delete this?")) return;
  try {
    await fetch(`${API_BASE}/api/notes/${id}`, {
      method: "DELETE", headers: { "x-user-id": currentUserId, "ngrok-skip-browser-warning": "true" }
    });
    fetchAllData();
  } catch (err) {}
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}
