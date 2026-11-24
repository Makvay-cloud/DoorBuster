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


// DoorBuster Trades: visual pickers, accept/reject and chat.
const tradeForm=document.getElementById('tradeForm');
const tradeList=document.getElementById('tradeList');
const tradeEmpty=document.getElementById('tradeEmpty');
const tradeCount=document.getElementById('tradeCount');
const tradeSearch=document.getElementById('tradeSearch');
const tradeGive=document.getElementById('tradeGive');
const tradeWant=document.getElementById('tradeWant');
const achievementCatalog=[...document.querySelectorAll('.achievement-card')].map((card,i)=>({
 id:`achievement-${i}`,name:card.querySelector('h3')?.textContent.trim()||`Ачивка ${i+1}`,
 kind:'achievements',card
}));
const itemCatalog=[
 ['Crucifix','✝'],['Skeleton Key','🗝️'],['Vitamins','💊'],['Flashlight','🔦'],
 ['Lighter','🔥'],['Lockpick','🔑'],['Bandage','🩹'],['Candle','🕯️'],
 ['Battery','🔋'],['Shakelight','🔦'],['Alarm Clock','⏰'],['Candy','🍬'],
 ['Glowstick','🟢'],['Spray','🧴'],['Shears','✂️'],['Holy Hand Grenade','💥']
].map(([name,icon],i)=>({id:`item-${i}`,name,icon,kind:'items'}));
const catalog=new Map([...achievementCatalog,...itemCatalog].map(x=>[`${x.kind}:${x.name}`,x]));
const picker={give:{kind:'items',selected:''},want:{kind:'items',selected:''}};
const store={
 offers:'doorbuster_trade_offers_v3', rejected:'doorbuster_rejected_v3',
 accepted:'doorbuster_accepted_v1', chats:'doorbuster_chats_v3'
};
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
let offers=read(store.offers,[]), rejected=read(store.rejected,[]), accepted=read(store.accepted,[]), chats=read(store.chats,{});
let activeTrade=null;
function renderPicker(which){
 const state=picker[which],root=document.querySelector(`[data-picker="${which}"]`),grid=root.querySelector('.trade-picker-grid');
 grid.replaceChildren();
 root.querySelectorAll('.picker-tab').forEach(b=>{b.classList.toggle('active',b.dataset.kind===state.kind);b.setAttribute('aria-pressed',String(b.dataset.kind===state.kind));});
 const entries=state.kind==='items'?itemCatalog:achievementCatalog;
 entries.forEach(entry=>{
  const btn=document.createElement('button');btn.type='button';btn.className='trade-pick-tile'+(state.selected===entry.name?' selected':'');
  btn.setAttribute('aria-pressed',String(state.selected===entry.name));
  const pic=document.createElement('span');pic.className='trade-pick-picture';
  if(entry.kind==='items'){pic.classList.add('item-picture');pic.textContent=entry.icon;}
  else{
   const source=entry.card.querySelector('.card-image');
   if(source){const clone=source.cloneNode(true);clone.classList.add('picker-achievement-image');clone.querySelectorAll('.badge-loading').forEach(n=>n.remove());pic.append(clone);}
   else pic.textContent='✦';
  }
  const label=document.createElement('span');label.className='trade-pick-name';label.textContent=entry.name;
  btn.append(pic,label);
  btn.addEventListener('click',()=>{state.selected=entry.name;(which==='give'?tradeGive:tradeWant).value=entry.name;renderPicker(which);});
  grid.append(btn);
 });
 const hidden=which==='give'?tradeGive:tradeWant;
 if(!entries.some(e=>e.name===state.selected)) {state.selected='';hidden.value='';}
}
document.querySelectorAll('.trade-picker').forEach(root=>{
 const which=root.dataset.picker;
 root.querySelectorAll('.picker-tab').forEach(btn=>btn.addEventListener('click',()=>{
  picker[which].kind=btn.dataset.kind;picker[which].selected='';
  (which==='give'?tradeGive:tradeWant).value='';renderPicker(which);
 }));
 renderPicker(which);
});
const badgeObserver=new MutationObserver(()=>{renderPicker('give');renderPicker('want');});
document.querySelectorAll('.achievement-card .card-image').forEach(n=>badgeObserver.observe(n,{childList:true,subtree:true}));
function visual(kind,name){
 const wrap=document.createElement('div');wrap.className='trade-item-visual';
 const entry=catalog.get(`${kind||'achievements'}:${name}`);
 if(entry?.kind==='items'){wrap.classList.add('item-picture');wrap.textContent=entry.icon;}
 else if(entry?.card){const node=entry.card.querySelector('.card-image')?.cloneNode(true);if(node){node.querySelectorAll('.badge-loading').forEach(x=>x.remove());wrap.append(node);}else wrap.textContent='✦';}
 else wrap.textContent='?';
 return wrap;
}
function renderTrades(){
 const q=(tradeSearch.value||'').trim().toLocaleLowerCase('ru');
 const visible=offers.filter(t=>!rejected.includes(t.id)&&`${t.user} ${t.give} ${t.want}`.toLocaleLowerCase('ru').includes(q));
 tradeList.replaceChildren();
 visible.forEach(t=>{
  const card=document.createElement('article');card.className='trade-card';
  const info=document.createElement('div'),user=document.createElement('div');user.className='trade-user';user.textContent=`ROBLOX: ${t.user}`;
  const exchange=document.createElement('div');exchange.className='trade-exchange';
  const side=(label,name,kind)=>{const box=document.createElement('div');box.className='trade-item-block';box.append(visual(kind,name));const small=document.createElement('span');small.textContent=label;const strong=document.createElement('strong');strong.textContent=name;box.append(small,strong);return box;};
  const arrow=document.createElement('span');arrow.className='trade-arrow';arrow.textContent='⇄';
  exchange.append(side('ПРЕДЛАГАЕТ',t.give,t.giveKind),arrow,side('ХОЧЕТ',t.want,t.wantKind));info.append(user,exchange);
  const actions=document.createElement('div');actions.className='trade-actions';
  const accept=document.createElement('button');accept.className='trade-accept';accept.textContent=accepted.includes(t.id)?'ПРИНЯТО ✓':'ПРИНЯТЬ';accept.addEventListener('click',()=>acceptTrade(t));
  const chat=document.createElement('button');chat.className='trade-contact';chat.textContent='ЧАТ';chat.addEventListener('click',()=>openChat(t));
  const reject=document.createElement('button');reject.className='trade-reject';reject.textContent='ОТКЛОНИТЬ';reject.addEventListener('click',()=>rejectTrade(t.id));
  actions.append(accept,chat,reject);card.append(info,actions);tradeList.append(card);
 });
 tradeCount.textContent=String(visible.length).padStart(2,'0');tradeEmpty.hidden=visible.length!==0;
}
tradeForm.addEventListener('submit',e=>{
 e.preventDefault();const user=document.getElementById('tradeUser').value.trim();
 if(!user||!tradeGive.value||!tradeWant.value)return;
 offers.unshift({id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,user,give:tradeGive.value,want:tradeWant.value,giveKind:picker.give.kind,wantKind:picker.want.kind,createdAt:Date.now()});
 save(store.offers,offers);tradeForm.reset();
 ['give','want'].forEach(k=>{picker[k].kind='items';picker[k].selected='';renderPicker(k);});renderTrades();
});
tradeSearch.addEventListener('input',renderTrades);
const chatDialog=document.getElementById('tradeChatDialog'),chatTitle=document.getElementById('tradeChatTitle'),chatMessages=document.getElementById('tradeChatMessages');
function renderChat(){
 chatMessages.replaceChildren();const list=chats[activeTrade]||[];
 if(!list.length){const p=document.createElement('p');p.className='trade-chat-empty';p.textContent='Пока нет сообщений. Начни обсуждение!';chatMessages.append(p);}
 list.forEach(m=>{const b=document.createElement('div');b.className='trade-chat-message';const a=document.createElement('b');a.textContent=m.name;const p=document.createElement('p');p.textContent=m.text;b.append(a,p);chatMessages.append(b);});
 chatMessages.scrollTop=chatMessages.scrollHeight;
}
function openChat(t){activeTrade=t.id;chatTitle.textContent=`Трейд с ${t.user}`;renderChat();chatDialog.showModal();}
function acceptTrade(t){if(!accepted.includes(t.id)){accepted.push(t.id);save(store.accepted,accepted);}renderTrades();openChat(t);}
document.getElementById('tradeChatForm').addEventListener('submit',e=>{
 e.preventDefault();if(!activeTrade)return;const name=document.getElementById('tradeChatName').value.trim(),message=document.getElementById('tradeChatInput').value.trim();if(!name||!message)return;
 (chats[activeTrade]??=[]).push({name,text:message,createdAt:Date.now()});save(store.chats,chats);document.getElementById('tradeChatInput').value='';renderChat();
});
function rejectTrade(id){if(!rejected.includes(id)){rejected.push(id);save(store.rejected,rejected);}renderTrades();if(activeTrade===id)chatDialog.close();}
document.getElementById('acceptTradeButton').addEventListener('click',()=>{const t=offers.find(x=>x.id===activeTrade);if(t)acceptTrade(t);});
document.getElementById('rejectTradeButton').addEventListener('click',()=>{if(activeTrade)rejectTrade(activeTrade);});
document.querySelector('.trade-chat-close').addEventListener('click',()=>chatDialog.close());
chatDialog.addEventListener('click',e=>{if(e.target===chatDialog)chatDialog.close();});
renderTrades();
