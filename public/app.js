document.addEventListener("DOMContentLoaded", async () => {
    // 1. Splash Logic (3 Seconds)
    setTimeout(() => {
      const splash = document.getElementById("splash");
      if(splash) {
         splash.style.transition = "opacity 0.5s"; splash.style.opacity = "0";
         setTimeout(() => splash.classList.add("hidden"), 500);
      }
      document.getElementById("app").classList.remove("hidden");
    }, 3000);

    // 2. Constants
    const KEY_SESSION = "zahin_session_v1";
    const KEY_STATE = "zahin_state_v3";
    const KEY_SELECTED = "zahin_selected_v1";
    const KEY_CUSTOM_DATA = "zahin_data_v1"; // لتخزين تعديلات الأدمن
    const POINTS = [200, 200, 400, 400, 600, 600];
    const MIN_CATS = 3; const MAX_CATS = 6;

    const screens = {
        auth: document.getElementById("screen-auth"),
        admin: document.getElementById("screen-admin"),
        home: document.getElementById("screen-home"),
        cats: document.getElementById("screen-categories"),
        teams: document.getElementById("screen-teams"),
        board: document.getElementById("screen-board"),
        winner: document.getElementById("screen-winner")
    };

    const show = (key) => {
        Object.values(screens).forEach(el => el && el.classList.remove("active"));
        if (screens[key]) screens[key].classList.add("active");
    };

    let QBANK = { categories: [], questions: [] };
    let QLOOKUP = null;
    let selected = new Set();
    let state = null;
    let tInterval = null;

    // 3. Data Loading
    const loadData = async () => {
        let baseData = { categories: [], questions: [] };
        
        // 1. محاولة تحميل الملف الأصلي
        try {
            const res = await fetch("./questions.json");
            if(res.ok) baseData = await res.json();
        } catch (e) {
            console.log("No local file found, starting empty.");
        }

        // 2. دمج تعديلات الأدمن المخزنة في المتصفح
        const customRaw = localStorage.getItem(KEY_CUSTOM_DATA);
        if (customRaw) {
            try {
                // إذا كان هناك تعديلات محفوظة، نعتمدها
                baseData = JSON.parse(customRaw); 
            } catch(e) {}
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

    const saveCustomData = () => {
        localStorage.setItem(KEY_CUSTOM_DATA, JSON.stringify(QBANK));
        buildLookup();
    };

    // 4. Admin Logic
    const initAdmin = () => {
        const selCat = document.getElementById("selCatForQ");

        const refreshSelect = () => {
            selCat.innerHTML = "";
            if(QBANK.categories) {
                QBANK.categories.forEach(c => {
                    const op = document.createElement("option");
                    op.value = c.id; op.textContent = c.name;
                    selCat.appendChild(op);
                });
            }
        };
        refreshSelect();

        // إضافة فئة
        document.getElementById("btnAddCat").onclick = () => {
            const name = document.getElementById("newCatName").value.trim();
            const id = document.getElementById("newCatId").value.trim();
            const img = document.getElementById("newCatImg").value.trim();
            
            if(!name || !id) return alert("أدخل الاسم والـ ID");
            if(QBANK.categories.find(c => c.id === id)) return alert("ID موجود مسبقاً");

            QBANK.categories.push({ id, name, image: img || "images/placeholder.png" });
            saveCustomData();
            refreshSelect();
            alert("تم حفظ الفئة محلياً ✅");
            
            document.getElementById("newCatName").value = "";
            document.getElementById("newCatId").value = "";
            document.getElementById("newCatImg").value = "";
        };

        // إضافة سؤال
        document.getElementById("btnAddQ").onclick = () => {
            const catId = selCat.value;
            const pts = parseInt(document.getElementById("selPoints").value);
            const slot = parseInt(document.getElementById("selSlot").value);
            const txt = document.getElementById("newQText").value.trim();
            const ans = document.getElementById("newQAnswer").value.trim();
            const img = document.getElementById("newQImg").value.trim();

            if(!catId) return alert("يجب إضافة فئة أولاً");
            if(!txt || !ans) return alert("أكمل البيانات");

            const qid = `${catId}_${pts}_${slot}`;
            
            // حذف القديم إن وجد
            QBANK.questions = QBANK.questions.filter(q => !(q.categoryId === catId && q.slot === slot));

            QBANK.questions.push({
                id: qid, categoryId: catId, slot: slot, points: pts,
                question: txt, answer: ans, image: img || null
            });

            saveCustomData();
            alert("تم حفظ السؤال محلياً ✅");
            
            document.getElementById("newQText").value = "";
            document.getElementById("newQAnswer").value = "";
            document.getElementById("newQImg").value = "";
        };

        // تصدير الملف
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

    // 5. Auth
    const setSession = (u, r) => localStorage.setItem(KEY_SESSION, JSON.stringify({username:u, role:r}));
    const getSession = () => JSON.parse(localStorage.getItem(KEY_SESSION)||"null");

    document.getElementById("btnLoginAction").onclick = () => {
        const u = document.getElementById("loginUser").value.trim().toLowerCase();
        const p = document.getElementById("loginPass").value.trim();
        if(!u || !p) return alert("أكمل البيانات");

        if(u === "admin" && p === "admin123") {
            setSession("Admin", "admin");
            initAdmin();
            show("admin");
        } else {
            setSession(u, "user");
            show("home");
        }
    };

    const doLogout = () => {
        if(confirm("خروج؟")) {
            localStorage.removeItem(KEY_SESSION);
            localStorage.removeItem(KEY_SELECTED);
            localStorage.removeItem(KEY_STATE);
            show("auth");
        }
    };
    document.getElementById("logoutBtn").onclick = doLogout;
    document.getElementById("adminLogoutBtn").onclick = doLogout;

    // 6. Game Logic (Render & Play)
    const renderCategories = () => {
        const grid = document.getElementById("categoriesGrid");
        grid.innerHTML = "";
        QBANK.categories.forEach(cat => {
            const btn = document.createElement("button");
            const imgPath = cat.image || "images/placeholder.png";
            btn.style.backgroundImage = `url("${imgPath}")`;
            btn.style.backgroundSize = "cover";
            btn.style.backgroundPosition = "center";
            btn.className = "category-card"; 
            btn.style.height="100px"; btn.style.borderRadius="12px"; btn.style.border=selected.has(cat.id)?"4px solid #333":"1px solid #ddd";
            
            const ov = document.createElement("div");
            ov.style.cssText="position:absolute;inset:0;background:rgba(0,0,0,0.4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;";
            ov.textContent = cat.name;
            btn.appendChild(ov);
            btn.style.position="relative"; btn.style.overflow="hidden"; btn.style.cursor="pointer";

            btn.onclick = () => {
                if (selected.has(cat.id)) selected.delete(cat.id);
                else { if (selected.size >= MAX_CATS) return; selected.add(cat.id); }
                renderCategories();
                document.getElementById("selectedInfo").textContent = `${selected.size} / 6`;
                document.getElementById("toTeamsBtn").disabled = selected.size < MIN_CATS;
            };
            grid.appendChild(btn);
        });
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

    const openQuestion = (catId, pts, idx) => {
        if(!QLOOKUP) return alert("جار تحميل الأسئلة...");
        const qData = QLOOKUP.get(catId)?.get(idx);
        if(!qData || qData.points !== pts) return alert("السؤال غير متوفر لهذه الخانة!");

        const qid = `${catId}_${pts}_${idx}`;
        const catName = QBANK.categories.find(c=>c.id===catId)?.name || catId;

        state.currentQuestionId = qid;
        state.questions[qid] = { ...qData, points: pts };
        state.currentRevealed = false;
        state.currentTurnTeam = Math.random() < 0.5 ? 1 : 2; 
        state.turnFlags = { double: false, block: false, call: false };

        document.getElementById("qMeta").textContent = `${catName} • ${pts}`;
        document.getElementById("qText").textContent = qData.question;
        
        const imgDisplay = document.getElementById("qImageDisplay");
        const imgArea = document.getElementById("qImageArea");
        if(qData.image) {
            imgDisplay.src = qData.image;
            imgArea.style.display = "block";
        } else {
            imgArea.style.display = "none";
        }

        document.getElementById("revealBtn").style.display = "block";
        document.getElementById("answerArea").classList.add("hidden");
        document.getElementById("pickTeam1").style.display = "";
        document.getElementById("pickTeam2").style.display = "";

        updateTurn();
        renderScore();
        document.getElementById("questionModal").classList.remove("hidden");
        startTimer();
        saveState();
    };

    const revealAnswer = () => {
        const q = state.questions[state.currentQuestionId];
        state.currentRevealed = true;
        document.getElementById("answerText").textContent = q.answer;
        
        if(state.turnFlags.block) {
            if(state.currentTurnTeam === 1) document.getElementById("pickTeam2").style.display="none";
            else document.getElementById("pickTeam1").style.display="none";
        }

        document.getElementById("answerArea").classList.remove("hidden");
        document.getElementById("revealBtn").style.display = "none";
        saveState();
    };

    const finalize = (winner) => {
        const q = state.questions[state.currentQuestionId];
        let pts = q.points;
        if(state.turnFlags.double && winner === state.currentTurnTeam) pts *= 2;

        if(winner === 1) state.s1 += pts;
        if(winner === 2) state.s2 += pts;

        state.finalized[state.currentQuestionId] = true;
        state.currentQuestionId = null; 
        
        renderScore();
        renderBoard();
        document.getElementById("questionModal").classList.add("hidden");
        stopTimer();
        saveState();

        const allDone = state.selectedCategoryIds.every(cid => POINTS.every((p, i) => state.finalized[`${cid}_${p}_${i}`]));
        if(allDone) goWinner();
    };

    const goWinner = () => {
        document.getElementById("wTeam1").textContent = state.t1;
        document.getElementById("wTeam2").textContent = state.t2;
        document.getElementById("wScore1").textContent = state.s1;
        document.getElementById("wScore2").textContent = state.s2;
        
        const title = document.getElementById("winnerTitle");
        if(state.s1 > state.s2) title.textContent = `الفائز: ${state.t1} 🎉`;
        else if(state.s2 > state.s1) title.textContent = `الفائز: ${state.t2} 🎉`;
        else title.textContent = "تعادل 🤝";
        
        show("winner");
    };

    // UI & Events
    const updateTurn = () => {
        if(!state || !state.currentQuestionId) {
            document.getElementById("turnPill").textContent = "—"; 
            document.getElementById("turnNote").textContent = "";
            return;
        }
        const name = state.currentTurnTeam===1?state.t1:state.t2;
        document.getElementById("turnPill").textContent = `الدور: ${name}`;
        const f = [];
        if(state.turnFlags.double) f.push("⭐"); if(state.turnFlags.block) f.push("⛔"); if(state.turnFlags.call) f.push("📞");
        document.getElementById("turnNote").textContent = f.join(" ");
    };
    const renderScore = () => {
        if(!state) return;
        document.getElementById("team1NameTop").textContent = state.t1;
        document.getElementById("team2NameTop").textContent = state.t2;
        document.getElementById("team1ScoreTop").textContent = state.s1;
        document.getElementById("team2ScoreTop").textContent = state.s2;
        document.getElementById("pickTeam1").textContent = state.t1;
        document.getElementById("pickTeam2").textContent = state.t2;
        const setL = (id, u) => { const b=document.getElementById(id); if(b){b.classList.toggle("used",!!u); b.disabled=!!u;} };
        setL("t1Double", state.lifelines.t1.double); setL("t1Block", state.lifelines.t1.block); setL("t1Call", state.lifelines.t1.call);
        setL("t2Double", state.lifelines.t2.double); setL("t2Block", state.lifelines.t2.block); setL("t2Call", state.lifelines.t2.call);
    };
    const startTimer = () => {
        let s = Date.now();
        if(tInterval) clearInterval(tInterval);
        tInterval = setInterval(()=> {
            const d = Math.floor((Date.now()-s)/1000);
            document.getElementById("timer").textContent = `${String(Math.floor(d/60)).padStart(2,"0")}:${String(d%60).padStart(2,"0")}`;
        }, 250);
    };
    const stopTimer = () => { if(tInterval) clearInterval(tInterval); };

    // Buttons
    document.getElementById("goCatsBtn").onclick = () => { renderCategories(); show("cats"); };
    document.getElementById("backHomeBtn").onclick = () => show("home");
    document.getElementById("backCatsBtn").onclick = () => show("cats");
    document.getElementById("toTeamsBtn").onclick = () => { localStorage.setItem(KEY_SELECTED, JSON.stringify([...selected])); show("teams"); };
    document.getElementById("startGameBtn").onclick = () => {
        const chosen = JSON.parse(localStorage.getItem(KEY_SELECTED) || "[]");
        if(chosen.length < MIN_CATS) return alert("اختر 3 فئات على الأقل");
        state = {
            t1: document.getElementById("team1Input").value.trim() || "الفريق الأول",
            t2: document.getElementById("team2Input").value.trim() || "الفريق الثاني",
            s1: 0, s2: 0, selectedCategoryIds: chosen, finalized: {}, questions: {},
            lifelines: { t1: {double:false,block:false,call:false}, t2: {double:false,block:false,call:false} }
        };
        saveState(); renderScore(); renderBoard(); show("board");
    };
    document.getElementById("revealBtn").onclick = revealAnswer;
    document.getElementById("pickTeam1").onclick = () => finalize(1);
    document.getElementById("pickTeam2").onclick = () => finalize(2);
    document.getElementById("pickNoOne").onclick = () => finalize(null);
    document.getElementById("closeModalBtn").onclick = () => { document.getElementById("questionModal").classList.add("hidden"); stopTimer(); };
    document.getElementById("undoOpenBtn").onclick = () => { document.getElementById("questionModal").classList.add("hidden"); stopTimer(); };
    document.getElementById("newGameBtn").onclick = () => { if(confirm("إنهاء؟")) show("home"); };
    document.getElementById("newGameFromWinnerBtn").onclick = () => show("home");

    const life = (team, key) => {
        if(!state.currentQuestionId) return;
        if(key==="double" && team!==state.currentTurnTeam) return alert("الدبل لصاحب الدور");
        const t = team===1?state.lifelines.t1:state.lifelines.t2;
        if(t[key]) return; t[key]=true; state.turnFlags[key]=true;
        renderScore(); updateTurn(); saveState();
    };
    document.getElementById("t1Double").onclick = () => life(1,"double");
    document.getElementById("t1Block").onclick = () => life(1,"block");
    document.getElementById("t1Call").onclick = () => life(1,"call");
    document.getElementById("t2Double").onclick = () => life(2,"double");
    document.getElementById("t2Block").onclick = () => life(2,"block");
    document.getElementById("t2Call").onclick = () => life(2,"call");

    const adj = (t, v) => { if(state) { if(t===1) state.s1+=v; else state.s2+=v; renderScore(); saveState(); }};
    document.getElementById("team1Plus").onclick = () => adj(1, 100);
    document.getElementById("team1Minus").onclick = () => adj(1, -100);
    document.getElementById("team2Plus").onclick = () => adj(2, 100);
    document.getElementById("team2Minus").onclick = () => adj(2, -100);

    const saveState = () => localStorage.setItem(KEY_STATE, JSON.stringify(state));

    // Init
    await loadData();
    const sess = getSession();
    if(sess) {
        if(sess.role === "admin") { initAdmin(); show("admin"); }
        else show("home");
    } else {
        show("auth");
    }
});