const searchInput = document.getElementById("searchInput");
const tabs = [...document.querySelectorAll(".tab")];
const cards = [...document.querySelectorAll(".achievement-card")];
const count = document.getElementById("resultCount");
const empty = document.getElementById("emptyState");
let activeFilter = "all";

function filterCards() {
  const query = searchInput.value.trim().toLocaleLowerCase("ru");
  let visible = 0;
  cards.forEach(card => {
    const categoryMatch = activeFilter === "all" || card.dataset.category === activeFilter;
    const searchMatch = (card.dataset.search + " " + card.innerText).toLocaleLowerCase("ru").includes(query);
    const show = categoryMatch && searchMatch;
    card.hidden = !show;
    if (show) visible++;
  });
  count.textContent = String(visible).padStart(2, "0");
  empty.hidden = visible !== 0;
}

tabs.forEach(tab => tab.addEventListener("click", () => {
  activeFilter = tab.dataset.filter;
  tabs.forEach(item => {
    const selected = item === tab;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  filterCards();
}));
searchInput.addEventListener("input", filterCards);

const dialog = document.getElementById("detailsDialog");
const dialogTitle = document.getElementById("dialogTitle");
document.querySelectorAll(".details-button").forEach(button => button.addEventListener("click", () => {
  dialogTitle.textContent = button.dataset.name;
  dialog.showModal();
}));
document.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
document.querySelector(".dialog-ok").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
});
filterCards();


// Fetch official badge icons from Roblox using their badge IDs.
(async function loadOfficialBadgeIcons() {
  const nodes = [...document.querySelectorAll('.badge-image[data-badge-id]')];
  await Promise.all(nodes.map(async node => {
    const id = node.dataset.badgeId;
    try {
      const response = await fetch(`https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${encodeURIComponent(id)}&size=150x150&format=Png&isCircular=false`);
      if (!response.ok) throw new Error('Thumbnail request failed');
      const result = await response.json();
      const imageUrl = result?.data?.[0]?.imageUrl;
      if (!imageUrl) throw new Error('No image returned');
      const image = document.createElement('img');
      image.src = imageUrl; image.alt = 'Оригинальный значок DOORS'; image.loading = 'lazy';
      node.replaceChildren(image);
    } catch (error) {
      node.innerHTML = '<span class="badge-loading">Значок временно недоступен</span>';
      console.warn('Roblox badge icon unavailable:', id, error);
    }
  }));
})();


// Main navigation: achievements / trades
const achievementsTab = document.getElementById('achievementsTab');
const tradesTab = document.getElementById('tradesTab');
const shopSection = document.getElementById('shop');
const tradesSection = document.getElementById('trades');
function switchMainView(view) {
  const isTrades = view === 'trades';
  shopSection.querySelector('.section-top').hidden = isTrades;
  shopSection.querySelector('.shop-tools').hidden = isTrades;
  document.getElementById('achievementGrid').hidden = isTrades;
  document.getElementById('emptyState').hidden = true;
  shopSection.querySelector('.catalog-note').hidden = isTrades;
  tradesSection.hidden = !isTrades;
  achievementsTab.classList.toggle('active', !isTrades);
  tradesTab.classList.toggle('active', isTrades);
  achievementsTab.setAttribute('aria-selected', String(!isTrades));
  tradesTab.setAttribute('aria-selected', String(isTrades));
  document.querySelectorAll('[data-main-nav]').forEach(link => {
    link.classList.toggle('current', link.dataset.mainNav === view);
  });
}
achievementsTab.addEventListener('click', () => switchMainView('achievements'));
tradesTab.addEventListener('click', () => switchMainView('trades'));
document.querySelectorAll('[data-main-nav="trades"]').forEach(link => link.addEventListener('click', () => switchMainView('trades')));
document.querySelectorAll('[data-main-nav="achievements"]').forEach(link => link.addEventListener('click', () => switchMainView('achievements')));
if (location.hash === '#trades') switchMainView('trades');

// Trade board demo: offers are stored in this browser only.
// A secure backend is required before users on different devices can see/contact one another.
const tradeForm = document.getElementById('tradeForm');
const tradeList = document.getElementById('tradeList');
const tradeEmpty = document.getElementById('tradeEmpty');
const tradeCount = document.getElementById('tradeCount');
const tradeSearch = document.getElementById('tradeSearch');
const tradeStorageKey = 'doorbuster_trade_offers_v1';
let tradeOffers = [];
try { tradeOffers = JSON.parse(localStorage.getItem(tradeStorageKey) || '[]'); } catch { tradeOffers = []; }
function renderTrades() {
  const query = (tradeSearch?.value || '').trim().toLocaleLowerCase('ru');
  const visibleOffers = tradeOffers.filter(item => `${item.user} ${item.give} ${item.want} ${item.target}`.toLocaleLowerCase('ru').includes(query));
  tradeList.replaceChildren();
  visibleOffers.forEach(item => {
    const card = document.createElement('article');
    card.className = 'trade-card';
    const info = document.createElement('div');
    const user = document.createElement('div'); user.className = 'trade-user'; user.textContent = `ROBLOX: ${item.user}`;
    const title = document.createElement('h4'); title.textContent = item.give;
    const give = document.createElement('p'); give.innerHTML = '<strong>Предлагает:</strong> ';
    give.append(document.createTextNode(item.give));
    const want = document.createElement('p'); want.innerHTML = '<strong>Хочет:</strong> ';
    want.append(document.createTextNode(item.want));
    const target = document.createElement('span'); target.className = 'trade-target'; target.textContent = item.target === 'seller' ? 'ДЛЯ DOORBUSTER' : 'ДЛЯ ВСЕХ';
    info.append(user, title, give, want, target);
    const contact = document.createElement('button'); contact.className = 'trade-contact'; contact.textContent = 'ОБСУДИТЬ';
    contact.addEventListener('click', () => {
      dialogTitle.textContent = `Трейд с ${item.user}`;
      dialog.querySelector('.eyebrow').textContent = 'ОБСУЖДЕНИЕ ОБМЕНА';
      dialog.querySelector('p').textContent = 'Связь между разными посетителями пока не подключена. Сейчас это демонстрация интерфейса; для настоящих личных чатов понадобится защищённый сервер и авторизация.';
      dialog.showModal();
    });
    card.append(info, contact);
    tradeList.append(card);
  });
  tradeCount.textContent = String(visibleOffers.length).padStart(2, '0');
  tradeEmpty.hidden = visibleOffers.length !== 0;
}
tradeForm.addEventListener('submit', event => {
  event.preventDefault();
  const offer = {
    user: document.getElementById('tradeUser').value.trim(),
    give: document.getElementById('tradeGive').value.trim(),
    want: document.getElementById('tradeWant').value.trim(),
    target: document.getElementById('tradeTarget').value,
    createdAt: Date.now()
  };
  if (!offer.user || !offer.give || !offer.want) return;
  tradeOffers.unshift(offer);
  try { localStorage.setItem(tradeStorageKey, JSON.stringify(tradeOffers)); } catch {}
  tradeForm.reset();
  renderTrades();
});
tradeSearch.addEventListener('input', renderTrades);
renderTrades();
