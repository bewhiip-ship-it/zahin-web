document.addEventListener("DOMContentLoaded", () => {

  const screenHome = document.getElementById("screen-home");
  const screenCategories = document.getElementById("screen-categories");

  const startBtn = document.getElementById("startBtn");
  const continueBtn = document.getElementById("continueBtn");
  const categoriesDiv = document.getElementById("categories");

  const categories = [
    "أسئلة عامة",
    "رياضيات",
    "حروف",
    "كرة قدم",
    "قصص الأنبياء",
    "فن",
    "تاريخ",
    "جغرافيا",
    "تقنية"
  ];

  const selected = new Set();

  // زر ابدأ اللعب
  startBtn.addEventListener("click", () => {
    screenHome.classList.remove("active");
    screenCategories.classList.add("active");
  });

  // رسم الفئات
  categories.forEach(name => {
    const div = document.createElement("div");
    div.className = "category";
    div.textContent = name;

    div.addEventListener("click", () => {
      if (selected.has(name)) {
        selected.delete(name);
        div.classList.remove("selected");
      } else {
        if (selected.size >= 6) return;
        selected.add(name);
        div.classList.add("selected");
      }

      continueBtn.disabled = selected.size < 3;
    });

    categoriesDiv.appendChild(div);
  });

  // زر المتابعة (لاحقًا نضيف شاشة الفرق)
  continueBtn.addEventListener("click", () => {
    alert("تم اختيار الفئات: \n" + [...selected].join("، "));
  });

});