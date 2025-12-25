document.addEventListener("DOMContentLoaded", () => {
  // ===== Elements =====
  const screenHome = document.getElementById("screen-home");
  const screenCategories = document.getElementById("screen-categories");
  const screenTeams = document.getElementById("screen-teams");
  const screenBoard = document.getElementById("screen-board");

  const startBtn = document.getElementById("startBtn");
  const backToHomeBtn = document.getElementById("backToHomeBtn");
  const continueBtn = document.getElementById("continueBtn");
  const backToCategoriesBtn = document.getElementById("backToCategoriesBtn");
  const startHostBtn = document.getElementById("startHostBtn");
  const resetGameBtn = document.getElementById("resetGameBtn");

  const categoriesDiv = document.getElementById("categories");
  const selectedInfo = document.getElementById("selectedInfo");

  const team1Input = document.getElementById("team1Input");
  const team2Input = document.getElementById("team2Input");

  const team1NameTop = document.getElementById("team1NameTop");
  const team2NameTop = document.getElementById("team2NameTop");
  const team1ScoreTop = document.getElementById("team1ScoreTop");
  const team2ScoreTop = document.getElementById("team2ScoreTop");
  const team1Plus = document.getElementById("team1Plus");
  const team1Minus = document.getElementById("team1Minus");
  const team2Plus = document.getElementById("team2Plus");
  const team2Minus = document.getElementById("team2Minus");

  const boardGrid = document.getElementById("boardGrid");

  // Modal
  const questionModal = document.getElementById("questionModal");
  const qMeta = document.getElementById("qMeta");
  const timerEl = document.getElementById("timer");
  const qText = document.getElementById("qText");
  const answerArea = document.getElementById("answerArea");
  const answerText = document.getElementById("answerText");
  const revealBtn = document.getElementById("revealBtn");
  const pickTeam1 = document.getElementById("pickTeam1");
  const pickTeam2 = document.getElementById("pickTeam2");
  const pickNoOne = document.getElementById("pickNoOne");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const undoOpenBtn = document.getElementById("undoOpenBtn");

  // ===== Config =====
  const MIN_CATS = 3;
  const MAX_CATS = 6;
  const POINTS = [200, 200, 400, 400, 600, 600];

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

  // ===== Storage Keys =====
  const KEY_STATE = "zahin_state_v1";               // حفظ جلسة اللعب
  const KEY_FINALIZED = "zahin_finalized_ids_v1";  // أسئلة منتهية "ما تتكرر"

  // ===== State =====
  let selected = new Set();
  let state = loadState() || null;

  // Timer
  let tStart = 0;
  let tInterval = null;

  // ===== Helpers =====
  function show(screen) {
    [screenHome, screenCategories, screenTeams, screenBoard].forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
  }

  function saveState() {
    localStorage.setItem(KEY_STATE, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY_STATE);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function clearState() {
    localStorage.removeItem(KEY_STATE);
    state = null;
  }

  function loadFinalizedSet(){
    try {
      const raw = localStorage.getItem(KEY_FINALIZED);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch { return new Set(); }
  }

  function addFinalized(id){
    const set = loadFinalizedSet();
    set.add(id);
    localStorage.setItem(KEY_FINALIZED, JSON.stringify([...set]));
  }

  function formatMMSS(ms){
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2,"0") + ":" + String(r).padStart(2,"0");
  }

  function bumpScore(team, delta){
    if (!state) return;
    if (team === 1) state.team1Score += delta;
    if (team === 2) state.team2Score += delta;
    renderScorebar();
    saveState();
  }

  function renderScorebar(){
    if (!state) return;
    team1NameTop.textContent = state.team1Name;
    team2NameTop.textContent = state.team2Name;
    team1ScoreTop.textContent = state.team1Score;
    team2ScoreTop.textContent = state.team2Score;

    // أسماء الأزرار داخل المودال
    pickTeam1.textContent = state.team1Name;
    pickTeam2.textContent = state.team2Name;
  }

  // ===== Questions Seed (صور تجريبية) =====
  function makePlaceholderQuestionsForCategory(catId, catName){
    // 6 أسئلة لكل فئة
    return POINTS.map((pts, idx) => {
      const id = `${catId}_${pts}_${idx}`;
      return {
        id,
        categoryId: catId,
        categoryName: catName,
        points: pts,
        question: `(${catName}) سؤال تجريبي رقم ${idx + 1} بقيمة ${pts} نقطة؟`,
        answer: `(${catName}) إجابة تجريبية رقم ${idx + 1}.`,
        image: "placeholder" // مجرد نص داخل الصندوق
      };
    });
  }

  function buildQuestionsBank(selectedCatIds){
    const finalized = loadFinalizedSet();
    const bank = {};
    selectedCatIds.forEach(cid => {
      const cat = CATEGORIES.find(c => c.id === cid);
      const all = makePlaceholderQuestionsForCategory(cat.id, cat.name);

      // فلترة الأسئلة المنتهية سابقًا (ما تتكرر على نفس الجهاز)
      const filtered = all.filter(q => !finalized.has(q.id));
      bank[cid] = filtered;
    });
    return bank;
  }

  // ===== Categories UI =====
  function updateSelectedInfo(){
    selectedInfo.textContent = `${selected.size} / ${MAX_CATS}`;
    continueBtn.disabled = selected.size < MIN_CATS || selected.size > MAX_CATS;
  }

  function renderCategories() {
    categoriesDiv.innerHTML = "";
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

      categoriesDiv.appendChild(div);
    });

    updateSelectedInfo();
  }

  // ===== Board Rendering =====
  function renderBoard(){
    if (!state) return;

    boardGrid.innerHTML = "";

    // نعرض حتى 6 أعمدة (TV friendly). لو أقل من 6، نعرض فقط المختار.
    const catIds = state.selectedCategoryIds;

    catIds.forEach(cid => {
      const cat = CATEGORIES.find(c => c.id === cid);
      const col = document.createElement("div");
      col.className = "colCard";

      const header = document.createElement("div");
      header.className = "colHeader";
      header.textContent = cat.name;
      col.appendChild(header);

      const cells = document.createElement("div");
      cells.className = "cells";

      // لكل فئة لازم 6 خلايا نقاط
      POINTS.forEach((pts, idx) => {
        const qId = `${cid}_${pts}_${idx}`;

        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = pts;

        // إذا السؤال منتهي
        if (state.finalized[qId]) {
          cell.classList.add("used");
        }

        // إذا الفئة ما عاد فيها أسئلة (كلها منتهية)
        const allDone = POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`] === true);
        if (allDone) {
          // نخلي كل خلايا العمود disabled بصريًا
          cell.classList.add("disabled");
        }

        cell.addEventListener("click", () => {
          // ما نسمح اختيار سؤال منتهي أو فئة منتهية
          if (state.finalized[qId]) return;
          if (allDone) return;

          openQuestion(cid, pts, idx);
        });

        cells.appendChild(cell);
      });

      col.appendChild(cells);
      boardGrid.appendChild(col);
    });
  }

  // ===== Modal / Question =====
  function openModal(){
    questionModal.classList.remove("hidden");
  }
  function closeModal(){
    questionModal.classList.add("hidden");
  }

  function startTimer(){
    tStart = Date.now();
    timerEl.textContent = "00:00";
    if (tInterval) clearInterval(tInterval);
    tInterval = setInterval(() => {
      timerEl.textContent = formatMMSS(Date.now() - tStart);
    }, 300);
  }
  function stopTimer(){
    if (tInterval) clearInterval(tInterval);
    tInterval = null;
  }

  function currentQuestion(){
    if (!state || !state.currentQuestionId) return null;
    const qid = state.currentQuestionId;
    return state.questions[qid] || null;
  }

  function openQuestion(categoryId, points, idx){
    const qId = `${categoryId}_${points}_${idx}`;

    // إذا عندنا سؤال مفتوح سابقًا ولم يُنهى، نخليه يرجع له (حسب طلبك)
    state.currentQuestionId = qId;
    state.currentRevealed = false;

    // جهّز السؤال لو مو موجود
    if (!state.questions[qId]) {
      const cat = CATEGORIES.find(c => c.id === categoryId);
      state.questions[qId] = {
        id: qId,
        categoryId,
        categoryName: cat.name,
        points,
        question: `(${cat.name}) سؤال تجريبي بقيمة ${points} نقطة؟`,
        answer: `(${cat.name}) إجابة تجريبية.`,
        image: "placeholder"
      };
    }

    // UI
    const q = state.questions[qId];
    qMeta.textContent = `${q.categoryName} • ${q.points} نقطة`;
    qText.textContent = q.question;

    answerArea.classList.add("hidden");
    revealBtn.style.display = "block";

    renderScorebar();
    openModal();
    startTimer();

    saveState();
  }

  function revealAnswer(){
    const q = currentQuestion();
    if (!q) return;

    state.currentRevealed = true;

    answerText.textContent = q.answer;
    answerArea.classList.remove("hidden");
    revealBtn.style.display = "none";

    saveState();
  }

  function finalizeQuestion(winnerTeamOrNull){
    const q = currentQuestion();
    if (!q) return;

    // النقاط تُضاف فقط عند اختيار فريق
    if (winnerTeamOrNull === 1) state.team1Score += q.points;
    if (winnerTeamOrNull === 2) state.team2Score += q.points;

    // تعليم السؤال "منتهي" — ما يرجع يظهر
    state.finalized[q.id] = true;
    addFinalized(q.id);

    // خروج من السؤال
    state.currentQuestionId = null;
    state.currentRevealed = false;

    renderScorebar();
    renderBoard();
    saveState();
    closeModal();
    stopTimer();
  }

  function undoOpenQuestion(){
    // "تم اختيار السؤال بالخطأ" => يرجع اللوحة بدون إنهاء السؤال
    state.currentQuestionId = null;
    state.currentRevealed = false;
    saveState();
    closeModal();
    stopTimer();
  }

  // ===== Game Start =====
  function startNewGame(selectedCatIds, team1Name, team2Name){
    const bank = buildQuestionsBank(selectedCatIds);

    // نبني state خفيف
    state = {
      version: 1,
      selectedCategoryIds: selectedCatIds,
      team1Name,
      team2Name,
      team1Score: 0,
      team2Score: 0,

      // finalized: خريطة questionId => true
      finalized: {},

      // الأسئلة (تتولد حسب الحاجة)
      questions: {},

      currentQuestionId: null,
      currentRevealed: false
    };

    // إذا فئة كل أسئلتها مفلترة (منتهية سابقًا) نخليها رمادي (من خلال renderBoard)
    // ملاحظة: ما نحذفها الآن، بس وقت العرض يكون كله disabled إذا كلها منتهية.

    saveState();
    renderScorebar();
    renderBoard();
    show(screenBoard);
  }

  // ===== Restore Session =====
  function restoreIfAny(){
    if (!state) return false;

    // رجّع للوحة مباشرة
    renderScorebar();
    renderBoard();
    show(screenBoard);

    // لو فيه سؤال مفتوح، افتحه
    if (state.currentQuestionId) {
      const qid = state.currentQuestionId;
      const q = state.questions[qid];
      if (q) {
        qMeta.textContent = `${q.categoryName} • ${q.points} نقطة`;
        qText.textContent = q.question;

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

    return true;
  }

  // ===== Events =====
  startBtn.addEventListener("click", () => {
    renderCategories();
    show(screenCategories);
  });

  backToHomeBtn.addEventListener("click", () => show(screenHome));

  continueBtn.addEventListener("click", () => {
    const chosen = [...selected];
    localStorage.setItem("zahin_selected_categories", JSON.stringify(chosen));
    show(screenTeams);
  });

  backToCategoriesBtn.addEventListener("click", () => show(screenCategories));

  startHostBtn.addEventListener("click", () => {
    const team1 = (team1Input.value || "").trim() || "الفريق الأول";
    const team2 = (team2Input.value || "").trim() || "الفريق الثاني";

    const chosen = JSON.parse(localStorage.getItem("zahin_selected_categories") || "[]");
    if (chosen.length < MIN_CATS) {
      alert("اختر 3 فئات على الأقل.");
      return;
    }

    startNewGame(chosen, team1, team2);
  });

  // Score +/- (100)
  team1Plus.addEventListener("click", () => bumpScore(1, 100));
  team1Minus.addEventListener("click", () => bumpScore(1, -100));
  team2Plus.addEventListener("click", () => bumpScore(2, 100));
  team2Minus.addEventListener("click", () => bumpScore(2, -100));

  // Modal
  revealBtn.addEventListener("click", revealAnswer);
  pickTeam1.addEventListener("click", () => finalizeQuestion(1));
  pickTeam2.addEventListener("click", () => finalizeQuestion(2));
  pickNoOne.addEventListener("click", () => finalizeQuestion(null));

  closeModalBtn.addEventListener("click", () => {
    // رجوع للوحة بدون إنهاء (إذا ما اخترت فريق)
    // يبقى السؤال قابل للفتح من جديد داخل نفس القيم
    state.currentRevealed = state.currentRevealed || false;
    saveState();
    closeModal();
    stopTimer();
  });

  undoOpenBtn.addEventListener("click", undoOpenQuestion);

  resetGameBtn.addEventListener("click", () => {
    if (!confirm("تبغى تبدأ لعبة جديدة؟")) return;
    clearState();
    selected = new Set();
    show(screenHome);
  });

  // ===== Init =====
  if (restoreIfAny()) {
    // تم
  } else {
    show(screenHome);
  }
});