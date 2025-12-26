document.addEventListener("DOMContentLoaded", async () => {

  /* =========================
     QBank (NEW – ISLAMIYAT)
     ========================= */

  const loadIslamiyat = async () => {
    const files = [
      "data/islamiyat_200.json",
      "data/islamiyat_400.json",
      "data/islamiyat_600.json"
    ];

    let all = [];
    for (const f of files) {
      const res = await fetch(f, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load " + f);
      const arr = await res.json();
      all = all.concat(arr);
    }

    // build lookup by categoryId + slot
    const map = new Map();
    map.set("islam", new Map());

    const byPoints = { 200: [], 400: [], 600: [] };
    all.forEach(q => byPoints[q.points].push(q));

    [200, 400, 600].forEach(p => {
      byPoints[p].forEach((q, i) => {
        map.get("islam").set(i, {
          question: q.question,
          answer: q.answer,
          points: q.points,
          image: q.image
        });
      });
    });

    return map;
  };

  /* =========================
     Categories
     ========================= */

  const CATEGORIES = [
    { id: "islam", name: "إسلاميات" }
  ];

  const POINTS = [200, 200, 400, 400, 600, 600];

  let QLOOKUP = null;

  /* =========================
     Load Bank
     ========================= */

  try {
    QLOOKUP = await loadIslamiyat();
  } catch (e) {
    alert("فشل تحميل أسئلة الإسلاميات");
    console.error(e);
    return;
  }

  /* =========================
     Game State (مختصر)
     ========================= */

  let state = {
    selectedCategoryIds: ["islam"],
    finalized: {},
    questions: {},
    team1Name: "الفريق الأول",
    team2Name: "الفريق الثاني",
    team1Score: 0,
    team2Score: 0
  };

  const boardGrid = document.getElementById("boardGrid");

  /* =========================
     Render Board
     ========================= */

  const renderBoard = () => {
    boardGrid.innerHTML = "";

    state.selectedCategoryIds.forEach(cid => {
      const col = document.createElement("div");
      col.className = "colCard";

      const header = document.createElement("div");
      header.className = "colHeader";
      header.textContent = "إسلاميات";

      const cells = document.createElement("div");
      cells.className = "cells";

      POINTS.forEach((pts, idx) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = pts;

        cell.addEventListener("click", () => {
          const q = QLOOKUP.get("islam").get(idx);
          alert(q.question + "\n\n" + q.answer);
        });

        cells.appendChild(cell);
      });

      col.appendChild(header);
      col.appendChild(cells);
      boardGrid.appendChild(col);
    });
  };

  /* =========================
     Start
     ========================= */

  renderBoard();

});