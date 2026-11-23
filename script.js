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
