const SCREENS = {
  home: document.getElementById("screen-home"),
  categories: document.getElementById("screen-categories"),
};

const btnStart = document.getElementById("btnStart");
const btnBackHome = document.getElementById("btnBackHome");
const btnGoSetup = document.getElementById("btnGoSetup");

const categoriesGrid = document.getElementById("categoriesGrid");
const selectedChips = document.getElementById("selectedChips");
const selectedCount = document.getElementById("selectedCount");

const MIN_CATS = 3;
const MAX_CATS = 6;

const CATEGORIES = [
  { id: "general", title: "أسئلة عامة", icon: "🧠" },
  { id: "math", title: "رياضيات", icon: "➗" },
  { id: "sports", title: "كرة", icon: "⚽️" },
  { id: "letters", title: "حروف", icon: "🔤" },
  { id: "religion", title: "قصص الأنبياء", icon: "📖" },
  { id: "geo", title: "جغرافيا", icon: "🗺️" },
  { id: "history", title: "تاريخ", icon: "🏺" },
  { id: "tech", title: "تقنية", icon: "💻" },
];

let selected = new Set();

function showScreen(name){
  Object.values(SCREENS).forEach(s => s.classList.remove("active"));
  SCREENS[name].classList.add("active");
}

function renderCategories(){
  categoriesGrid.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const el = document.createElement("div");
    el.className = "cat" + (selected.has(cat.id) ? " selected" : "");
    el.dataset.id = cat.id;
    el.innerHTML = `
      <div class="title">${cat.title}</div>
      <div class="icon">${cat.icon}</div>
    `;
    el.addEventListener("click", () => toggleCategory(cat.id));
    categoriesGrid.appendChild(el);
  });
}

function renderChips(){
  selectedChips.innerHTML = "";
  [...selected].forEach(id => {
    const cat = CATEGORIES.find(c => c.id === id);
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${cat.icon} ${cat.title}</span>
      <button title="حذف">✕</button>
    `;
    chip.querySelector("button").addEventListener("click", () => toggleCategory(id));
    selectedChips.appendChild(chip);
  });

  selectedCount.textContent = `${selected.size} / ${MAX_CATS}`;

  const ok = selected.size >= MIN_CATS && selected.size <= MAX_CATS;
  btnGoSetup.disabled = !ok;
}

function toggleCategory(id){
  if (selected.has(id)) {
    selected.delete(id);
  } else {
    if (selected.size >= MAX_CATS) return; // ما نسمح أكثر من 6
    selected.add(id);
  }
  renderCategories();
  renderChips();
}

// أزرار التنقل
btnStart.addEventListener("click", () => {
  showScreen("categories");
  renderCategories();
  renderChips();
});

btnBackHome.addEventListener("click", () => showScreen("home"));

// الآن "يلا نكمل" بس يخزن الاختيارات (وبعدين نضيف شاشة الإعداد)
btnGoSetup.addEventListener("click", () => {
  const chosen = [...selected];
  localStorage.setItem("zahin_selected_categories", JSON.stringify(chosen));
  alert("تم حفظ الفئات ✅ الخطوة الجاية: إعداد الفرق ووسائل المساعدة");
});
