document.addEventListener("DOMContentLoaded", async () => {

  // Splash 3 seconds
  const splash = document.getElementById("splash");
  const app = document.getElementById("app");
  setTimeout(() => {
    splash.classList.add("hidden");
    app.classList.remove("hidden");
  }, 3000);

  // Screens
  const sAuth = document.getElementById("screen-auth");
  const sCats = document.getElementById("screen-categories");
  const sTeams = document.getElementById("screen-teams");
  const sBoard = document.getElementById("screen-board");
  const sWinner = document.getElementById("screen-winner");

  const show = (screen) => {
    [sAuth, sCats, sTeams, sBoard, sWinner].forEach(x => x.classList.remove("active"));
    screen.classList.add("active");
  };

  // Topbar
  const topbar = document.getElementById("topbar");
  const team1NameTop = document.getElementById("team1NameTop");
  const team2NameTop = document.getElementById("team2NameTop");
  const team1ScoreTop = document.getElementById("team1ScoreTop");
  const team2ScoreTop = document.getElementById("team2ScoreTop");
  const team1Plus = document.getElementById("team1Plus");
  const team1Minus = document.getElementById("team1Minus");
  const team2Plus = document.getElementById("team2Plus");
  const team2Minus = document.getElementById("team2Minus");

  // Auth
  const usernameInput = document.getElementById("usernameInput");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Categories
  const categoriesGrid = document.getElementById("categoriesGrid");
  const selectedInfo = document.getElementById("selectedInfo");
  const toTeamsBtn = document.getElementById("toTeamsBtn");

  // Teams
  const team1Input = document.getElementById("team1Input");
  const team2Input = document.getElementById("team2Input");
  const backCatsBtn = document.getElementById("backCatsBtn");
  const startGameBtn = document.getElementById("startGameBtn");

  // Board
  const boardGrid = document.getElementById("boardGrid");
  const newGameBtn = document.getElementById("newGameBtn");

  // Winner
  const winnerTitle = document.getElementById("winnerTitle");
  const winnerDetails = document.getElementById("winnerDetails");
  const wTeam1 = document.getElementById("wTeam1");
  const wTeam2 = document.getElementById("wTeam2");
  const wScore1 = document.getElementById("wScore1");
  const wScore2 = document.getElementById("wScore2");
  const newGameFromWinnerBtn = document.getElementById("newGameFromWinnerBtn");

  // Modal
  const modal = document.getElementById("questionModal");
  const qMeta = document.getElementById("qMeta");
  const timerEl = document.getElementById("timer");
  const qText = document.getElementById("qText");
  const qImage = document.getElementById("qImage");
  const revealBtn = document.getElementById("revealBtn");
  const answerArea = document.getElementById("answerArea");
  const answerText = document.getElementById("answerText");
  const pickTeam1 = document.getElementById("pickTeam1");
  const pickTeam2 = document.getElementById("pickTeam2");
  const pickNoOne = document.getElementById("pickNoOne");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const undoOpenBtn = document.getElementById("undoOpenBtn");
  const reportBtn = document.getElementById("reportBtn");

  const openModal = () => modal.classList.remove("hidden");
  const closeModal = () => modal.classList.add("hidden");

  // Constants
  const MIN_CATS = 3;
  const MAX_CATS = 6;
  const POINTS = [200, 200, 400, 400, 600, 600];

  // Storage Keys
  const KEY_USER = "zahin_user_v1";
  const KEY_STATE = "zahin_state_v1";
  const KEY_SELECTED = "zahin_selected_categories_v1";
  const KEY_REPORTS = "zahin_reports_v1";

  // Categories (نفس اللي اتفقنا)
  const CATEGORIES = [
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

  // Runtime
  let selected = new Set();
  let state = null;

  // QBank lookup: categoryId -> slot(0..5) -> {question, answer, points, image}
  let QLOOKUP = new Map();

  // Timer
  let tStart = 0;
  let tInterval = null;

  const formatMMSS = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  };

  const startTimer = () => {
    tStart = Date.now();
    timerEl.textContent = "00:00";
    if (tInterval) clearInterval(tInterval);
    tInterval = setInterval(() => {
      timerEl.textContent = formatMMSS(Date.now() - tStart);
    }, 250);
  };

  const stopTimer = () => {
    if (tInterval) clearInterval(tInterval);
    tInterval = null;
  };

  // User helpers
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(KEY_USER) || "null"); }
    catch { return null; }
  };

  const setUser = (username) => {
    const u = { id: "u_" + username.toLowerCase().replace(/\s+/g, "_"), username };
    localStorage.setItem(KEY_USER, JSON.stringify(u));
    return u;
  };

  // State helpers
  const saveState = () => localStorage.setItem(KEY_STATE, JSON.stringify(state));
  const loadState = () => {
    try { return JSON.parse(localStorage.getItem(KEY_STATE) || "null"); }
    catch { return null; }
  };
  const clearState = () => {
    localStorage.removeItem(KEY_STATE);
    state = null;
  };

  // Never repeat per account
  const finalizedKey = (uid) => `zahin_finalized_ids_${uid}`;
  const loadFinalizedSet = (uid) => {
    try {
      const raw = localStorage.getItem(finalizedKey(uid));
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch { return new Set(); }
  };
  const addFinalized = (uid, qid) => {
    const set = loadFinalizedSet(uid);
    set.add(qid);
    localStorage.setItem(finalizedKey(uid), JSON.stringify([...set]));
  };

  // Reports (محلي)
  const loadReports = () => {
    try { return JSON.parse(localStorage.getItem(KEY_REPORTS) || "[]"); }
    catch { return []; }
  };
  const saveReports = (list) => localStorage.setItem(KEY_REPORTS, JSON.stringify(list));

  // ====== QBank: Islamiyat from 3 files ======
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

    const slots = new Map(); // slot -> question
    const pickByPoints = (pts) => all.filter(q => q.points === pts);

    // نحتاج 2 من كل مستوى (200/400/600) عشان 6 خانات
    const p200 = pickByPoints(200).slice(0, 2);
    const p400 = pickByPoints(400).slice(0, 2);
    const p600 = pickByPoints(600).slice(0, 2);

    const six = [...p200, ...p400, ...p600];

    // slot 0..5
    six.forEach((q, slot) => {
      slots.set(slot, {
        question: q.question,
        answer: q.answer,
        points: q.points,
        image: q.image || "images/islamiyat.png"
      });
    });

    QLOOKUP.set("islam", slots);
  };

  const getQuestionBySlot = (categoryId, slot) => {
    const catMap = QLOOKUP.get(categoryId);
    if (!catMap) return null;
    return catMap.get(slot) || null;
  };

  // ====== UI rendering ======
  const updateSelectedInfo = () => {
    selectedInfo.textContent = `${selected.size} / ${MAX_CATS}`;
    toTeamsBtn.disabled = selected.size < MIN_CATS || selected.size > MAX_CATS;
  };

  const renderCategories = () => {
    categoriesGrid.innerHTML = "";
    CATEGORIES.forEach(cat => {
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

      categoriesGrid.appendChild(div);
    });

    updateSelectedInfo();
  };

  const renderScorebar = () => {
    if (!state) return;
    team1NameTop.textContent = state.team1Name;
    team2NameTop.textContent = state.team2Name;
    team1ScoreTop.textContent = state.team1Score;
    team2ScoreTop.textContent = state.team2Score;

    pickTeam1.textContent = state.team1Name;
    pickTeam2.textContent = state.team2Name;
  };

  const bumpScore = (team, delta) => {
    if (!state) return;
    if (team === 1) state.team1Score += delta;
    if (team === 2) state.team2Score += delta;
    renderScorebar();
    saveState();
  };

  const isGameFinished = () => {
    return state.selectedCategoryIds.every(cid =>
      POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`] === true)
    );
  };

  const renderBoard = () => {
    boardGrid.innerHTML = "";

    state.selectedCategoryIds.forEach(cid => {
      const cat = CATEGORIES.find(c => c.id === cid);

      const col = document.createElement("div");
      col.className = "colCard";

      const header = document.createElement("div");
      header.className = "colHeader";
      header.textContent = cat ? cat.name : cid;

      const cells = document.createElement("div");
      cells.className = "cells";

      const allDone = POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`] === true);

      POINTS.forEach((pts, idx) => {
        const qid = `${cid}_${pts}_${idx}`;
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = pts;

        if (state.finalized[qid]) cell.classList.add("used");
        if (allDone) cell.classList.add("disabled");

        cell.addEventListener("click", () => {
          if (state.finalized[qid]) return;
          if (allDone) return;
          openQuestion(cid, pts, idx);
        });

        cells.appendChild(cell);
      });

      col.appendChild(header);
      col.appendChild(cells);
      boardGrid.appendChild(col);
    });
  };

  const goWinner = () => {
    const s1 = state.team1Score;
    const s2 = state.team2Score;

    wTeam1.textContent = state.team1Name;
    wTeam2.textContent = state.team2Name;
    wScore1.textContent = s1;
    wScore2.textContent = s2;

    if (s1 > s2) {
      winnerTitle.textContent = `الفائز: ${state.team1Name} 🎉`;
      winnerDetails.textContent = "مبروك! انتهت كل الأسئلة.";
    } else if (s2 > s1) {
      winnerTitle.textContent = `الفائز: ${state.team2Name} 🎉`;
      winnerDetails.textContent = "مبروك! انتهت كل الأسئلة.";
    } else {
      winnerTitle.textContent = "تعادل 🤝";
      winnerDetails.textContent = "كسر التعادل نضيفه لاحقاً.";
    }

    topbar.classList.add("hidden");
    show(sWinner);
  };

  // ====== Question modal logic ======
  const currentQuestion = () => (state.currentQuestionId ? state.questions[state.currentQuestionId] : null);

  const openQuestion = (categoryId, points, idx) => {
    const qFromBank = getQuestionBySlot(categoryId, idx);

    // إن ما فيه بنك للفئة -> رسالة
    if (!qFromBank || qFromBank.points !== points) {
      alert("لا يوجد سؤال لهذه الخانة (الفئة غير مضافة بعد).");
      return;
    }

    const catName = (CATEGORIES.find(c => c.id === categoryId)?.name) || categoryId;

    const qid = `${categoryId}_${points}_${idx}`;
    const q = {
      id: qid,
      categoryId,
      categoryName: catName,
      points,
      question: qFromBank.question,
      answer: qFromBank.answer,
      image: qFromBank.image
    };

    state.currentQuestionId = qid;
    state.questions[qid] = q;
    state.currentRevealed = false;

    qMeta.textContent = `${catName} • ${points} نقطة`;
    qText.textContent = q.question;

    qImage.src = q.image || "images/islamiyat.png";

    answerArea.classList.add("hidden");
    revealBtn.style.display = "block";

    openModal();
    startTimer();
    saveState();
  };

  const revealAnswer = () => {
    const q = currentQuestion();
    if (!q) return;

    state.currentRevealed = true;
    answerText.textContent = q.answer;

    answerArea.classList.remove("hidden");
    revealBtn.style.display = "none";
    saveState();
  };

  const finalizeQuestion = (winnerTeamOrNull) => {
    const q = currentQuestion();
    if (!q) return;

    const pts = q.points;

    if (winnerTeamOrNull === 1) state.team1Score += pts;
    if (winnerTeamOrNull === 2) state.team2Score += pts;

    state.finalized[q.id] = true;
    addFinalized(state.userId, q.id);

    state.currentQuestionId = null;
    state.currentRevealed = false;

    renderScorebar();
    renderBoard();
    saveState();

    closeModal();
    stopTimer();

    if (isGameFinished()) goWinner();
  };

  const undoOpen = () => {
    state.currentQuestionId = null;
    state.currentRevealed = false;
    saveState();
    closeModal();
    stopTimer();
  };

  const reportQuestion = () => {
    const q = currentQuestion();
    if (!q) return;

    const reason = prompt("سبب البلاغ (اختياري):") || "";
    const list = loadReports();

    list.push({
      id: "r_" + Date.now(),
      userId: state.userId,
      username: state.username,
      questionId: q.id,
      category: q.categoryName,
      points: q.points,
      reason,
      ts: new Date().toISOString()
    });

    saveReports(list);
    alert("تم إرسال البلاغ ✅ (محلياً حالياً)");
  };

  // ====== Start / Restore game ======
  const startNewGame = (selectedCatIds, t1, t2) => {
    const user = getUser();
    if (!user) { show(sAuth); return; }

    state = {
      userId: user.id,
      username: user.username,
      selectedCategoryIds: selectedCatIds,
      team1Name: t1,
      team2Name: t2,
      team1Score: 0,
      team2Score: 0,
      finalized: {},
      questions: {},
      currentQuestionId: null,
      currentRevealed: false
    };

    // Never repeat per account
    const fin = loadFinalizedSet(state.userId);
    fin.forEach(qid => { state.finalized[qid] = true; });

    saveState();

    topbar.classList.remove("hidden");
    renderScorebar();
    renderBoard();
    show(sBoard);

    if (isGameFinished()) goWinner();
  };

  const restoreIfAny = () => {
    const user = getUser();
    if (!user) return false;

    const loaded = loadState();
    if (!loaded) return false;
    if (loaded.userId !== user.id) return false;

    state = loaded;

    topbar.classList.remove("hidden");
    renderScorebar();
    renderBoard();
    show(sBoard);

    if (state.currentQuestionId) {
      const q = state.questions[state.currentQuestionId];
      if (q) {
        qMeta.textContent = `${q.categoryName} • ${q.points} نقطة`;
        qText.textContent = q.question;
        qImage.src = q.image || "images/islamiyat.png";

        if (state.currentRevealed) {
          answerText.textContent = q.answer;
          answerArea.classList.remove("hidden");
          revealBtn.style.display = "none";
        } else {
          answerArea.classList.add("hidden");
          revealBtn.style.display = "block";
        }

        openModal();
        startTimer();
      }
    }

    if (isGameFinished()) goWinner();
    return true;
  };

  // ====== Events ======
  loginBtn.addEventListener("click", () => {
    const name = (usernameInput.value || "").trim();
    if (!name) return alert("اكتب اسم المستخدم.");
    setUser(name);
    selected = new Set();
    renderCategories();
    show(sCats);
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(KEY_SELECTED);
    clearState();
    selected = new Set();
    topbar.classList.add("hidden");
    show(sAuth);
  });

  toTeamsBtn.addEventListener("click", () => {
    localStorage.setItem(KEY_SELECTED, JSON.stringify([...selected]));
    show(sTeams);
  });

  backCatsBtn.addEventListener("click", () => show(sCats));

  startGameBtn.addEventListener("click", () => {
    const chosen = JSON.parse(localStorage.getItem(KEY_SELECTED) || "[]");
    if (chosen.length < MIN_CATS) return alert("اختر 3 فئات على الأقل.");
    const t1 = (team1Input.value || "").trim() || "الفريق الأول";
    const t2 = (team2Input.value || "").trim() || "الفريق الثاني";
    startNewGame(chosen, t1, t2);
  });

  team1Plus.addEventListener("click", () => bumpScore(1, 100));
  team1Minus.addEventListener("click", () => bumpScore(1, -100));
  team2Plus.addEventListener("click", () => bumpScore(2, 100));
  team2Minus.addEventListener("click", () => bumpScore(2, -100));

  revealBtn.addEventListener("click", revealAnswer);
  pickTeam1.addEventListener("click", () => finalizeQuestion(1));
  pickTeam2.addEventListener("click", () => finalizeQuestion(2));
  pickNoOne.addEventListener("click", () => finalizeQuestion(null));

  closeModalBtn.addEventListener("click", () => { closeModal(); stopTimer(); saveState(); });
  undoOpenBtn.addEventListener("click", undoOpen);
  reportBtn.addEventListener("click", reportQuestion);

  newGameBtn.addEventListener("click", () => {
    if (!confirm("تبغى تبدأ لعبة جديدة؟")) return;
    clearState();
    selected = new Set();
    topbar.classList.add("hidden");
    renderCategories();
    show(sCats);
  });

  newGameFromWinnerBtn.addEventListener("click", () => {
    clearState();
    selected = new Set();
    topbar.classList.add("hidden");
    renderCategories();
    show(sCats);
  });

  // ====== Init ======
  // حمّل الإسلاميات فقط (الباقي نضيفه لاحقاً)
  await loadIslamiyat();

  // Default screen
  const user = getUser();
  if (!user) {
    topbar.classList.add("hidden");
    show(sAuth);
  } else {
    // افتح صفحة اختيار الفئات مباشرة
    const restored = restoreIfAny();
    if (!restored) {
      renderCategories();
      show(sCats);
    }
  }
});