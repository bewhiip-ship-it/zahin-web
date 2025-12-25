document.addEventListener("DOMContentLoaded", () => {
  // Screens
  const screenHome = document.getElementById("screen-home");
  const screenCategories = document.getElementById("screen-categories");
  const screenTeams = document.getElementById("screen-teams");

  // Buttons
  const startBtn = document.getElementById("startBtn");
  const backToHomeBtn = document.getElementById("backToHomeBtn");
  const continueBtn = document.getElementById("continueBtn");
  const backToCategoriesBtn = document.getElementById("backToCategoriesBtn");
  const startHostBtn = document.getElementById("startHostBtn");

  // Category UI
  const categoriesDiv = document.getElementById("categories");
  const selectedInfo = document.getElementById("selectedInfo");

  // Team inputs
  const team1Input = document.getElementById("team1Input");
  const team2Input = document.getElementById("team2Input");

  const MIN_CATS = 3;
  const MAX_CATS = 6;

  const categories = [
    { id: "islam", name: "إسلاميات" },
    { id: "prophets", name: "قصص الأنبياء" },
    { id: "letters", name: "حروف (معاني/مرادفات)" },
    { id: "football_who", name: "مين اللاعب (صورة)" },
    { id: "football_world", name: "كرة قدم عالمية" },
    { id: "football_saudi", name: "كرة قدم سعودية" },
    { id: "art_global", name: "فن عالمي (صورة)" },
    { id: "general", name: "أسئلة عامة" },
    { id: "math", name: "رياضيات" },
    { id: "geo", name: "جغرافيا" }
  ];

  const selected = new Set();

  function show(screen) {
    [screenHome, screenCategories, screenTeams].forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
  }

  function updateSelectedInfo(){
    selectedInfo.textContent = `${selected.size} / ${MAX_CATS}`;
    continueBtn.disabled = selected.size < MIN_CATS || selected.size > MAX_CATS;
  }

  function renderCategories() {
    categoriesDiv.innerHTML = "";
    categories.forEach(cat => {
      const div = document.createElement("div");
      div.className = "category" + (selected.has(cat.id) ? " selected" : "");
      div.textContent = cat.name;

      div.addEventListener("click", () => {
        if (selected.has(cat.id)) {
          selected.delete(cat.id);
          div.classList.remove("selected");
        } else {
          if (selected.size >= MAX_CATS) return;
          selected.add(cat.id);
          div.classList.add("selected");
        }
        updateSelectedInfo();
      });

      categoriesDiv.appendChild(div);
    });

    updateSelectedInfo();
  }

  // Home -> Categories
  startBtn.addEventListener("click", () => {
    renderCategories();
    show(screenCategories);
  });

  // Categories -> Home
  backToHomeBtn.addEventListener("click", () => {
    show(screenHome);
  });

  // Categories -> Teams
  continueBtn.addEventListener("click", () => {
    const chosen = [...selected];
    localStorage.setItem("zahin_selected_categories", JSON.stringify(chosen));
    show(screenTeams);
  });

  // Teams -> Categories
  backToCategoriesBtn.addEventListener("click", () => {
    show(screenCategories);
  });

  // Start Host (next step later: board)
  startHostBtn.addEventListener("click", () => {
    const team1 = (team1Input.value || "").trim() || "الفريق الأول";
    const team2 = (team2Input.value || "").trim() || "الفريق الثاني";

    localStorage.setItem("zahin_team1", team1);
    localStorage.setItem("zahin_team2", team2);

    const chosen = JSON.parse(localStorage.getItem("zahin_selected_categories") || "[]");

    alert(
      "جاهزين ✅\n\n" +
      "الفئات: " + chosen.length + "\n" +
      "الفريق 1: " + team1 + "\n" +
      "الفريق 2: " + team2 + "\n\n" +
      "الخطوة الجاية: لوحة الأسئلة (سين جيم)"
    );
  });

  // Start at home
  show(screenHome);
});