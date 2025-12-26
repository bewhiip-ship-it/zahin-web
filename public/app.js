document.addEventListener("DOMContentLoaded", async () => {
    // --------------------------------------------------------
    // 1. Splash Screen Logic (3 Seconds)
    // --------------------------------------------------------
    const splash = document.getElementById("splash");
    const app = document.getElementById("app");
    
    setTimeout(() => {
      if (splash) {
        splash.style.transition = "opacity 0.5s";
        splash.style.opacity = "0";
        setTimeout(() => splash.classList.add("hidden"), 500);
      }
      if (app) app.classList.remove("hidden");
    }, 3000); // 3 seconds
  
    // --------------------------------------------------------
    // 2. Constants & State
    // --------------------------------------------------------
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
  
    // Storage Keys
    const KEY_SESSION = "zahin_session_v1"; // Who is logged in now
    const KEY_USERS_DB = "zahin_users_db_v1"; // Simulated Database
    const KEY_STATE = "zahin_state_v3";
    const KEY_SELECTED = "zahin_selected_categories_v1";
    const KEY_REPORTS = "zahin_reports_v1";
    const KEY_QBANK_CACHE = "zahin_qbank_cache_v1";
  
    const MIN_CATS = 3;
    const MAX_CATS = 6;
    const POINTS = [200, 200, 400, 400, 600, 600];
  
    // Runtime
    let selected = new Set();
    let state = null;
    let QBANK = null;
    let CATEGORIES = [];
    let QLOOKUP = null;
    let tInterval = null;
  
    // --------------------------------------------------------
    // 3. Authentication System (Simulated DB)
    // --------------------------------------------------------
    // Auth UI Elements
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const formForgot = document.getElementById("form-forgot");
  
    const loginUser = document.getElementById("loginUser");
    const loginPass = document.getElementById("loginPass");
    const btnLoginAction = document.getElementById("btnLoginAction");
    
    const regUser = document.getElementById("regUser");
    const regPass = document.getElementById("regPass");
    const btnRegisterAction = document.getElementById("btnRegisterAction");
  
    const forgotUser = document.getElementById("forgotUser");
    const btnForgotAction = document.getElementById("btnForgotAction");
  
    // Toggles
    const btnShowRegister = document.getElementById("btnShowRegister");
    const btnShowForgot = document.getElementById("btnShowForgot");
    const btnBackToLogin1 = document.getElementById("btnBackToLogin1");
    const btnBackToLogin2 = document.getElementById("btnBackToLogin2");
    const logoutBtn = document.getElementById("logoutBtn");
  
    // Helpers for Auth
    const getUsersDB = () => JSON.parse(localStorage.getItem(KEY_USERS_DB) || "{}");
    const setUsersDB = (db) => localStorage.setItem(KEY_USERS_DB, JSON.stringify(db));
    
    const getSession = () => JSON.parse(localStorage.getItem(KEY_SESSION) || "null");
    const setSession = (username) => localStorage.setItem(KEY_SESSION, JSON.stringify({ username }));
  
    // Auth Event Listeners
    const switchForm = (target) => {
      [formLogin, formRegister, formForgot].forEach(f => f.classList.add("hidden"));
      target.classList.remove("hidden");
    };
  
    if(btnShowRegister) btnShowRegister.addEventListener("click", () => switchForm(formRegister));
    if(btnShowForgot) btnShowForgot.addEventListener("click", () => switchForm(formForgot));
    if(btnBackToLogin1) btnBackToLogin1.addEventListener("click", () => switchForm(formLogin));
    if(btnBackToLogin2) btnBackToLogin2.addEventListener("click", () => switchForm(formLogin));
  
    // -- Login Action --
    if(btnLoginAction) {
      btnLoginAction.addEventListener("click", () => {
        const u = loginUser.value.trim().toLowerCase();
        const p = loginPass.value.trim();
  
        if(!u || !p) return alert("الرجاء تعبئة جميع الحقول");
  
        const db = getUsersDB();
        if(db[u] && db[u].password === p) {
          setSession(db[u].originalName); // Save original casing
          show(sHome);
        } else {
          alert("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
      });
    }
  
    // -- Register Action --
    if(btnRegisterAction) {
      btnRegisterAction.addEventListener("click", () => {
        const u = regUser.value.trim();
        const p = regPass.value.trim();
        
        if(!u || !p) return alert("الرجاء تعبئة جميع الحقول");
        if(u.length < 3) return alert("اسم المستخدم قصير جداً");
  
        const db = getUsersDB();
        const key = u.toLowerCase();
  
        if(db[key]) {
          alert("هذا الاسم مستخدم مسبقاً، اختر اسماً آخر.");
        } else {
          db[key] = { password: p, originalName: u, created: Date.now() };
          setUsersDB(db);
          alert("تم إنشاء الحساب بنجاح! يمكنك الدخول الآن.");
          switchForm(formLogin);
        }
      });
    }
  
    // -- Forgot Password Action --
    if(btnForgotAction) {
      btnForgotAction.addEventListener("click", () => {
        const u = forgotUser.value.trim().toLowerCase();
        const db = getUsersDB();
        
        if(db[u]) {
          // In a real app, send email. Here, we mock it.
          alert(`تم إرسال رمز الاستعادة إلى حسابك (محاكاة): كلمة مرورك هي ${db[u].password}`);
          switchForm(formLogin);
        } else {
          alert("لم يتم العثور على حساب بهذا الاسم.");
        }
      });
    }
  
    // -- Logout Action --
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if(confirm("هل أنت متأكد من تسجيل الخروج؟")) {
            localStorage.removeItem(KEY_SESSION);
            localStorage.removeItem(KEY_SELECTED);
            clearState();
            selected = new Set();
            switchForm(formLogin);
            show(sAuth);
        }
      });
    }
  
    // --------------------------------------------------------
    // 4. Core Game Logic
    // --------------------------------------------------------
    
    // UI: Home & Cats
    const goCatsBtn = document.getElementById("goCatsBtn");
    const categoriesGrid = document.getElementById("categoriesGrid");
    const selectedInfo = document.getElementById("selectedInfo");
    const backHomeBtn = document.getElementById("backHomeBtn");
    const toTeamsBtn = document.getElementById("toTeamsBtn");
    const backCatsBtn = document.getElementById("backCatsBtn");
    const startGameBtn = document.getElementById("startGameBtn");
  
    // UI: Teams Input
    const team1Input = document.getElementById("team1Input");
    const team2Input = document.getElementById("team2Input");
  
    // UI: Board
    const boardGrid = document.getElementById("boardGrid");
    const newGameBtn = document.getElementById("newGameBtn");
    const team1NameTop = document.getElementById("team1NameTop");
    const team2NameTop = document.getElementById("team2NameTop");
    const team1ScoreTop = document.getElementById("team1ScoreTop");
    const team2ScoreTop = document.getElementById("team2ScoreTop");
  
    // Modal
    const modal = document.getElementById("questionModal");
    const qMeta = document.getElementById("qMeta");
    const qText = document.getElementById("qText");
    const revealBtn = document.getElementById("revealBtn");
    const answerArea = document.getElementById("answerArea");
    const answerText = document.getElementById("answerText");
    const timerEl = document.getElementById("timer");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const undoOpenBtn = document.getElementById("undoOpenBtn");
    const reportBtn = document.getElementById("reportBtn");
  
    const pickTeam1 = document.getElementById("pickTeam1");
    const pickTeam2 = document.getElementById("pickTeam2");
    const pickNoOne = document.getElementById("pickNoOne");
  
    // Winner
    const wTeam1 = document.getElementById("wTeam1");
    const wTeam2 = document.getElementById("wTeam2");
    const wScore1 = document.getElementById("wScore1");
    const wScore2 = document.getElementById("wScore2");
    const winnerTitle = document.getElementById("winnerTitle");
    const winnerDetails = document.getElementById("winnerDetails");
    const backBoardBtn = document.getElementById("backBoardBtn");
    const newGameFromWinnerBtn = document.getElementById("newGameFromWinnerBtn");
  
    // Lifelines
    const t1Double = document.getElementById("t1Double");
    const t1Block = document.getElementById("t1Block");
    const t1Call = document.getElementById("t1Call");
    const t2Double = document.getElementById("t2Double");
    const t2Block = document.getElementById("t2Block");
    const t2Call = document.getElementById("t2Call");
    const turnPill = document.getElementById("turnPill");
    const turnNote = document.getElementById("turnNote");
  
    // --- Helper Functions ---
  
    const openModal = () => modal && modal.classList.remove("hidden");
    const closeModal = () => modal && modal.classList.add("hidden");
  
    const saveState = () => localStorage.setItem(KEY_STATE, JSON.stringify(state));
    const loadState = () => { try { return JSON.parse(localStorage.getItem(KEY_STATE) || "null"); } catch { return null; } };
    const clearState = () => { localStorage.removeItem(KEY_STATE); state = null; };
  
    const finalizedKey = (uid) => `zahin_finalized_ids_${uid}`;
    const loadFinalizedSet = (uid) => {
      try { return new Set(JSON.parse(localStorage.getItem(finalizedKey(uid)) || "[]")); } 
      catch { return new Set(); }
    };
    const addFinalized = (uid, qid) => {
      const set = loadFinalizedSet(uid);
      set.add(qid);
      localStorage.setItem(finalizedKey(uid), JSON.stringify([...set]));
    };
  
    const formatMMSS = (ms) => {
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const r = s % 60;
      return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
    };
  
    const startTimer = () => {
      if (!timerEl) return;
      let start = Date.now();
      timerEl.textContent = "00:00";
      if (tInterval) clearInterval(tInterval);
      tInterval = setInterval(() => { timerEl.textContent = formatMMSS(Date.now() - start); }, 250);
    };
    const stopTimer = () => { if (tInterval) clearInterval(tInterval); tInterval = null; };
  
    // --- Game Logic ---
    
    const updateSelectedInfo = () => {
      if (selectedInfo) selectedInfo.textContent = `${selected.size} / ${MAX_CATS}`;
      if (toTeamsBtn) toTeamsBtn.disabled = selected.size < MIN_CATS || selected.size > MAX_CATS;
    };
  
    const renderCategories = () => {
      if (!categoriesGrid) return;
      categoriesGrid.innerHTML = "";
      const list = CATEGORIES || [];
      list.forEach(cat => {
        const card = document.createElement("button");
        card.type = "button";
        const imgPath = cat.image || "images/placeholder.png";
        card.style.backgroundImage = `url("${imgPath}")`;
        card.style.backgroundSize = "cover";
        card.style.backgroundPosition = "center";
        card.style.height = "100px";
        card.style.borderRadius = "12px";
        card.style.position = "relative";
        card.style.border = selected.has(cat.id) ? "4px solid #333" : "1px solid #ddd";
        card.style.cursor = "pointer";
        card.style.padding = "0";
        card.style.overflow = "hidden";
  
        const overlay = document.createElement("div");
        overlay.style.position = "absolute"; overlay.style.inset = "0";
        overlay.style.background = selected.has(cat.id) ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.3)";
        overlay.style.display = "flex"; overlay.style.alignItems = "center"; overlay.style.justifyContent = "center";
        
        const txt = document.createElement("span");
        txt.textContent = cat.name;
        txt.style.color = "#fff"; txt.style.fontWeight = "bold"; txt.style.textShadow = "0 2px 4px rgba(0,0,0,0.8)";
        overlay.appendChild(txt);
        card.appendChild(overlay);
  
        card.addEventListener("click", () => {
          if (selected.has(cat.id)) selected.delete(cat.id);
          else { if (selected.size >= MAX_CATS) return; selected.add(cat.id); }
          renderCategories(); updateSelectedInfo();
        });
        categoriesGrid.appendChild(card);
      });
      updateSelectedInfo();
    };
  
    const startNewGame = (selectedCatIds, t1, t2) => {
      const session = getSession();
      if (!session) { show(sAuth); return; }
  
      state = {
        version: 3, userId: session.username, username: session.username,
        selectedCategoryIds: selectedCatIds,
        team1Name: t1, team2Name: t2, team1Score: 0, team2Score: 0,
        finalized: {}, questions: {}, currentQuestionId: null, currentRevealed: false,
        currentTurnTeam: null, turnFlags: { double: false, block: false, call: false },
        lifelines: { t1: { doubleUsed:false, blockUsed:false, callUsed:false }, t2: { doubleUsed:false, blockUsed:false, callUsed:false } }
      };
  
      const fin = loadFinalizedSet(state.userId);
      fin.forEach(qid => { state.finalized[qid] = true; });
  
      saveState(); renderScorebar(); renderBoard(); updateTurnUI(); show(sBoard);
      if (isGameFinished()) goWinner();
    };
  
    const renderBoard = () => {
      if (!boardGrid || !state) return;
      boardGrid.innerHTML = "";
      const list = CATEGORIES || [];
      const cols = state.selectedCategoryIds.length;
      boardGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  
      state.selectedCategoryIds.forEach(cid => {
        const cat = list.find(c => c.id === cid);
        const col = document.createElement("div"); col.className = "colCard";
        const header = document.createElement("div"); header.className = "colHeader"; header.textContent = cat ? cat.name : cid;
        const cells = document.createElement("div"); cells.className = "cells";
        const allDone = POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`] === true);
  
        POINTS.forEach((pts, idx) => {
          const qid = `${cid}_${pts}_${idx}`;
          const cell = document.createElement("div"); cell.className = "cell"; cell.textContent = pts;
          if (state.finalized[qid]) cell.classList.add("used");
          if (allDone) cell.classList.add("disabled");
          cell.addEventListener("click", () => {
             if (!state.finalized[qid]) openQuestion(cid, pts, idx);
          });
          cells.appendChild(cell);
        });
        col.appendChild(header); col.appendChild(cells); boardGrid.appendChild(col);
      });
    };
  
    const openQuestion = (categoryId, points, idx) => {
      if (!QLOOKUP) return alert("جار تحميل الأسئلة...");
      const qFromBank = QLOOKUP.get(categoryId)?.get(idx);
      if (!qFromBank || qFromBank.points !== points) return alert(`خطأ: لا يوجد سؤال مطابق`);
      
      const catName = (CATEGORIES.find(c => c.id === categoryId)?.name) || categoryId;
      const qid = `${categoryId}_${points}_${idx}`;
      
      const q = { id: qid, categoryId, categoryName: catName, points, question: qFromBank.question, answer: qFromBank.answer };
      
      state.currentQuestionId = qid;
      state.questions[qid] = q;
      state.currentRevealed = false;
      state.currentTurnTeam = (Math.random() < 0.5 ? 1 : 2);
      state.turnFlags = { double: false, block: false, call: false };
      
      if(qMeta) qMeta.textContent = `${catName} • ${points}`;
      if(qText) qText.textContent = q.question;
      if(answerArea) answerArea.classList.add("hidden");
      if(revealBtn) revealBtn.style.display = "block";
      if(pickTeam1) pickTeam1.style.display = "";
      if(pickTeam2) pickTeam2.style.display = "";
      if(pickNoOne) pickNoOne.style.display = "";
  
      updateTurnUI(); renderScorebar(); openModal(); startTimer(); saveState();
    };
  
    const revealAnswer = () => {
      const q = state?.currentQuestionId ? state.questions[state.currentQuestionId] : null;
      if (!q) return;
      state.currentRevealed = true;
      if(answerText) answerText.textContent = q.answer;
      if(state.turnFlags?.block) {
        if(state.currentTurnTeam === 1 && pickTeam2) pickTeam2.style.display = "none";
        if(state.currentTurnTeam === 2 && pickTeam1) pickTeam1.style.display = "none";
      }
      if(answerArea) answerArea.classList.remove("hidden");
      if(revealBtn) revealBtn.style.display = "none";
      saveState();
    };
  
    const finalizeQuestion = (winnerTeam) => {
      const q = state?.currentQuestionId ? state.questions[state.currentQuestionId] : null;
      if (!q) return;
      let pts = q.points;
      if (state.turnFlags?.double && winnerTeam === state.currentTurnTeam) pts *= 2;
      
      if (winnerTeam === 1) state.team1Score += pts;
      if (winnerTeam === 2) state.team2Score += pts;
  
      state.finalized[q.id] = true;
      addFinalized(state.userId, q.id);
      state.currentQuestionId = null; state.currentRevealed = false; state.currentTurnTeam = null;
      state.turnFlags = { double: false, block: false, call: false };
  
      renderScorebar(); renderBoard(); saveState(); closeModal(); stopTimer();
      if(isGameFinished()) goWinner();
    };
  
    const renderScorebar = () => {
      if (!state) return;
      if(team1NameTop) team1NameTop.textContent = state.team1Name;
      if(team2NameTop) team2NameTop.textContent = state.team2Name;
      if(team1ScoreTop) team1ScoreTop.textContent = state.team1Score;
      if(team2ScoreTop) team2ScoreTop.textContent = state.team2Score;
      if(pickTeam1) pickTeam1.textContent = state.team1Name;
      if(pickTeam2) pickTeam2.textContent = state.team2Name;
  
      const setLife = (btn, used) => { if(btn) { btn.classList.toggle("used", !!used); btn.disabled = !!used; }};
      setLife(t1Double, state.lifelines?.t1?.doubleUsed); setLife(t1Block, state.lifelines?.t1?.blockUsed); setLife(t1Call, state.lifelines?.t1?.callUsed);
      setLife(t2Double, state.lifelines?.t2?.doubleUsed); setLife(t2Block, state.lifelines?.t2?.blockUsed); setLife(t2Call, state.lifelines?.t2?.callUsed);
    };
  
    const updateTurnUI = () => {
      if (!state || !turnPill) return;
      if (!state.currentTurnTeam) { turnPill.textContent = "الدور: —"; turnNote.textContent = "—"; return; }
      const teamName = state.currentTurnTeam === 1 ? state.team1Name : state.team2Name;
      turnPill.textContent = `الدور: ${teamName}`;
      const flags = [];
      if (state.turnFlags?.double) flags.push("⭐ دبل");
      if (state.turnFlags?.block) flags.push("⛔ منع");
      if (state.turnFlags?.call) flags.push("📞 اتصال");
      turnNote.textContent = flags.length ? `${flags.join(" ")}` : "—";
    };
  
    const isGameFinished = () => state && state.selectedCategoryIds.every(cid => POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`]));
    
    const goWinner = () => {
       if(!state) return;
       if(wTeam1) wTeam1.textContent = state.team1Name;
       if(wTeam2) wTeam2.textContent = state.team2Name;
       if(wScore1) wScore1.textContent = state.team1Score;
       if(wScore2) wScore2.textContent = state.team2Score;
       if(winnerTitle) winnerTitle.textContent = (state.team1Score > state.team2Score) ? `الفائز: ${state.team1Name} 🎉` : (state.team2Score > state.team1Score) ? `الفائز: ${state.team2Name} 🎉` : "تعادل 🤝";
       show(sWinner);
    };
    
    const applyLifeline = (team, key) => {
      if(!state?.currentQuestionId) return alert("افتح سؤالاً أولاً");
      if(key==="double" && team !== state.currentTurnTeam) return alert("الدبل فقط للفريق صاحب الدور");
      const lf = (team===1) ? state.lifelines.t1 : state.lifelines.t2;
      if(key==="double"){ if(lf.doubleUsed) return; lf.doubleUsed=true; state.turnFlags.double=true;}
      if(key==="block"){ if(lf.blockUsed) return; lf.blockUsed=true; state.turnFlags.block=true;}
      if(key==="call"){ if(lf.callUsed) return; lf.callUsed=true; state.turnFlags.call=true;}
      renderScorebar(); updateTurnUI(); saveState();
    };
  
    // UI Event Bindings
    if(goCatsBtn) goCatsBtn.addEventListener("click", () => { renderCategories(); show(sCats); });
    if(backHomeBtn) backHomeBtn.addEventListener("click", () => show(sHome));
    if(toTeamsBtn) toTeamsBtn.addEventListener("click", () => { localStorage.setItem(KEY_SELECTED, JSON.stringify([...selected])); show(sTeams); });
    if(backCatsBtn) backCatsBtn.addEventListener("click", () => show(sCats));
    if(startGameBtn) startGameBtn.addEventListener("click", () => {
       const chosen = JSON.parse(localStorage.getItem(KEY_SELECTED)||"[]");
       const t1 = (team1Input?.value||"").trim() || "الفريق الأول";
       const t2 = (team2Input?.value||"").trim() || "الفريق الثاني";
       startNewGame(chosen, t1, t2);
    });
    const bump = (t, v) => { if(state){ if(t===1) state.team1Score+=v; else state.team2Score+=v; renderScorebar(); saveState(); }};
    if(team1Plus) team1Plus.addEventListener("click", ()=>bump(1,100)); if(team1Minus) team1Minus.addEventListener("click", ()=>bump(1,-100));
    if(team2Plus) team2Plus.addEventListener("click", ()=>bump(2,100)); if(team2Minus) team2Minus.addEventListener("click", ()=>bump(2,-100));
  
    if(t1Double) t1Double.addEventListener("click", ()=>applyLifeline(1,"double"));
    if(t1Block) t1Block.addEventListener("click", ()=>applyLifeline(1,"block"));
    if(t1Call) t1Call.addEventListener("click", ()=>applyLifeline(1,"call"));
    if(t2Double) t2Double.addEventListener("click", ()=>applyLifeline(2,"double"));
    if(t2Block) t2Block.addEventListener("click", ()=>applyLifeline(2,"block"));
    if(t2Call) t2Call.addEventListener("click", ()=>applyLifeline(2,"call"));
  
    if(revealBtn) revealBtn.addEventListener("click", revealAnswer);
    if(pickTeam1) pickTeam1.addEventListener("click", ()=>finalizeQuestion(1));
    if(pickTeam2) pickTeam2.addEventListener("click", ()=>finalizeQuestion(2));
    if(pickNoOne) pickNoOne.addEventListener("click", ()=>finalizeQuestion(null));
    if(closeModalBtn) closeModalBtn.addEventListener("click", ()=> { closeModal(); stopTimer(); saveState(); });
    if(undoOpenBtn) undoOpenBtn.addEventListener("click", ()=> { state.currentQuestionId=null; saveState(); closeModal(); stopTimer(); });
    if(newGameBtn) newGameBtn.addEventListener("click", ()=> { if(confirm("إنهاء اللعبة؟")) { clearState(); show(sHome); } });
    if(backBoardBtn) backBoardBtn.addEventListener("click", ()=> show(sBoard));
    if(newGameFromWinnerBtn) newGameFromWinnerBtn.addEventListener("click", ()=> { clearState(); show(sHome); });
  
    // Init
    const loadBank = async () => {
      try { const r = await fetch("./questions.json"); if(!r.ok)throw 1; const d=await r.json(); localStorage.setItem(KEY_QBANK_CACHE, JSON.stringify(d)); return d;}
      catch { try{return JSON.parse(localStorage.getItem(KEY_QBANK_CACHE));}catch{return null;} }
    };
    QBANK = await loadBank();
    if(QBANK) { CATEGORIES = QBANK.categories; QLOOKUP = new Map(); QBANK.questions.forEach(q=>{ if(!QLOOKUP.has(q.categoryId)) QLOOKUP.set(q.categoryId, new Map()); QLOOKUP.get(q.categoryId).set(q.slot, q); }); }
  
    // Start Logic
    const sess = getSession();
    if(!sess) show(sAuth);
    else {
      const restored = loadState();
      if(restored && restored.userId === sess.username) { state=restored; renderScorebar(); renderBoard(); updateTurnUI(); show(sBoard); if(state.currentQuestionId) openModal(); }
      else show(sHome);
    }
  });