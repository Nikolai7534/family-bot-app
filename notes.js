let isNotesShared = true;
let expandedNotes = {}; 

function setNotesTab(shared) {
  isNotesShared = shared;
  document.getElementById("tab-notes-shared").classList.toggle("active", shared);
  document.getElementById("tab-notes-personal").classList.toggle("active", !shared);
  renderNotes();
}

function toggleAccordion(noteId) {
  expandedNotes[noteId] = !expandedNotes[noteId];
  const body = document.getElementById(`note-body-${noteId}`);
  const chevron = document.getElementById(`chevron-${noteId}`);
  
  if (expandedNotes[noteId]) {
    body.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    body.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function parseJSON(raw) {
  try { return JSON.parse(raw) || []; } catch(e) { return []; }
}

function renderNotes() {
  const container = document.getElementById("notes-container");
  if (!container) return;
  container.innerHTML = "";
  
  const notes = allData.filter(n => n.is_shared === isNotesShared && !n.title.startsWith(WISH_PREFIX));
  
  if (notes.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: #64748B;">List is empty</div>`;
    return;
  }

  notes.forEach(note => {
    const card = document.createElement("div");
    card.className = "card";
    const items = parseJSON(note.content);
    
    const isExpanded = expandedNotes[note.id] === true;
    const displayStyle = isExpanded ? 'block' : 'none';
    const chevronTransform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';

    let itemsHtml = items.map((item, idx) => `
      <div class="list-item ${item.done ? 'done' : ''}" onclick="toggleNoteItem(${note.id}, ${idx})">
        <div class="checkbox"></div>
        <div class="item-text">${escapeHtml(item.text)}</div>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="card-header" onclick="toggleAccordion(${note.id})">
        <div class="card-title-group">
          <span class="chevron" id="chevron-${note.id}" style="transform: ${chevronTransform};">▼</span>
          <span class="card-title">${escapeHtml(note.title)}</span>
        </div>
        <button class="del-btn" onclick="deleteItem(event, ${note.id})">Delete</button>
      </div>
      <div class="card-body" id="note-body-${note.id}" style="display: ${displayStyle};">
        <div class="items-container">${itemsHtml}</div>
        <div class="add-item-box">
          <input type="text" id="add-input-${note.id}" placeholder="Add sub-item..." onkeypress="handleEnter(event, ${note.id})">
          <button class="add-btn" onclick="addNoteItem(${note.id})">+</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function createTopic() {
  const input = document.getElementById("new-topic");
  const title = input.value.trim();
  if (!title) return;
  try {
    await fetch(`${API_BASE}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": currentUserId, "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ title: title, is_shared: isNotesShared, content: "[]" })
    });
    input.value = ""; 
    fetchAllData(); 
  } catch (err) {}
}

async function toggleNoteItem(noteId, itemIdx) {
  const note = allData.find(n => n.id === noteId);
  const items = parseJSON(note.content);
  items[itemIdx].done = !items[itemIdx].done;
  await saveContent(noteId, items);
}

async function addNoteItem(noteId) {
  const input = document.getElementById(`add-input-${noteId}`);
  const text = input.value.trim();
  if (!text) return;
  const note = allData.find(n => n.id === noteId);
  const items = parseJSON(note.content);
  items.push({ text: text, done: false });
  input.value = '';
  await saveContent(noteId, items);
}

function handleEnter(e, noteId) {
  if (e.key === 'Enter') addNoteItem(noteId);
}

async function saveContent(noteId, itemsObj) {
  const note = allData.find(n => n.id === noteId);
  note.content = JSON.stringify(itemsObj);
  renderNotes();
  try {
    await fetch(`${API_BASE}/api/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": currentUserId, "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ content: note.content })
    });
  } catch(e) {}
}
