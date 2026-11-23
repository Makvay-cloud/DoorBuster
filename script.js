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
