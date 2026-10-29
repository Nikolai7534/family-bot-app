JavaScript
let isWishShared = true;

function setWishTab(shared) {
  isWishShared = shared;
  document.getElementById("tab-wish-shared").classList.toggle("active", shared);
  document.getElementById("tab-wish-personal").classList.toggle("active", !shared);
  renderWishes();
}

function renderWishes() {
  const container = document.getElementById("wishlist-container");
  if (!container) return;
  container.innerHTML = "";
  
  const wishes = allData.filter(n => n.is_shared === isWishShared && n.title.startsWith(WISH_PREFIX));
  
  if (wishes.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 40px; color: #64748B;">No wishes yet</div>`;
    return;
  }

  wishes.forEach(wish => {
    const card = document.createElement("div");
    card.className = "wish-card";
    const realTitle = wish.title.replace(WISH_PREFIX, "").trim();
    let details = { price: "", url: "" };
    try { details = JSON.parse(wish.content); } catch(e) {}
    
    let linkHtml = details.url ? `<button class="link-btn" onclick="openLinkSafely(event, '${details.url}')">Open Link</button>` : '';

    card.innerHTML = `
      <div class="wish-info">
        <div class="wish-name">${escapeHtml(realTitle)}</div>
        <div class="wish-price">${escapeHtml(details.price)}</div>
      </div>
      <div class="wish-actions">
        ${linkHtml}
        <button class="del-btn" onclick="deleteItem(event, ${wish.id})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function createWish() {
  const nameInput = document.getElementById("wish-name");
  const priceInput = document.getElementById("wish-price");
  const urlInput = document.getElementById("wish-url");
  
  const name = nameInput.value.trim();
  if (!name) return;
  
  let url = urlInput.value.trim();
  if (url && !url.startsWith('http')) url = 'https://' + url;

  const title = `${WISH_PREFIX} ${name}`;
  const content = JSON.stringify({ price: priceInput.value.trim(), url: url });

  try {
    await fetch(`${API_BASE}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": currentUserId, "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ title: title, is_shared: isWishShared, content: content })
    });
    nameInput.value = ""; priceInput.value = ""; urlInput.value = "";
    fetchAllData(); 
  } catch (err) {}
}

function openLinkSafely(e, url) {
  e.stopPropagation();
  try {
    if (tg && tg.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  } catch (err) {
    window.open(url, '_blank');
  }
}
