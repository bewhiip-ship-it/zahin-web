document.addEventListener("DOMContentLoaded", () => {
  // Screens
  const sAuth = document.getElementById("screen-auth");
  const sHome = document.getElementById("screen-home");
  const sCats = document.getElementById("screen-categories");
  const sTeams = document.getElementById("screen-teams");
  const sBoard = document.getElementById("screen-board");
  const sWinner = document.getElementById("screen-winner");

  // Auth
  const usernameInput = document.getElementById("usernameInput");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const KEY_USER = "zahin_user_v1";

  // Home/Cats/Teams buttons
  const startBtn = document.getElementById("startBtn");
  const backToHomeBtn = document.getElementById("backToHomeBtn");
  const continueBtn = document.getElementById("continueBtn");
  const backToCategoriesBtn = document.getElementById("backToCategoriesBtn");
  const startHostBtn = document.getElementById("startHostBtn");
  const resetGameBtn = document.getElementById("resetGameBtn");

  // Cats UI
  const categoriesDiv = document.getElementById("categories");
  const selectedInfo = document.getElementById("selectedInfo");
  const MIN_CATS = 3;
  const MAX_CATS = 6;

  // Teams
  const team1Input = document.getElementById("team1Input");
  const team2Input = document.getElementById("team2Input");

  // Scorebar
  const team1NameTop = document.getElementById("team1NameTop");
  const team2NameTop = document.getElementById("team2NameTop");
  const team1ScoreTop = document.getElementById("team1ScoreTop");
  const team2ScoreTop = document.getElementById("team2ScoreTop");
  const team1Plus = document.getElementById("team1Plus");
  const team1Minus = document.getElementById("team1Minus");
  const team2Plus = document.getElementById("team2Plus");
  const team2Minus = document.getElementById("team2Minus");

  // Lifelines buttons
  const t1Double = document.getElementById("t1Double");
  const t1Block = document.getElementById("t1Block");
  const t1Call = document.getElementById("t1Call");
  const t2Double = document.getElementById("t2Double");
  const t2Block = document.getElementById("t2Block");
  const t2Call = document.getElementById("t2Call");

  // Board
  const boardGrid = document.getElementById("boardGrid");
  const POINTS = [200, 200, 400, 400, 600, 600];

  // Winner
  const winnerTitle = document.getElementById("winnerTitle");
  const winnerDetails = document.getElementById("winnerDetails");
  const wTeam1 = document.getElementById("wTeam1");
  const wTeam2 = document.getElementById("wTeam2");
  const wScore1 = document.getElementById("wScore1");
  const wScore2 = document.getElementById("wScore2");
  const backToBoardBtn = document.getElementById("backToBoardBtn");
  const newGameFromWinnerBtn = document.getElementById("newGameFromWinnerBtn");

  // Modal
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

  // Turn UI
  const turnPill = document.getElementById("turnPill");
  const turnNote = document.getElementById("turnNote");

  // Report
  const reportBtn = document.getElementById("reportBtn");
  const KEY_REPORTS = "zahin_reports_v1";

  // Storage keys
  const KEY_STATE = "zahin_state_v2";
  const KEY_QBANK_CACHE = "zahin_qbank_cache_v1";

  // Local state
  let selected = new Set();
  let state = loadState() || null;

  // QBank runtime
  let QBANK = null; // {version,categories,questions}
  let QLOOKUP = null; // Map: categoryId -> slot(0..5) -> question
  let CATEGORIES = []; // from bank
  const FALLBACK_CATEGORIES = [
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

  // Timer
  let tStart = 0;
  let tInterval = null;

  // ===== Helpers =====
  function show(screen) {
    [sAuth, sHome, sCats, sTeams, sBoard, sWinner].forEach(x => x.classList.remove("active"));
    screen.classList.add("active");
  }

  function saveState() {
    localStorage.setItem(KEY_STATE, JSON.stringify(state));
  }

  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY_STATE) || "null"); }
    catch { return null; }
  }

  function clearState() {
    localStorage.removeItem(KEY_STATE);
    state = null;
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem(KEY_USER) || "null"); }
    catch { return null; }
  }

  function setUser(username) {
    const u = { id: "u_" + username.toLowerCase().replace(/\s+/g, "_"), username };
    localStorage.setItem(KEY_USER, JSON.stringify(u));
    return u;
  }

  function logout() {
    localStorage.removeItem(KEY_USER);
    clearState();
    selected = new Set();
    show(sAuth);
  }

  function finalizedKeyForUser(userId) {
    return `zahin_finalized_ids_${userId}`;
  }

  function loadFinalizedSet(userId) {
    try {
      const raw = localStorage.getItem(finalizedKeyForUser(userId));
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  }

  function addFinalized(userId, qid) {
    const set = loadFinalizedSet(userId);
    set.add(qid);
    localStorage.setItem(finalizedKeyForUser(userId), JSON.stringify([...set]));
  }

  function formatMMSS(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function openModal() { modal.classList.remove("hidden"); }
  function closeModal() { modal.classList.add("hidden"); }

  function startTimer() {
    tStart = Date.now();
    timerEl.textContent = "00:00";
    if (tInterval) clearInterval(tInterval);
    tInterval = setInterval(() => {
      timerEl.textContent = formatMMSS(Date.now() - tStart);
    }, 250);
  }

  function stopTimer() {
    if (tInterval) clearInterval(tInterval);
    tInterval = null;
  }

  function bumpScore(team, delta) {
    if (!state) return;
    if (team === 1) state.team1Score += delta;
    if (team === 2) state.team2Score += delta;
    renderScorebar();
    saveState();
  }

  function setLifeBtn(btn, used) {
    if (!btn) return;
    if (used) btn.classList.add("used");
    else btn.classList.remove("used");
    btn.disabled = !!used;
  }

  function renderScorebar() {
    if (!state) return;

    team1NameTop.textContent = state.team1Name;
    team2NameTop.textContent = state.team2Name;
    team1ScoreTop.textContent = state.team1Score;
    team2ScoreTop.textContent = state.team2Score;

    pickTeam1.textContent = state.team1Name;
    pickTeam2.textContent = state.team2Name;

    // lifelines UI
    setLifeBtn(t1Double, state.lifelines.t1.doubleUsed);
    setLifeBtn(t1Block, state.lifelines.t1.blockUsed);
    setLifeBtn(t1Call, state.lifelines.t1.callUsed);

    setLifeBtn(t2Double, state.lifelines.t2.doubleUsed);
    setLifeBtn(t2Block, state.lifelines.t2.blockUsed);
    setLifeBtn(t2Call, state.lifelines.t2.callUsed);
  }

  function updateSelectedInfo() {
    selectedInfo.textContent = `${selected.size} / ${MAX_CATS}`;
    continueBtn.disabled = selected.size < MIN_CATS || selected.size > MAX_CATS;
  }

  function renderCategories() {
    categoriesDiv.innerHTML = "";
    (CATEGORIES.length ? CATEGORIES : FALLBACK_CATEGORIES).forEach(cat => {
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

  // ===== QBank =====
  function buildLookup(bank) {
    const map = new Map(); // categoryId -> Map(slot -> question)
    bank.questions.forEach(q => {
      if (!map.has(q.categoryId)) map.set(q.categoryId, new Map());
      map.get(q.categoryId).set(q.slot, q);
    });
    return map;
  }

  async function loadQBank() {
    // 1) Try fetch from file
    try {
      const res = await fetch("./questions.json", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const bank = await res.json();
      // Save cache
      localStorage.setItem(KEY_QBANK_CACHE, JSON.stringify(bank));
      return bank;
    } catch (_) {
      // 2) Fallback to cache
      try {
        const cached = localStorage.getItem(KEY_QBANK_CACHE);
        if (cached) return JSON.parse(cached);
      } catch (_) {}
      // 3) No bank
      return null;
    }
  }

  function getQuestionBySlot(categoryId, slot) {
    if (!QLOOKUP) return null;
    const catMap = QLOOKUP.get(categoryId);
    if (!catMap) return null;
    return catMap.get(slot) || null;
  }

  // ===== Board =====
  function renderBoard() {
    if (!state) return;
    boardGrid.innerHTML = "";

    state.selectedCategoryIds.forEach(cid => {
      const cat = (CATEGORIES.length ? CATEGORIES : FALLBACK_CATEGORIES).find(c => c.id === cid);

      const col = document.createElement("div");
      col.className = "colCard";

      const header = document.createElement("div");
      header.className = "colHeader";
      header.textContent = cat ? cat.name : cid;
      col.appendChild(header);

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

      col.appendChild(cells);
      boardGrid.appendChild(col);
    });
  }

  function isGameFinished() {
    if (!state) return false;
    return state.selectedCategoryIds.every(cid =>
      POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`] === true)
    );
  }

  function renderWinner() {
    if (!state) return;

    const t1 = state.team1Name;
    const t2 = state.team2Name;
    const s1 = state.team1Score;
    const s2 = state.team2Score;

    wTeam1.textContent = t1;
    wTeam2.textContent = t2;
    wScore1.textContent = s1;
    wScore2.textContent = s2;

    if (s1 > s2) {
      winnerTitle.textContent = `الفائز: ${t1} 🎉`;
      winnerDetails.textContent = "مبروك! انتهت كل الأسئلة.";
    } else if (s2 > s1) {
      winnerTitle.textContent = `الفائز: ${t2} 🎉`;
      winnerDetails.textContent = "مبروك! انتهت كل الأسئلة.";
    } else {
      winnerTitle.textContent = "تعادل 🤝";
      winnerDetails.textContent = "انتهت كل الأسئلة. (كسر التعادل نضيفه بالمرحلة الجاية)";
    }
  }

  function goWinner() {
    renderWinner();
    show(sWinner);
  }

  // ===== Turn + Lifelines =====
  function currentQuestion() {
    if (!state || !state.currentQuestionId) return null;
    return state.questions[state.currentQuestionId] || null;
  }

  function randomTurnTeam() {
    return Math.random() < 0.5 ? 1 : 2;
  }

  function updateTurnUI() {
    if (!state || !state.currentTurnTeam) {
      turnPill.textContent = "الدور: —";
      turnNote.textContent = "—";
      return;
    }

    const teamName = state.currentTurnTeam === 1 ? state.team1Name : state.team2Name;
    turnPill.textContent = `الدور: ${teamName}`;

    const flags = [];
    if (state.turnFlags.double) flags.push("⭐ دبل");
    if (state.turnFlags.block) flags.push("⛔ منع");
    if (state.turnFlags.call) flags.push("📞 اتصال");
    turnNote.textContent = flags.length ? `مفعّل: ${flags.join(" • ")}` : "—";
  }

  function canUseLifeline(team, key) {
    const lf = team === 1 ? state.lifelines.t1 : state.lifelines.t2;
    if (key === "double") return !lf.doubleUsed;
    if (key === "block") return !lf.blockUsed;
    if (key === "call") return !lf.callUsed;
    return false;
  }

  function markUsed(team, key) {
    const lf = team === 1 ? state.lifelines.t1 : state.lifelines.t2;
    if (key === "double") lf.doubleUsed = true;
    if (key === "block") lf.blockUsed = true;
    if (key === "call") lf.callUsed = true;
  }

  function applyLifeline(team, key) {
    if (!state || !state.currentQuestionId) {
      alert("اختر سؤال أولاً.");
      return;
    }

    // دبل فقط للفريق اللي عليه الدور
    if (key === "double" && team !== state.currentTurnTeam) {
      alert("⭐ دبل النقاط فقط للفريق اللي عليه الدور.");
      return;
    }

    if (!canUseLifeline(team, key)) return;

    if (key === "double") {
      state.turnFlags.double = true;
      markUsed(team, "double");
      alert("تم تفعيل ⭐ دبل النقاط لهذا السؤال.");
    }

    if (key === "block") {
      state.turnFlags.block = true;
      markUsed(team, "block");
      alert("تم تفعيل ⛔ منع إجابة الفريق الثاني لهذا السؤال.");
    }

    if (key === "call") {
      state.turnFlags.call = true;
      markUsed(team, "call");
      alert("📞 اتصال بصديق (بدون تغيير في السؤال).");
    }

    renderScorebar();
    updateTurnUI();
    saveState();
  }

  // ===== Question Modal =====
  function openQuestion(categoryId, points, idx) {
    // Ensure bank loaded
    if (!QLOOKUP) {
      alert("بنك الأسئلة غير جاهز. حدّث الصفحة وحاول مرة ثانية.");
      return;
    }

    // slot = idx (0..5) (متطابق مع تصميم 6 أسئلة)
    const slot = idx;
    const qFromBank = getQuestionBySlot(categoryId, slot);

    // Validate points match
    if (!qFromBank || qFromBank.points !== points) {
      alert("ما لقيت سؤال مطابق لهذه الخانة. تأكد من questions.json (slot/points).");
      return;
    }

    // Build runtime question object with stable ID scheme used by board
    const q = {
      id: `${categoryId}_${points}_${idx}`,
      categoryId: qFromBank.categoryId,
      categoryName: (CATEGORIES.find(c => c.id === categoryId)?.name) || qFromBank.categoryId,
      points: qFromBank.points,
      question: qFromBank.question,
      answer: qFromBank.answer,
      image: qFromBank.image || "placeholder"
    };

    state.currentQuestionId = q.id;
    state.questions[q.id] = q;
    state.currentRevealed = false;

    // دور عشوائي + reset flags لهذا السؤال
    state.currentTurnTeam = randomTurnTeam();
    state.turnFlags = { double: false, block: false, call: false };

    qMeta.textContent = `${q.categoryName} • ${q.points} نقطة`;
    qText.textContent = q.question;

    answerArea.classList.add("hidden");
    revealBtn.style.display = "block";

    // رجّع أزرار الاختيار كما كانت
    pickTeam1.style.display = "";
    pickTeam2.style.display = "";
    pickNoOne.style.display = "";

    updateTurnUI();
    renderScorebar();

    openModal();
    startTimer();
    saveState();
  }

  function revealAnswer() {
    const q = currentQuestion();
    if (!q) return;

    state.currentRevealed = true;
    answerText.textContent = q.answer;

    // المنع: يخفي الفريق الآخر (غير فريق الدور) بعد الإظهار
    if (state.turnFlags.block) {
      if (state.currentTurnTeam === 1) {
        pickTeam2.style.display = "none";
      } else {
        pickTeam1.style.display = "none";
      }
    }

    answerArea.classList.remove("hidden");
    revealBtn.style.display = "none";
    saveState();
  }

  function finalizeQuestion(winnerTeamOrNull) {
    const q = currentQuestion();
    if (!q) return;

    // النقاط: دبل فقط لو الفائز هو نفس فريق الدور
    let pts = q.points;
    if (state.turnFlags.double && winnerTeamOrNull === state.currentTurnTeam) {
      pts = pts * 2;
    }

    if (winnerTeamOrNull === 1) state.team1Score += pts;
    if (winnerTeamOrNull === 2) state.team2Score += pts;

    // mark finalized per game + per user non-repeat
    state.finalized[q.id] = true;
    addFinalized(state.userId, q.id);

    // clear current
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
  }

  function undoOpenQuestion() {
    // اختيار بالخطأ: يرجع بدون إنهاء
    state.currentQuestionId = null;
    state.currentRevealed = false;
    state.currentTurnTeam = null;
    state.turnFlags = { double: false, block: false, call: false };
    saveState();
    closeModal();
    stopTimer();
  }

  // Close without finalize => يبقى السؤال غير منتهي (يقدر يرجع له)
  function closeWithoutFinalize() {
    saveState();
    closeModal();
    stopTimer();
  }

  // ===== Reports =====
  function loadReports() {
    try { return JSON.parse(localStorage.getItem(KEY_REPORTS) || "[]"); }
    catch { return []; }
  }

  function saveReports(list) {
    localStorage.setItem(KEY_REPORTS, JSON.stringify(list));
  }

  function reportQuestion() {
    const q = currentQuestion();
    if (!q) return;

    const reason = prompt("اكتب سبب البلاغ (اختياري):") || "";
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
  }

  // ===== Game Start / Restore =====
  function startNewGame(selectedCatIds, team1Name, team2Name) {
    const user = getUser();
    if (!user) { show(sAuth); return; }

    state = {
      version: 2,
      userId: user.id,
      username: user.username,

      selectedCategoryIds: selectedCatIds,
      team1Name,
      team2Name,
      team1Score: 0,
      team2Score: 0,

      // per-game finalized map
      finalized: {},

      // questions cache (opened questions)
      questions: {},

      // current
      currentQuestionId: null,
      currentRevealed: false,

      // turn
      currentTurnTeam: null,
      turnFlags: { double: false, block: false, call: false },

      // lifelines once per team
      lifelines: {
        t1: { doubleUsed: false, blockUsed: false, callUsed: false },
        t2: { doubleUsed: false, blockUsed: false, callUsed: false }
      }
    };

    // respect per-user nonrepeat by importing finalized set
    const finalizedSet = loadFinalizedSet(state.userId);
    finalizedSet.forEach(qid => { state.finalized[qid] = true; });

    saveState();
    renderScorebar();
    renderBoard();
    show(sBoard);

    if (isGameFinished()) goWinner();
  }

  function restoreIfAny() {
    const user = getUser();
    if (!user) return false;

    // لو state موجود لكن المستخدم تغير
    if (state && state.userId !== user.id) {
      clearState();
      state = null;
      return false;
    }

    if (!state) return false;

    renderScorebar();
    renderBoard();
    show(sBoard);

    // restore current question modal if exists
    if (state.currentQuestionId) {
      const q = state.questions[state.currentQuestionId];
      if (q) {
        qMeta.textContent = `${q.categoryName} • ${q.points} نقطة`;
        qText.textContent = q.question;
        updateTurnUI();

        if (state.currentRevealed) {
          answerText.textContent = q.answer;
          answerArea.classList.remove("hidden");
          revealBtn.style.display = "none";
        } else {
          answerArea.classList.add("hidden");
          revealBtn.style.display = "block";
        }

        // restore pick buttons visibility
        pickTeam1.style.display = "";
        pickTeam2.style.display = "";
        if (state.turnFlags && state.turnFlags.block) {
          if (state.currentTurnTeam === 1) pickTeam2.style.display = "none";
          if (state.currentTurnTeam === 2) pickTeam1.style.display = "none";
        }

        openModal();
        startTimer();
      }
    }

    if (isGameFinished()) goWinner();
    return true;
  }

  // ===== Events =====

  // Auth
  loginBtn.addEventListener("click", () => {
    const name = (usernameInput.value || "").trim();
    if (!name) { alert("اكتب اسم المستخدم."); return; }
    setUser(name);
    show(sHome);
  });

  logoutBtn.addEventListener("click", logout);

  // Home -> Cats
  startBtn.addEventListener("click", () => {
    renderCategories();
    show(sCats);
  });

  backToHomeBtn.addEventListener("click", () => show(sHome));

  continueBtn.addEventListener("click", () => {
    const chosen = [...selected];
    localStorage.setItem("zahin_selected_categories", JSON.stringify(chosen));
    show(sTeams);
  });

  backToCategoriesBtn.addEventListener("click", () => show(sCats));

  startHostBtn.addEventListener("click", () => {
    const team1 = (team1Input.value || "").trim() || "الفريق الأول";
    const team2 = (team2Input.value || "").trim() || "الفريق الثاني";
    const chosen = JSON.parse(localStorage.getItem("zahin_selected_categories") || "[]");
    if (chosen.length < MIN_CATS) { alert("اختر 3 فئات على الأقل."); return; }
    startNewGame(chosen, team1, team2);
  });

  // Score +/- (100)
  team1Plus.addEventListener("click", () => bumpScore(1, 100));
  team1Minus.addEventListener("click", () => bumpScore(1, -100));
  team2Plus.addEventListener("click", () => bumpScore(2, 100));
  team2Minus.addEventListener("click", () => bumpScore(2, -100));

  // Lifelines (once per team)
  t1Double.addEventListener("click", () => applyLifeline(1, "double"));
  t1Block.addEventListener("click", () => applyLifeline(1, "block"));
  t1Call.addEventListener("click", () => applyLifeline(1, "call"));
  t2Double.addEventListener("click", () => applyLifeline(2, "double"));
  t2Block.addEventListener("click", () => applyLifeline(2, "block"));
  t2Call.addEventListener("click", () => applyLifeline(2, "call"));

  // Modal
  revealBtn.addEventListener("click", revealAnswer);
  pickTeam1.addEventListener("click", () => finalizeQuestion(1));
  pickTeam2.addEventListener("click", () => finalizeQuestion(2));
  pickNoOne.addEventListener("click", () => finalizeQuestion(null));
  closeModalBtn.addEventListener("click", closeWithoutFinalize);
  undoOpenBtn.addEventListener("click", undoOpenQuestion);

  // Report
  reportBtn.addEventListener("click", reportQuestion);

  // Reset
  resetGameBtn.addEventListener("click", () => {
    if (!confirm("تبغى تبدأ لعبة جديدة؟")) return;
    clearState();
    selected = new Set();
    show(sHome);
  });

  // Winner actions
  backToBoardBtn.addEventListener("click", () => show(sBoard));
  newGameFromWinnerBtn.addEventListener("click", () => {
    clearState();
    selected = new Set();
    show(sHome);
  });

  // ===== Init (تحميل بنك الأسئلة أول) =====
  (async function init() {
    QBANK = await loadQBank();
    if (QBANK && QBANK.categories && QBANK.questions) {
      CATEGORIES = QBANK.categories;
      QLOOKUP = buildLookup(QBANK);
    } else {
      // بدون بنك: نخلي الفئات الافتراضية ونمنع فتح الأسئلة
      CATEGORIES = FALLBACK_CATEGORIES;
      QLOOKUP = null;
    }

    const user = getUser();
    if (!user) {
      show(sAuth);
    } else {
      // try restore
      if (!restoreIfAny()) show(sHome);
    }
  })();
});