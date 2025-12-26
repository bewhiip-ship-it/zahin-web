document.addEventListener("DOMContentLoaded", async () => {
  // Splash 3 seconds
  const splash = document.getElementById("splash");
  const app = document.getElementById("app");
  setTimeout(() => {
    if (splash) splash.classList.add("hidden");
    if (app) app.classList.remove("hidden");
  }, 3000);

  // Screens
  const sAuth = document.getElementById("screen-auth");
  const sHome = document.getElementById("screen-home");
  const sCats = document.getElementById("screen-categories");
  const sTeams = document.getElementById("screen-teams");
  const sBoard = document.getElementById("screen-board");
  const sWinner = document.getElementById("screen-winner");

  const show = (screen) => {
    [sAuth, sHome, sCats, sTeams, sBoard, sWinner].forEach(x => x && x.classList.remove("active"));
    if (screen) screen.classList.add("active");
  };

  // UI: Auth
  const usernameInput = document.getElementById("usernameInput");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // UI: Home
  const goCatsBtn = document.getElementById("goCatsBtn");

  // UI: Categories
  const categoriesGrid = document.getElementById("categoriesGrid");
  const selectedInfo = document.getElementById("selectedInfo");
  const backHomeBtn = document.getElementById("backHomeBtn");
  const toTeamsBtn = document.getElementById("toTeamsBtn");

  // UI: Teams
  const team1Input = document.getElementById("team1Input");
  const team2Input = document.getElementById("team2Input");
  const backCatsBtn = document.getElementById("backCatsBtn");
  const startGameBtn = document.getElementById("startGameBtn");

  // UI: Board
  const boardGrid = document.getElementById("boardGrid");
  const newGameBtn = document.getElementById("newGameBtn");

  // Score UI
  const team1NameTop = document.getElementById("team1NameTop");
  const team2NameTop = document.getElementById("team2NameTop");
  const team1ScoreTop = document.getElementById("team1ScoreTop");
  const team2ScoreTop = document.getElementById("team2ScoreTop");
  const team1Plus = document.getElementById("team1Plus");
  const team1Minus = document.getElementById("team1Minus");
  const team2Plus = document.getElementById("team2Plus");
  const team2Minus = document.getElementById("team2Minus");

  // Lifelines (قد تكون غير موجودة بالـ HTML عندك — لازم ما نكسر)
  const t1Double = document.getElementById("t1Double");
  const t1Block = document.getElementById("t1Block");
  const t1Call = document.getElementById("t1Call");
  const t2Double = document.getElementById("t2Double");
  const t2Block = document.getElementById("t2Block");
  const t2Call = document.getElementById("t2Call");

  const turnPill = document.getElementById("turnPill");
  const turnNote = document.getElementById("turnNote");

  // Winner UI
  const winnerTitle = document.getElementById("winnerTitle");
  const winnerDetails = document.getElementById("winnerDetails");
  const wTeam1 = document.getElementById("wTeam1");
  const wTeam2 = document.getElementById("wTeam2");
  const wScore1 = document.getElementById("wScore1");
  const wScore2 = document.getElementById("wScore2");
  const backBoardBtn = document.getElementById("backBoardBtn");
  const newGameFromWinnerBtn = document.getElementById("newGameFromWinnerBtn");

  // Modal UI
  const modal = document.getElementById("questionModal");
  const qMeta = document.getElementById("qMeta");
  const timerEl = document.getElementById("timer");
  const qText = document.getElementById("qText");
  const revealBtn = document.getElementById("revealBtn");
  const answerArea = document.getElementById("answerArea");
  const answerText = document.getElementById("answerText");
  const pickTeam1 = document.getElementById("pickTeam1");
  const pickTeam2 = document.getElementById("pickTeam2");
  const pickNoOne = document.getElementById("pickNoOne");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const undoOpenBtn = document.getElementById("undoOpenBtn");
  const reportBtn = document.getElementById("reportBtn");

  const openModal = () => modal && modal.classList.remove("hidden");
  const closeModal = () => modal && modal.classList.add("hidden");

  // Constants
  const MIN_CATS = 3;
  const MAX_CATS = 6;
  const POINTS = [200, 200, 400, 400, 600, 600];

  // Storage Keys
  const KEY_USER = "zahin_user_v1";
  const KEY_STATE = "zahin_state_v3";
  const KEY_SELECTED = "zahin_selected_categories_v1";
  const KEY_REPORTS = "zahin_reports_v1";
  const KEY_QBANK_CACHE = "zahin_qbank_cache_v1";

  // Runtime
  let selected = new Set();
  let state = null;

  // QBank
  let QBANK = null;
  let CATEGORIES = [];
  let QLOOKUP = null;

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
    if (!timerEl) return;
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

  // Reports
  const loadReports = () => {
    try { return JSON.parse(localStorage.getItem(KEY_REPORTS) || "[]"); }
    catch { return []; }
  };
  const saveReports = (list) => localStorage.setItem(KEY_REPORTS, JSON.stringify(list));

  // QBank loading
  const buildLookup = (bank) => {
    const map = new Map();
    bank.questions.forEach(q => {
      if (!map.has(q.categoryId)) map.set(q.categoryId, new Map());
      map.get(q.categoryId).set(q.slot, q);
    });
    return map;
  };

  const loadQBank = async () => {
    try {
      const res = await fetch("./questions.json", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const bank = await res.json();
      localStorage.setItem(KEY_QBANK_CACHE, JSON.stringify(bank));
      return bank;
    } catch {
      try {
        const cached = localStorage.getItem(KEY_QBANK_CACHE);
        if (cached) return JSON.parse(cached);
      } catch {}
      return null;
    }
  };

  const getQuestionBySlot = (categoryId, slot) => {
    if (!QLOOKUP) return null;
    const catMap = QLOOKUP.get(categoryId);
    if (!catMap) return null;
    return catMap.get(slot) || null;
  };

  // UI rendering
  const updateSelectedInfo = () => {
    if (selectedInfo) selectedInfo.textContent = `${selected.size} / ${MAX_CATS}`;
    if (toTeamsBtn) toTeamsBtn.disabled = selected.size < MIN_CATS || selected.size > MAX_CATS;
  };

  // ✅ كروت الفئات صورة فقط + 3 جنب بعض
  const renderCategories = () => {
    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = "";
    categoriesGrid.style.display = "grid";
    categoriesGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
    categoriesGrid.style.gap = "12px";
    categoriesGrid.style.alignItems = "stretch";

    const list = CATEGORIES || [];

    list.forEach(cat => {
      const card = document.createElement("button");
      card.type = "button";

      const imgPath = cat.image || "images/placeholder.png";
      card.style.backgroundImage = `url("${imgPath}")`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
      card.style.backgroundRepeat = "no-repeat";

      card.style.height = "120px";
      card.style.borderRadius = "14px";
      card.style.border = selected.has(cat.id) ? "3px solid rgba(0,0,0,0.55)" : "2px solid rgba(0,0,0,0.12)";
      card.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
      card.style.cursor = "pointer";
      card.style.position = "relative";
      card.style.outline = "none";
      card.style.padding = "0";
      card.style.overflow = "hidden";

      card.title = cat.name || cat.id;

      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.background = selected.has(cat.id) ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.00)";
      card.appendChild(overlay);

      card.addEventListener("click", () => {
        if (selected.has(cat.id)) {
          selected.delete(cat.id);
        } else {
          if (selected.size >= MAX_CATS) return;
          selected.add(cat.id);
        }
        renderCategories();
        updateSelectedInfo();
      });

      categoriesGrid.appendChild(card);
    });

    updateSelectedInfo();
  };

  const setLifeBtn = (btn, used) => {
    if (!btn) return; // ✅ حماية
    btn.classList.toggle("used", !!used);
    btn.disabled = !!used;
  };

  const renderScorebar = () => {
    if (!state) return;

    if (team1NameTop) team1NameTop.textContent = state.team1Name;
    if (team2NameTop) team2NameTop.textContent = state.team2Name;
    if (team1ScoreTop) team1ScoreTop.textContent = state.team1Score;
    if (team2ScoreTop) team2ScoreTop.textContent = state.team2Score;

    if (pickTeam1) pickTeam1.textContent = state.team1Name;
    if (pickTeam2) pickTeam2.textContent = state.team2Name;

    setLifeBtn(t1Double, state.lifelines?.t1?.doubleUsed);
    setLifeBtn(t1Block, state.lifelines?.t1?.blockUsed);
    setLifeBtn(t1Call, state.lifelines?.t1?.callUsed);

    setLifeBtn(t2Double, state.lifelines?.t2?.doubleUsed);
    setLifeBtn(t2Block, state.lifelines?.t2?.blockUsed);
    setLifeBtn(t2Call, state.lifelines?.t2?.callUsed);
  };

  const updateTurnUI = () => {
    if (!state) return;
    if (!turnPill || !turnNote) return;

    if (!state.currentTurnTeam) {
      turnPill.textContent = "الدور: —";
      turnNote.textContent = "—";
      return;
    }

    const teamName = state.currentTurnTeam === 1 ? state.team1Name : state.team2Name;
    turnPill.textContent = `الدور: ${teamName}`;

    const flags = [];
    if (state.turnFlags?.double) flags.push("⭐ دبل");
    if (state.turnFlags?.block) flags.push("⛔ منع");
    if (state.turnFlags?.call) flags.push("📞 اتصال");
    turnNote.textContent = flags.length ? `مفعّل: ${flags.join(" • ")}` : "—";
  };

  const bumpScore = (team, delta) => {
    if (!state) return;
    if (team === 1) state.team1Score += delta;
    if (team === 2) state.team2Score += delta;
    renderScorebar();
    saveState();
  };

  const isGameFinished = () => {
    if (!state) return false;
    return state.selectedCategoryIds.every(cid =>
      POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`] === true)
    );
  };

  const renderBoard = () => {
    if (!boardGrid || !state) return;

    boardGrid.innerHTML = "";
    const list = CATEGORIES || [];

    state.selectedCategoryIds.forEach(cid => {
      const cat = list.find(c => c.id === cid);

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
    if (!state) return;

    const s1 = state.team1Score;
    const s2 = state.team2Score;

    if (wTeam1) wTeam1.textContent = state.team1Name;
    if (wTeam2) wTeam2.textContent = state.team2Name;
    if (wScore1) wScore1.textContent = s1;
    if (wScore2) wScore2.textContent = s2;

    if (winnerTitle && winnerDetails) {
      if (s1 > s2) {
        winnerTitle.textContent = `الفائز: ${state.team1Name} 🎉`;
        winnerDetails.textContent = "مبروك! انتهت كل الأسئلة.";
      } else if (s2 > s1) {
        winnerTitle.textContent = `الفائز: ${state.team2Name} 🎉`;
        winnerDetails.textContent = "مبروك! انتهت كل الأسئلة.";
      } else {
        winnerTitle.textContent = "تعادل 🤝";
        winnerDetails.textContent = "كسر التعادل نضيفه بالخطوة الجاية.";
      }
    }

    show(sWinner);
  };

  // Question modal logic
  const currentQuestion = () => (state?.currentQuestionId ? state.questions[state.currentQuestionId] : null);
  const randomTurnTeam = () => (Math.random() < 0.5 ? 1 : 2);

  const openQuestion = (categoryId, points, idx) => {
    if (!QLOOKUP) {
      alert("بنك الأسئلة غير جاهز. تأكد من questions.json");
      return;
    }

    const qFromBank = getQuestionBySlot(categoryId, idx);
    if (!qFromBank || qFromBank.points !== points) {
      alert("سؤال غير مطابق للخانة. راجع questions.json (slot/points).");
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
      answer: qFromBank.answer
    };

    state.currentQuestionId = qid;
    state.questions[qid] = q;
    state.currentRevealed = false;

    state.currentTurnTeam = randomTurnTeam();
    state.turnFlags = { double: false, block: false, call: false };

    if (qMeta) qMeta.textContent = `${catName} • ${points} نقطة`;
    if (qText) qText.textContent = q.question;

    if (answerArea) answerArea.classList.add("hidden");
    if (revealBtn) revealBtn.style.display = "block";

    if (pickTeam1) pickTeam1.style.display = "";
    if (pickTeam2) pickTeam2.style.display = "";
    if (pickNoOne) pickNoOne.style.display = "";

    updateTurnUI();
    renderScorebar();

    openModal();
    startTimer();
    saveState();
  };

  const revealAnswer = () => {
    const q = currentQuestion();
    if (!q) return;

    state.currentRevealed = true;
    if (answerText) answerText.textContent = q.answer;

    if (state.turnFlags?.block) {
      if (state.currentTurnTeam === 1 && pickTeam2) pickTeam2.style.display = "none";
      if (state.currentTurnTeam === 2 && pickTeam1) pickTeam1.style.display = "none";
    }

    if (answerArea) answerArea.classList.remove("hidden");
    if (revealBtn) revealBtn.style.display = "none";
    saveState();
  };

  const finalizeQuestion = (winnerTeamOrNull) => {
    const q = currentQuestion();
    if (!q) return;

    let pts = q.points;
    if (state.turnFlags?.double && winnerTeamOrNull === state.currentTurnTeam) pts *= 2;

    if (winnerTeamOrNull === 1) state.team1Score += pts;
    if (winnerTeamOrNull === 2) state.team2Score += pts;

    state.finalized[q.id] = true;
    addFinalized(state.userId, q.id);

    state.currentQuestionId = null;
    state.currentRevealed = false;
    state.currentTurnTeam = null;
    state.turnFlags = { double: false, block: false, call: false };

    renderScorebar();
    renderBoard();
    saveState();

    closeModal();
    stopTimer();

    if (isGameFinished()) goWinner();
  };

  const undoOpen = () => {
    if (!state) return;
    state.currentQuestionId = null;
    state.currentRevealed = false;
    state.currentTurnTeam = null;
    state.turnFlags = { double: false, block: false, call: false };
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

  // Lifelines
  const canUse = (team, key) => {
    const lf = team === 1 ? state.lifelines?.t1 : state.lifelines?.t2;
    if (!lf) return false;
    if (key === "double") return !lf.doubleUsed;
    if (key === "block") return !lf.blockUsed;
    if (key === "call") return !lf.callUsed;
    return false;
  };

  const markUsed = (team, key) => {
    const lf = team === 1 ? state.lifelines?.t1 : state.lifelines?.t2;
    if (!lf) return;
    if (key === "double") lf.doubleUsed = true;
    if (key === "block") lf.blockUsed = true;
    if (key === "call") lf.callUsed = true;
  };

  const applyLifeline = (team, key) => {
    if (!state?.currentQuestionId) {
      alert("اختر سؤال أولاً.");
      return;
    }

    if (key === "double" && team !== state.currentTurnTeam) {
      alert("⭐ الدبل فقط للفريق اللي عليه الدور.");
      return;
    }

    if (!canUse(team, key)) return;

    if (key === "double") state.turnFlags.double = true;
    if (key === "block") state.turnFlags.block = true;
    if (key === "call") state.turnFlags.call = true;

    markUsed(team, key);
    renderScorebar();
    updateTurnUI();
    saveState();
  };

  // Start / Restore game
  const startNewGame = (selectedCatIds, t1, t2) => {
    const user = getUser();
    if (!user) { show(sAuth); return; }

    state = {
      version: 3,
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
      currentRevealed: false,
      currentTurnTeam: null,
      turnFlags: { double: false, block: false, call: false },
      lifelines: {
        t1: { doubleUsed: false, blockUsed: false, callUsed: false },
        t2: { doubleUsed: false, blockUsed: false, callUsed: false }
      }
    };

    // Never repeat per account
    const fin = loadFinalizedSet(state.userId);
    fin.forEach(qid => { state.finalized[qid] = true; });

    saveState();
    renderScorebar();
    renderBoard();
    updateTurnUI();
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

    renderScorebar();
    renderBoard();
    updateTurnUI();
    show(sBoard);

    if (state.currentQuestionId) {
      const q = state.questions[state.currentQuestionId];
      if (q) {
        if (qMeta) qMeta.textContent = `${q.categoryName} • ${q.points} نقطة`;
        if (qText) qText.textContent = q.question;

        if (state.currentRevealed) {
          if (answerText) answerText.textContent = q.answer;
          if (answerArea) answerArea.classList.remove("hidden");
          if (revealBtn) revealBtn.style.display = "none";
        } else {
          if (answerArea) answerArea.classList.add("hidden");
          if (revealBtn) revealBtn.style.display = "block";
        }

        if (pickTeam1) pickTeam1.style.display = "";
        if (pickTeam2) pickTeam2.style.display = "";
        if (pickNoOne) pickNoOne.style.display = "";

        if (state.turnFlags?.block) {
          if (state.currentTurnTeam === 1 && pickTeam2) pickTeam2.style.display = "none";
          if (state.currentTurnTeam === 2 && pickTeam1) pickTeam1.style.display = "none";
        }

        openModal();
        startTimer();
      }
    }

    if (isGameFinished()) goWinner();
    return true;
  };

  // Events (كلها محمية إذا العنصر موجود)
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const name = (usernameInput?.value || "").trim();
      if (!name) return alert("اكتب اسم المستخدم.");
      setUser(name);
      show(sHome);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(KEY_USER);
      localStorage.removeItem(KEY_SELECTED);
      clearState();
      selected = new Set();
      show(sAuth);
    });
  }

  if (goCatsBtn) {
    goCatsBtn.addEventListener("click", () => {
      renderCategories();
      show(sCats);
    });
  }

  if (backHomeBtn) backHomeBtn.addEventListener("click", () => show(sHome));

  if (toTeamsBtn) {
    toTeamsBtn.addEventListener("click", () => {
      localStorage.setItem(KEY_SELECTED, JSON.stringify([...selected]));
      show(sTeams);
    });
  }

  if (backCatsBtn) backCatsBtn.addEventListener("click", () => show(sCats));

  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      const chosen = JSON.parse(localStorage.getItem(KEY_SELECTED) || "[]");
      if (chosen.length < MIN_CATS) return alert("اختر 3 فئات على الأقل.");
      const t1 = (team1Input?.value || "").trim() || "الفريق الأول";
      const t2 = (team2Input?.value || "").trim() || "الفريق الثاني";
      startNewGame(chosen, t1, t2);
    });
  }

  if (team1Plus) team1Plus.addEventListener("click", () => bumpScore(1, 100));
  if (team1Minus) team1Minus.addEventListener("click", () => bumpScore(1, -100));
  if (team2Plus) team2Plus.addEventListener("click", () => bumpScore(2, 100));
  if (team2Minus) team2Minus.addEventListener("click", () => bumpScore(2, -100));

  if (t1Double) t1Double.addEventListener("click", () => applyLifeline(1, "double"));
  if (t1Block) t1Block.addEventListener("click", () => applyLifeline(1, "block"));
  if (t1Call) t1Call.addEventListener("click", () => applyLifeline(1, "call"));
  if (t2Double) t2Double.addEventListener("click", () => applyLifeline(2, "double"));
  if (t2Block) t2Block.addEventListener("click", () => applyLifeline(2, "block"));
  if (t2Call) t2Call.addEventListener("click", () => applyLifeline(2, "call"));

  if (revealBtn) revealBtn.addEventListener("click", revealAnswer);
  if (pickTeam1) pickTeam1.addEventListener("click", () => finalizeQuestion(1));
  if (pickTeam2) pickTeam2.addEventListener("click", () => finalizeQuestion(2));
  if (pickNoOne) pickNoOne.addEventListener("click", () => finalizeQuestion(null));

  if (closeModalBtn) closeModalBtn.addEventListener("click", () => { closeModal(); stopTimer(); saveState(); });
  if (undoOpenBtn) undoOpenBtn.addEventListener("click", undoOpen);
  if (reportBtn) reportBtn.addEventListener("click", reportQuestion);

  if (newGameBtn) {
    newGameBtn.addEventListener("click", () => {
      if (!confirm("تبغى تبدأ لعبة جديدة؟")) return;
      clearState();
      selected = new Set();
      show(sHome);
    });
  }

  if (backBoardBtn) backBoardBtn.addEventListener("click", () => show(sBoard));
  if (newGameFromWinnerBtn) {
    newGameFromWinnerBtn.addEventListener("click", () => {
      clearState();
      selected = new Set();
      show(sHome);
    });
  }

  // Init: load QBank
  QBANK = await loadQBank();
  if (QBANK && QBANK.categories && QBANK.questions) {
    CATEGORIES = QBANK.categories;
    QLOOKUP = buildLookup(QBANK);
  } else {
    CATEGORIES = [];
    QLOOKUP = null;
  }

  // Default screen
  const user = getUser();
  if (!user) show(sAuth);
  else {
    const restored = restoreIfAny();
    if (!restored) show(sHome);
  }
});