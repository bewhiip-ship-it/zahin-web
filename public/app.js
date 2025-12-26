document.addEventListener("DOMContentLoaded", async () => {
  console.log("APP STARTED");

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

  // Hide splash after 3 seconds
  setTimeout(() => {
    splash.classList.add("hidden");
    app.classList.remove("hidden");
    console.log("SPLASH DONE");
  }, 3000);

  /* =========================
     Load Islamiyat Questions
     ========================= */

  const files = [
    "data/islamiyat_200.json",
    "data/islamiyat_400.json",
    "data/islamiyat_600.json"
  ];

  let allQuestions = [];

  for (const f of files) {
    const res = await fetch(f);
    const arr = await res.json();
    allQuestions = allQuestions.concat(arr);
  }

  const boardGrid = document.getElementById("boardGrid");

  const POINTS = [200, 200, 400, 400, 600, 600];

  const renderBoard = () => {
    boardGrid.innerHTML = "";

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
        const q = allQuestions.find(q => q.points === pts);
        if (!q) return alert("لا يوجد سؤال");

        alert(q.question + "\n\n" + q.answer);
      });

      cells.appendChild(cell);
    });

    col.appendChild(header);
    col.appendChild(cells);
    boardGrid.appendChild(col);
  };

  renderBoard();
});