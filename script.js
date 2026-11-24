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

// DoorBuster Trades: item picker, trade cards, per-trade chat and reject action.
// This front-end demo stores data in this browser only; cross-device trading needs a backend.
const tradeForm = document.getElementById('tradeForm');
const tradeList = document.getElementById('tradeList');
const tradeEmpty = document.getElementById('tradeEmpty');
const tradeCount = document.getElementById('tradeCount');
const tradeSearch = document.getElementById('tradeSearch');
const tradeGive = document.getElementById('tradeGive');
const tradeWant = document.getElementById('tradeWant');
const tradeStorageKey = 'doorbuster_trade_offers_v2';
const rejectedStorageKey = 'doorbuster_rejected_trades_v1';
const chatStorageKey = 'doorbuster_trade_chats_v1';
const itemCatalog = [...document.querySelectorAll('.achievement-card')].map((card, index) => ({
  id: card.dataset.search || `item-${index}`,
  name: card.querySelector('h3')?.textContent.trim() || `Предмет ${index + 1}`,
  imageHtml: card.querySelector('.card-image')?.innerHTML || ''
}));
const itemByName = new Map(itemCatalog.map(item => [item.name, item]));
function fillItemSelect(select) {
  itemCatalog.forEach(item => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.name;
    select.append(option);
  });
}
fillItemSelect(tradeGive);
fillItemSelect(tradeWant);

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
let tradeOffers = readStorage(tradeStorageKey, []);
let rejectedTrades = readStorage(rejectedStorageKey, []);
let tradeChats = readStorage(chatStorageKey, {});
let activeTradeId = null;

function saveTrades() {
  try { localStorage.setItem(tradeStorageKey, JSON.stringify(tradeOffers)); } catch {}
}
function itemVisual(name) {
  const item = itemByName.get(name);
  const visual = document.createElement('div');
  visual.className = 'trade-item-visual';
  if (item?.imageHtml) visual.innerHTML = item.imageHtml;
  else visual.textContent = 'DB';
  return visual;
}
function renderTrades() {
  const query = (tradeSearch?.value || '').trim().toLocaleLowerCase('ru');
  const visibleOffers = tradeOffers.filter(item =>
    !rejectedTrades.includes(item.id) &&
    `${item.user} ${item.give} ${item.want}`.toLocaleLowerCase('ru').includes(query)
  );
  tradeList.replaceChildren();
  visibleOffers.forEach(item => {
    const card = document.createElement('article');
    card.className = 'trade-card';
    const info = document.createElement('div');
    const user = document.createElement('div');
    user.className = 'trade-user';
    user.textContent = `ROBLOX: ${item.user}`;
    const exchange = document.createElement('div');
    exchange.className = 'trade-exchange';
    const giveBlock = document.createElement('div');
    giveBlock.className = 'trade-item-block';
    giveBlock.append(itemVisual(item.give));
    const giveLabel = document.createElement('span');
    giveLabel.innerHTML = '<b>ПРЕДЛАГАЕТ</b>';
    const giveName = document.createElement('strong');
    giveName.textContent = item.give;
    giveBlock.append(giveLabel, giveName);
    const arrow = document.createElement('span');
    arrow.className = 'trade-arrow';
    arrow.textContent = '⇄';
    const wantBlock = document.createElement('div');
    wantBlock.className = 'trade-item-block';
    wantBlock.append(itemVisual(item.want));
    const wantLabel = document.createElement('span');
    wantLabel.innerHTML = '<b>ХОЧЕТ</b>';
    const wantName = document.createElement('strong');
    wantName.textContent = item.want;
    wantBlock.append(wantLabel, wantName);
    exchange.append(giveBlock, arrow, wantBlock);
    info.append(user, exchange);
    const actions = document.createElement('div');
    actions.className = 'trade-actions';
    const discuss = document.createElement('button');
    discuss.className = 'trade-contact';
    discuss.textContent = 'ОБСУДИТЬ';
    discuss.addEventListener('click', () => openTradeChat(item));
    const reject = document.createElement('button');
    reject.className = 'trade-reject';
    reject.textContent = 'ОТКЛОНИТЬ';
    reject.addEventListener('click', () => rejectTrade(item.id));
    actions.append(discuss, reject);
    card.append(info, actions);
    tradeList.append(card);
  });
  tradeCount.textContent = String(visibleOffers.length).padStart(2, '0');
  tradeEmpty.hidden = visibleOffers.length !== 0;
}
tradeForm.addEventListener('submit', event => {
  event.preventDefault();
  const offer = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user: document.getElementById('tradeUser').value.trim(),
    give: tradeGive.value,
    want: tradeWant.value,
    createdAt: Date.now()
  };
  if (!offer.user || !offer.give || !offer.want) return;
  tradeOffers.unshift(offer);
  saveTrades();
  tradeForm.reset();
  renderTrades();
});
tradeSearch.addEventListener('input', renderTrades);

const tradeChatDialog = document.getElementById('tradeChatDialog');
const tradeChatTitle = document.getElementById('tradeChatTitle');
const tradeChatMessages = document.getElementById('tradeChatMessages');
const tradeChatForm = document.getElementById('tradeChatForm');
function renderChat() {
  tradeChatMessages.replaceChildren();
  const messages = tradeChats[activeTradeId] || [];
  if (!messages.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'trade-chat-empty';
    emptyMessage.textContent = 'Пока нет сообщений. Начни обсуждение!';
    tradeChatMessages.append(emptyMessage);
  }
  messages.forEach(message => {
    const bubble = document.createElement('div');
    bubble.className = 'trade-chat-message';
    const author = document.createElement('b');
    author.textContent = message.name;
    const body = document.createElement('p');
    body.textContent = message.text;
    bubble.append(author, body);
    tradeChatMessages.append(bubble);
  });
  tradeChatMessages.scrollTop = tradeChatMessages.scrollHeight;
}
function openTradeChat(item) {
  activeTradeId = item.id;
  tradeChatTitle.textContent = `Трейд с ${item.user}`;
  renderChat();
  tradeChatDialog.showModal();
}
tradeChatForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!activeTradeId) return;
  const name = document.getElementById('tradeChatName').value.trim();
  const text = document.getElementById('tradeChatInput').value.trim();
  if (!name || !text) return;
  if (!tradeChats[activeTradeId]) tradeChats[activeTradeId] = [];
  tradeChats[activeTradeId].push({ name, text, createdAt: Date.now() });
  try { localStorage.setItem(chatStorageKey, JSON.stringify(tradeChats)); } catch {}
  document.getElementById('tradeChatInput').value = '';
  renderChat();
});
function rejectTrade(id) {
  if (!rejectedTrades.includes(id)) rejectedTrades.push(id);
  try { localStorage.setItem(rejectedStorageKey, JSON.stringify(rejectedTrades)); } catch {}
  renderTrades();
  if (activeTradeId === id) tradeChatDialog.close();
}
document.getElementById('rejectTradeButton').addEventListener('click', () => {
  if (activeTradeId) rejectTrade(activeTradeId);
});
document.querySelector('.trade-chat-close').addEventListener('click', () => tradeChatDialog.close());
tradeChatDialog.addEventListener('click', event => {
  if (event.target === tradeChatDialog) tradeChatDialog.close();
});
renderTrades();
