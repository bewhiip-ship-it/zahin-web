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
    }, 3000); 
  
    // --------------------------------------------------------
    // 2. Constants & State Variables
    // --------------------------------------------------------
    const KEY_SESSION = "zahin_session_v1"; 
    const KEY_USERS_DB = "zahin_users_db_v1"; 
    const KEY_CUSTOM_DATA = "zahin_custom_data_v1"; // لتخزين تعديلات الأدمن محلياً
    const KEY_STATE = "zahin_state_v3";
    const KEY_SELECTED = "zahin_selected_categories_v1";
    const KEY_REPORTS = "zahin_reports_v1";

    const MIN_CATS = 3;
    const MAX_CATS = 6;
    const POINTS = [200, 200, 400, 400, 600, 600];
  
    // Screens
    const sAuth = document.getElementById("screen-auth");
    const sAdmin = document.getElementById("screen-admin");
    const sHome = document.getElementById("screen-home");
    const sCats = document.getElementById("screen-categories");
    const sTeams = document.getElementById("screen-teams");
    const sBoard = document.getElementById("screen-board");
    const sWinner = document.getElementById("screen-winner");
  
    const show = (screen) => {
      [sAuth, sAdmin, sHome, sCats, sTeams, sBoard, sWinner].forEach(x => x && x.classList.remove("active"));
      if (screen) screen.classList.add("active");
    };

    // Data Holders
    let QBANK = { categories: [], questions: [] };
    let QLOOKUP = null;
    let selected = new Set();
    let state = null;
    let tInterval = null;

    // --------------------------------------------------------
    // 3. Data Loading & Admin Logic
    // --------------------------------------------------------
    
    // دالة تحميل البيانات ودمجها مع التعديلات المحلية
    const loadData = async () => {
        let baseData = { categories: [], questions: [] };
        
        // 1. محاولة تحميل الملف الأصلي
        try {
            const res = await fetch("./questions.json", { cache: "no-store" });
            if(res.ok) baseData = await res.json();
        } catch (e) {
            console.log("No local file found or fetch error, starting empty.");
        }

        // 2. دمج تعديلات الأدمن المخزنة محلياً (إن وجدت)
        // ملاحظة: لتبسيط الأمر، إذا قام الأدمن بالحفظ، سنعتمد النسخة المحلية كنسخة كاملة
        const customRaw = localStorage.getItem(KEY_CUSTOM_DATA);
        if (customRaw) {
            try {
                const custom = JSON.parse(customRaw);
                // نعتمد النسخة المحلية لأنها الأحدث
                baseData = custom; 
            } catch(e) { console.error("Error parsing local data"); }
        }

        QBANK = baseData;
        buildLookup();
    };

    const buildLookup = () => {
        QLOOKUP = new Map();
        if(QBANK.questions) {
            QBANK.questions.forEach(q => {
                if(!QLOOKUP.has(q.categoryId)) QLOOKUP.set(q.categoryId, new Map());
                QLOOKUP.get(q.categoryId).set(q.slot, q);
            });
        }
    };

    // حفظ البيانات محلياً (للأدمن)
    const saveCustomData = () => {
        localStorage.setItem(KEY_CUSTOM_DATA, JSON.stringify(QBANK));
        buildLookup();
        alert("تم الحفظ محلياً! تأكد من تصدير الملف واستبداله لكي يظهر للمستخدمين الآخرين.");
    };

    // --- إعداد لوحة الأدمن ---
    const initAdminPanel = () => {
        const selCatForQ = document.getElementById("selCatForQ");

        // تحديث قائمة الفئات
        const refreshSelect = () => {
            selCatForQ.innerHTML = "";
            if(QBANK.categories) {
                QBANK.categories.forEach(c => {
                    const op = document.createElement("option");
                    op.value = c.id;
                    op.textContent = c.name;
                    selCatForQ.appendChild(op);
                });
            }
        };
        refreshSelect();

        // زر إضافة فئة
        document.getElementById("btnAddCat").onclick = () => {
            const name = document.getElementById("newCatName").value.trim();
            const id = document.getElementById("newCatId").value.trim();
            const img = document.getElementById("newCatImg").value.trim();
            
            if(!name || !id) return alert("الرجاء إدخال اسم الفئة والـ ID");
            if(QBANK.categories.find(c => c.id === id)) return alert("هذا الـ ID مستخدم مسبقاً!");

            QBANK.categories.push({ id, name, image: img || "images/placeholder.png" });
            saveCustomData();
            refreshSelect();
            
            // تنظيف الحقول
            document.getElementById("newCatName").value = "";
            document.getElementById("newCatId").value = "";
            document.getElementById("newCatImg").value = "";
        };

        // زر إضافة سؤال
        document.getElementById("btnAddQ").onclick = () => {
            const catId = selCatForQ.value;
            const pts = parseInt(document.getElementById("selPoints").value);
            const slot = parseInt(document.getElementById("selSlot").value);
            const txt = document.getElementById("newQText").value.trim();
            const ans = document.getElementById("newQAnswer").value.trim();

            if(!catId) return alert("يجب إضافة فئة أولاً");
            if(!txt || !ans) return alert("الرجاء كتابة السؤال والإجابة");

            const qid = `${catId}_${pts}_${slot}`;

            // حذف السؤال القديم إن وجد في نفس المكان
            QBANK.questions = QBANK.questions.filter(q => !(q.categoryId === catId && q.slot === slot));

            // إضافة الجديد
            QBANK.questions.push({
                id: qid, categoryId: catId, slot: slot, points: pts,
                question: txt, answer: ans
            });

            saveCustomData();
            
            document.getElementById("newQText").value = "";
            document.getElementById("newQAnswer").value = "";
            alert("تم حفظ السؤال بنجاح ✅");
        };

        // زر التصدير
        document.getElementById("btnExportJson").onclick = () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(QBANK, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", "questions.json");
            document.body.appendChild(dlAnchorElem);
            dlAnchorElem.click();
            dlAnchorElem.remove();
        };
    };

    // --------------------------------------------------------
    // 4. Authentication System
    // --------------------------------------------------------
    
    // UI Elements
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const formForgot = document.getElementById("form-forgot");
    
    // Helpers
    const getDB = () => JSON.parse(localStorage.getItem(KEY_USERS_DB) || "{}");
    const setDB = (db) => localStorage.setItem(KEY_USERS_DB, JSON.stringify(db));
    const getSession = () => JSON.parse(localStorage.getItem(KEY_SESSION) || "null");
    const setSession = (u, role="user") => localStorage.setItem(KEY_SESSION, JSON.stringify({username:u, role}));

    // Switch Forms
    const switchForm = (target) => {
        [formLogin, formRegister, formForgot].forEach(f => f.classList.add("hidden"));
        target.classList.remove("hidden");
    };

    document.getElementById("btnShowRegister").onclick = () => switchForm(formRegister);
    document.getElementById("btnShowForgot").onclick = () => switchForm(formForgot);
    document.getElementById("btnBackToLogin1").onclick = () => switchForm(formLogin);
    document.getElementById("btnBackToLogin2").onclick = () => switchForm(formLogin);

    // Login Action
    document.getElementById("btnLoginAction").onclick = () => {
        const u = document.getElementById("loginUser").value.trim().toLowerCase();
        const p = document.getElementById("loginPass").value.trim();

        if(!u || !p) return alert("الرجاء إدخال البيانات");

        // --- أدمن ---
        if(u === "admin" && p === "admin123") {
            setSession("Admin", "admin");
            initAdminPanel();
            show(sAdmin);
            return;
        }

        // --- مستخدم عادي ---
        const db = getDB();
        if(db[u] && db[u].password === p) {
            setSession(db[u].originalName, "user");
            show(sHome);
        } else {
            alert("بيانات خاطئة");
        }
    };

    // Register Action
    document.getElementById("btnRegisterAction").onclick = () => {
        const uRaw = document.getElementById("regUser").value.trim();
        const u = uRaw.toLowerCase();
        const p = document.getElementById("regPass").value.trim();

        if(!uRaw || !p) return alert("الرجاء إدخال البيانات");
        
        const db = getDB();
        if(db[u]) return alert("اسم المستخدم هذا مأخوذ");

        db[u] = { password: p, originalName: uRaw };
        setDB(db);
        alert("تم إنشاء الحساب بنجاح!");
        switchForm(formLogin);
    };

    // Forgot Password Action
    document.getElementById("btnForgotAction").onclick = () => {
        const u = document.getElementById("forgotUser").value.trim().toLowerCase();
        const db = getDB();
        if(db[u]) {
            alert(`محاكاة: كلمة المرور الخاصة بك هي: ${db[u].password}`);
            switchForm(formLogin);
        } else {
            alert("لا يوجد حساب بهذا الاسم");
        }
    };

    // Logout Action
    const doLogout = () => {
        if(confirm("هل أنت متأكد من تسجيل الخروج؟")) {
            localStorage.removeItem(KEY_SESSION);
            localStorage.removeItem(KEY_SELECTED);
            clearState(); // Reset game state
            show(sAuth);
            switchForm(formLogin);
        }
    };
    document.getElementById("logoutBtn").onclick = doLogout;
    document.getElementById("adminLogoutBtn").onclick = doLogout;

    // --------------------------------------------------------
    // 5. Core Game Logic
    // --------------------------------------------------------

    // State Helpers
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

    // Timer Logic
    const formatMMSS = (ms) => {
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const r = s % 60;
      return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
    };
    const startTimer = () => {
      const el = document.getElementById("timer");
      if (!el) return;
      let start = Date.now();
      el.textContent = "00:00";
      if (tInterval) clearInterval(tInterval);
      tInterval = setInterval(() => { el.textContent = formatMMSS(Date.now() - start); }, 250);
    };
    const stopTimer = () => { if (tInterval) clearInterval(tInterval); tInterval = null; };

    // Update UI Helpers
    const updateSelectedInfo = () => {
        const info = document.getElementById("selectedInfo");
        const btn = document.getElementById("toTeamsBtn");
        if (info) info.textContent = `${selected.size} / ${MAX_CATS}`;
        if (btn) btn.disabled = selected.size < MIN_CATS || selected.size > MAX_CATS;
    };

    const renderScorebar = () => {
        if (!state) return;
        document.getElementById("team1NameTop").textContent = state.team1Name;
        document.getElementById("team2NameTop").textContent = state.team2Name;
        document.getElementById("team1ScoreTop").textContent = state.team1Score;
        document.getElementById("team2ScoreTop").textContent = state.team2Score;
        
        document.getElementById("pickTeam1").textContent = state.team1Name;
        document.getElementById("pickTeam2").textContent = state.team2Name;

        const setLife = (id, used) => {
            const b = document.getElementById(id);
            if(b) { b.classList.toggle("used", !!used); b.disabled = !!used; }
        };
        setLife("t1Double", state.lifelines.t1.doubleUsed);
        setLife("t1Block", state.lifelines.t1.blockUsed);
        setLife("t1Call", state.lifelines.t1.callUsed);
        setLife("t2Double", state.lifelines.t2.doubleUsed);
        setLife("t2Block", state.lifelines.t2.blockUsed);
        setLife("t2Call", state.lifelines.t2.callUsed);
    };

    const updateTurnUI = () => {
        const pill = document.getElementById("turnPill");
        const note = document.getElementById("turnNote");
        if (!state || !state.currentTurnTeam) {
            pill.textContent = "الدور: —"; note.textContent = "—"; return;
        }
        const name = state.currentTurnTeam === 1 ? state.team1Name : state.team2Name;
        pill.textContent = `الدور: ${name}`;
        
        const flags = [];
        if (state.turnFlags.double) flags.push("⭐ دبل");
        if (state.turnFlags.block) flags.push("⛔ منع");
        if (state.turnFlags.call) flags.push("📞 اتصال");
        note.textContent = flags.length ? flags.join(" ") : "—";
    };

    // Render Logic
    const renderCategories = () => {
        const grid = document.getElementById("categoriesGrid");
        grid.innerHTML = "";
        
        QBANK.categories.forEach(cat => {
            const card = document.createElement("button");
            const imgPath = cat.image || "images/placeholder.png";
            card.style.backgroundImage = `url("${imgPath}")`;
            card.style.backgroundSize = "cover";
            card.style.backgroundPosition = "center";
            card.style.height = "100px";
            card.style.borderRadius = "12px";
            card.style.position = "relative";
            card.style.border = selected.has(cat.id) ? "4px solid #333" : "1px solid #ddd";
            card.style.cursor = "pointer";

            const overlay = document.createElement("div");
            overlay.style.position = "absolute"; overlay.style.inset = "0";
            overlay.style.background = selected.has(cat.id) ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.3)";
            overlay.style.display = "flex"; overlay.style.alignItems = "center"; overlay.style.justifyContent = "center";
            
            const txt = document.createElement("span");
            txt.textContent = cat.name;
            txt.style.color = "#fff"; txt.style.fontWeight = "bold"; txt.style.textShadow = "0 2px 4px rgba(0,0,0,0.8)";
            overlay.appendChild(txt);
            card.appendChild(overlay);

            card.onclick = () => {
                if (selected.has(cat.id)) selected.delete(cat.id);
                else { if (selected.size >= MAX_CATS) return; selected.add(cat.id); }
                renderCategories();
                updateSelectedInfo();
            };
            grid.appendChild(card);
        });
        updateSelectedInfo();
    };

    const renderBoard = () => {
        const grid = document.getElementById("boardGrid");
        grid.innerHTML = "";
        const cols = state.selectedCategoryIds.length;
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        state.selectedCategoryIds.forEach(cid => {
            const cat = QBANK.categories.find(c => c.id === cid);
            const col = document.createElement("div"); col.className = "colCard";
            const h = document.createElement("div"); h.className = "colHeader"; h.textContent = cat ? cat.name : cid;
            const cells = document.createElement("div");

            const allDone = POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`]);

            POINTS.forEach((pts, idx) => {
                const qid = `${cid}_${pts}_${idx}`;
                const cell = document.createElement("div"); cell.className = "cell"; cell.textContent = pts;
                
                if (state.finalized[qid]) cell.classList.add("used");
                if (allDone) cell.classList.add("disabled");

                cell.onclick = () => {
                    if (!state.finalized[qid]) openQuestion(cid, pts, idx);
                };
                cells.appendChild(cell);
            });
            col.appendChild(h); col.appendChild(cells); grid.appendChild(col);
        });
    };

    // Game Actions
    const openQuestion = (catId, pts, idx) => {
        if(!QLOOKUP) return alert("جار تحميل الأسئلة...");
        const qData = QLOOKUP.get(catId)?.get(idx);
        if(!qData || qData.points !== pts) return alert("لا يوجد سؤال مضاف لهذه الخانة بعد! أضف سؤالاً من لوحة الأدمن.");

        const qid = `${catId}_${pts}_${idx}`;
        const catName = QBANK.categories.find(c=>c.id===catId)?.name || catId;

        const q = {
            id: qid, categoryId: catId, categoryName: catName,
            points: pts, question: qData.question, answer: qData.answer
        };

        state.currentQuestionId = qid;
        state.questions[qid] = q;
        state.currentRevealed = false;
        state.currentTurnTeam = Math.random() < 0.5 ? 1 : 2; 
        state.turnFlags = { double: false, block: false, call: false };

        document.getElementById("qMeta").textContent = `${catName} • ${pts}`;
        document.getElementById("qText").textContent = q.question;
        document.getElementById("answerArea").classList.add("hidden");
        document.getElementById("revealBtn").style.display = "block";
        document.getElementById("pickTeam1").style.display = "";
        document.getElementById("pickTeam2").style.display = "";

        updateTurnUI();
        renderScorebar();
        document.getElementById("questionModal").classList.remove("hidden");
        startTimer();
        saveState();
    };

    const revealAnswer = () => {
        const q = state.questions[state.currentQuestionId];
        if(!q) return;
        state.currentRevealed = true;
        document.getElementById("answerText").textContent = q.answer;
        
        // Block Logic
        if(state.turnFlags.block) {
            if(state.currentTurnTeam === 1) document.getElementById("pickTeam2").style.display="none";
            else document.getElementById("pickTeam1").style.display="none";
        }

        document.getElementById("answerArea").classList.remove("hidden");
        document.getElementById("revealBtn").style.display = "none";
        saveState();
    };

    const finalizeQuestion = (winner) => {
        const q = state.questions[state.currentQuestionId];
        if(!q) return;
        let pts = q.points;
        if(state.turnFlags.double && winner === state.currentTurnTeam) pts *= 2;

        if(winner === 1) state.team1Score += pts;
        if(winner === 2) state.team2Score += pts;

        state.finalized[q.id] = true;
        addFinalized(state.userId, q.id);
        state.currentQuestionId = null; state.currentRevealed = false; state.currentTurnTeam = null;
        
        renderScorebar();
        renderBoard();
        saveState();
        document.getElementById("questionModal").classList.add("hidden");
        stopTimer();

        // Check Winner
        const isFinished = state.selectedCategoryIds.every(cid => POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`]));
        if(isFinished) goWinner();
    };

    const goWinner = () => {
        document.getElementById("wTeam1").textContent = state.team1Name;
        document.getElementById("wTeam2").textContent = state.team2Name;
        document.getElementById("wScore1").textContent = state.team1Score;
        document.getElementById("wScore2").textContent = state.team2Score;
        
        const title = document.getElementById("winnerTitle");
        if(state.team1Score > state.team2Score) title.textContent = `الفائز: ${state.team1Name} 🎉`;
        else if(state.team2Score > state.team1Score) title.textContent = `الفائز: ${state.team2Name} 🎉`;
        else title.textContent = "تعادل 🤝";
        
        show(sWinner);
    };

    const applyLifeline = (team, key) => {
        if(!state.currentQuestionId) return alert("افتح سؤالاً أولاً");
        if(key==="double" && team !== state.currentTurnTeam) return alert("الدبل فقط للفريق صاحب الدور");

        const lf = team === 1 ? state.lifelines.t1 : state.lifelines.t2;
        if(key==="double") { if(lf.doubleUsed) return; lf.doubleUsed=true; state.turnFlags.double=true; }
        if(key==="block") { if(lf.blockUsed) return; lf.blockUsed=true; state.turnFlags.block=true; }
        if(key==="call") { if(lf.callUsed) return; lf.callUsed=true; state.turnFlags.call=true; }

        renderScorebar();
        updateTurnUI();
        saveState();
    };

    // Navigation Events
    document.getElementById("goCatsBtn").onclick = () => { renderCategories(); show(sCats); };
    document.getElementById("backHomeBtn").onclick = () => show(sHome);
    document.getElementById("backCatsBtn").onclick = () => show(sCats);
    document.getElementById("toTeamsBtn").onclick = () => { localStorage.setItem(KEY_SELECTED, JSON.stringify([...selected])); show(sTeams); };
    
    document.getElementById("startGameBtn").onclick = () => {
        const chosen = JSON.parse(localStorage.getItem(KEY_SELECTED) || "[]");
        if(chosen.length < MIN_CATS) return alert("اختر 3 فئات على الأقل");
        
        const t1 = document.getElementById("team1Input").value.trim() || "الفريق الأول";
        const t2 = document.getElementById("team2Input").value.trim() || "الفريق الثاني";

        // Init Game State
        const sess = getSession();
        state = {
            userId: sess.username,
            selectedCategoryIds: chosen,
            team1Name: t1, team2Name: t2,
            team1Score: 0, team2Score: 0,
            finalized: {}, questions: {},
            currentQuestionId: null, currentRevealed: false, currentTurnTeam: null,
            turnFlags: { double: false, block: false, call: false },
            lifelines: { t1: { doubleUsed:false, blockUsed:false, callUsed:false }, t2: { doubleUsed:false, blockUsed:false, callUsed:false } }
        };

        // Load previous played questions for this user (to grey them out if needed? or just reset per game? - assuming per game reset based on above logic but keeping finalized per session logic)
        const fin = loadFinalizedSet(state.userId);
        fin.forEach(qid => { state.finalized[qid] = true; });

        saveState();
        renderScorebar();
        renderBoard();
        updateTurnUI();
        show(sBoard);
    };

    // In-Game Events
    document.getElementById("revealBtn").onclick = revealAnswer;
    document.getElementById("pickTeam1").onclick = () => finalizeQuestion(1);
    document.getElementById("pickTeam2").onclick = () => finalizeQuestion(2);
    document.getElementById("pickNoOne").onclick = () => finalizeQuestion(null);
    document.getElementById("closeModalBtn").onclick = () => { document.getElementById("questionModal").classList.add("hidden"); stopTimer(); };
    document.getElementById("undoOpenBtn").onclick = () => { state.currentQuestionId=null; saveState(); document.getElementById("questionModal").classList.add("hidden"); stopTimer(); };
    document.getElementById("newGameBtn").onclick = () => { if(confirm("إنهاء اللعبة؟")) show(sHome); };
    document.getElementById("backBoardBtn").onclick = () => show(sBoard);
    document.getElementById("newGameFromWinnerBtn").onclick = () => { clearState(); show(sHome); };
    
    document.getElementById("reportBtn").onclick = () => {
        const r = prompt("ما هي المشكلة؟");
        if(r) alert("تم الإرسال");
    };

    // Lifeline Buttons
    document.getElementById("t1Double").onclick = () => applyLifeline(1, "double");
    document.getElementById("t1Block").onclick = () => applyLifeline(1, "block");
    document.getElementById("t1Call").onclick = () => applyLifeline(1, "call");
    document.getElementById("t2Double").onclick = () => applyLifeline(2, "double");
    document.getElementById("t2Block").onclick = () => applyLifeline(2, "block");
    document.getElementById("t2Call").onclick = () => applyLifeline(2, "call");

    // Score Adjusters
    const adj = (t, v) => { if(state) { if(t===1) state.team1Score+=v; else state.team2Score+=v; renderScorebar(); saveState(); }};
    document.getElementById("team1Plus").onclick = () => adj(1, 100);
    document.getElementById("team1Minus").onclick = () => adj(1, -100);
    document.getElementById("team2Plus").onclick = () => adj(2, 100);
    document.getElementById("team2Minus").onclick = () => adj(2, -100);

    // --------------------------------------------------------
    // 6. Init
    // --------------------------------------------------------
    await loadData(); // Load JSON + Custom
    
    const sess = getSession();
    if(sess) {
        if(sess.role === "admin") {
            initAdminPanel();
            show(sAdmin);
        } else {
            // Restore game if exists
            const saved = loadState();
            if(saved && saved.userId === sess.username) {
                state = saved;
                renderScorebar(); renderBoard(); updateTurnUI();
                show(sBoard);
                if(state.currentQuestionId) {
                    // Re-open modal if closed accidentally
                    const qData = state.questions[state.currentQuestionId];
                    if(qData) {
                        // Minimal re-open logic
                         document.getElementById("qMeta").textContent = `${qData.categoryName} • ${qData.points}`;
                         document.getElementById("qText").textContent = qData.question;
                         document.getElementById("questionModal").classList.remove("hidden");
                         if(state.currentRevealed) {
                             document.getElementById("answerText").textContent = qData.answer;
                             document.getElementById("answerArea").classList.remove("hidden");
                             document.getElementById("revealBtn").style.display="none";
                         } else {
                             document.getElementById("answerArea").classList.add("hidden");
                             document.getElementById("revealBtn").style.display="block";
                         }
                    }
                }
            } else {
                show(sHome);
            }
        }
    } else {
        show(sAuth);
    }
});