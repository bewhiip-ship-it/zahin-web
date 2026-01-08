// Game State
let gameState = {
    username: '',
    selectedCategories: [],
    team1: { name: 'فريق 1', score: 0, lifelines: { double: true, block: true, call: true } },
    team2: { name: 'فريق 2', score: 0, lifelines: { double: true, block: true, call: true } },
    currentTurn: 1,
    questions: [],
    answeredQuestions: [],
    currentQuestion: null,
    timerInterval: null,
    timerSeconds: 0,
    allQuestionsData: null
};

// Categories Data
const categories = [
    { id: 'islamic', name: 'الإسلاميات', image: 'images/islamiyat.png' },
    { id: 'science', name: 'العلوم والاختراعات', image: 'images/science.png' },
    { id: 'arabic', name: 'اللغة العربية والأدب', image: 'images/arabic.png' },
    { id: 'sports', name: 'الرياضة والتاريخ الرياضي', image: 'images/sports.png' },
    { id: 'history', name: 'التاريخ والجغرافيا', image: 'images/history_geo.png' },
    { id: 'nature', name: 'الحيوان والنبات', image: 'images/nature.png' },
    { id: 'people', name: 'الألقاب والشخصيات', image: 'images/titles.png' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Load questions data first
    await loadQuestionsData();
    
    // Show splash for 3 seconds
    setTimeout(() => {
        showScreen('login-screen');
    }, 3000);
    
    // Setup event listeners
    setupEventListeners();
}

async function loadQuestionsData() {
    try {
        // Choose random game file (1-5)
        const gameNumber = Math.floor(Math.random() * 5) + 1;
        const gameFile = `game${gameNumber}.json`;
        
        console.log(`Loading ${gameFile}`);
        
        const response = await fetch(gameFile);
        const data = await response.json();
        
        gameState.allQuestionsData = data;
        gameState.tiebreakerQuestion = data.tiebreaker;
        
        console.log('Questions loaded successfully from', gameFile);
    } catch (error) {
        console.error('Error loading questions:', error);
        gameState.allQuestionsData = createFallbackQuestions();
    }
}

function createFallbackQuestions() {
    const fallback = {};
    categories.forEach(cat => {
        fallback[cat.id] = [];
        [200, 200, 400, 400, 600, 600].forEach((points, index) => {
            fallback[cat.id].push({
                id: `${cat.id}_${index}`,
                category: cat.id,
                points: points,
                question: `سؤال ${points} نقطة - ${cat.name}`,
                answer: `الإجابة ${index + 1}`
            });
        });
    });
    return fallback;
}

function setupEventListeners() {
    // Login Tabs
    document.querySelectorAll('.login-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const tabName = e.target.dataset.tab;
            document.querySelectorAll('.login-form').forEach(form => form.classList.add('hidden'));
            
            if (tabName === 'signin') {
                document.getElementById('signin-form').classList.remove('hidden');
            } else if (tabName === 'signup') {
                document.getElementById('signup-form').classList.remove('hidden');
            }
        });
    });
    
    // Sign In
    document.getElementById('signin-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleSignIn();
    });
    
    // Sign Up
    document.getElementById('signup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleSignUp();
    });
    
    // Reset Password
    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        showResetForm();
    });
    
    document.getElementById('reset-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleResetPassword();
    });
    
    document.getElementById('back-to-signin').addEventListener('click', () => {
        document.querySelectorAll('.login-form').forEach(form => form.classList.add('hidden'));
        document.getElementById('signin-form').classList.remove('hidden');
    });
    
    // Guest Login
    document.getElementById('guest-login-btn').addEventListener('click', handleGuestLogin);
    
    // Home
    document.getElementById('start-game-btn').addEventListener('click', () => {
        gameState.selectedCategories = [];
        showScreen('category-screen');
    });
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Categories
    document.getElementById('next-categories-btn').addEventListener('click', handleCategoriesNext);
    
    // Team Names
    document.getElementById('start-playing-btn').addEventListener('click', startGame);
    
    // Question
    document.getElementById('close-question-btn').addEventListener('click', closeQuestion);
    document.getElementById('show-answer-btn').addEventListener('click', showAnswer);
    document.getElementById('report-btn').addEventListener('click', reportQuestion);
    
    // Win Screen
    document.getElementById('new-game-btn').addEventListener('click', newGame);
    document.getElementById('home-btn').addEventListener('click', () => {
        resetGame();
        showScreen('home-screen');
    });
    
    // Score buttons
    document.querySelectorAll('.score-btn').forEach(btn => {
        btn.addEventListener('click', handleScoreAdjustment);
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    setTimeout(() => {
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'category-screen') {
            renderCategories();
        } else if (screenId === 'game-board-screen') {
            renderGameBoard();
        }
    }, 50);
}

function handleSignIn() {
    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;
    
    if (!username || !password) {
        alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('zahin_users') || '{}');
    
    if (users[username] && users[username].password === password) {
        gameState.username = username;
        loadAnsweredQuestions();
        showScreen('home-screen');
    } else {
        alert('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
}

function handleSignUp() {
    const fullname = document.getElementById('signup-fullname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;
    
    if (!fullname || !email || !username || !password || !confirmPassword) {
        alert('الرجاء ملء جميع الحقول');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('كلمتا المرور غير متطابقتين');
        return;
    }
    
    if (password.length < 6) {
        alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('zahin_users') || '{}');
    
    if (users[username]) {
        alert('اسم المستخدم مستخدم بالفعل');
        return;
    }
    
    users[username] = { fullname, email, password };
    localStorage.setItem('zahin_users', JSON.stringify(users));
    
    alert('تم إنشاء الحساب بنجاح! 🎉');
    
    gameState.username = username;
    loadAnsweredQuestions();
    showScreen('home-screen');
}

function showResetForm() {
    document.querySelectorAll('.login-form').forEach(form => form.classList.add('hidden'));
    document.getElementById('reset-form').classList.remove('hidden');
}

function handleResetPassword() {
    const email = document.getElementById('reset-email').value.trim();
    
    if (!email) {
        alert('الرجاء إدخال البريد الإلكتروني');
        return;
    }
    
    alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني 📧');
    
    document.querySelectorAll('.login-form').forEach(form => form.classList.add('hidden'));
    document.getElementById('signin-form').classList.remove('hidden');
}

function handleGuestLogin() {
    const guestName = prompt('أدخل اسمك للدخول كضيف:');
    if (guestName && guestName.trim()) {
        gameState.username = `ضيف_${guestName.trim()}`;
        loadAnsweredQuestions();
        showScreen('home-screen');
    }
}

function handleLogout() {
    gameState.username = '';
    gameState.answeredQuestions = [];
    
    document.getElementById('signin-username').value = '';
    document.getElementById('signin-password').value = '';
    document.getElementById('signup-fullname').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-password-confirm').value = '';
    
    showScreen('login-screen');
}

function closeQuestion() {
    stopTimer();
    showScreen('game-board-screen');
}

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';
    
    categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.categoryId = category.id;
        
        const img = document.createElement('img');
        img.src = category.image;
        img.alt = category.name;
        img.onerror = () => {
            card.style.background = 'linear-gradient(135deg, #b8a67d, #8b8577)';
            card.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 1.3rem; font-weight: 800; padding: 10px; color: #2d2923;">${category.name}</div>`;
        };
        
        card.appendChild(img);
        card.addEventListener('click', () => toggleCategory(category.id));
        grid.appendChild(card);
    });
    
    updateCategorySelection();
}

function toggleCategory(categoryId) {
    const index = gameState.selectedCategories.indexOf(categoryId);
    
    if (index > -1) {
        gameState.selectedCategories.splice(index, 1);
    } else {
        if (gameState.selectedCategories.length < 6) {
            gameState.selectedCategories.push(categoryId);
        } else {
            alert('يمكنك اختيار 6 فئات كحد أقصى');
        }
    }
    
    updateCategorySelection();
}

function updateCategorySelection() {
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
        const categoryId = card.dataset.categoryId;
        if (gameState.selectedCategories.includes(categoryId)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    const count = gameState.selectedCategories.length;
    document.getElementById('selected-count').textContent = `${count}/6`;
    
    const nextBtn = document.getElementById('next-categories-btn');
    nextBtn.disabled = count < 3;
}

function handleCategoriesNext() {
    if (gameState.selectedCategories.length >= 3) {
        showScreen('team-names-screen');
    }
}

function startGame() {
    const team1Name = document.getElementById('team1-name').value.trim() || 'فريق 1';
    const team2Name = document.getElementById('team2-name').value.trim() || 'فريق 2';
    
    gameState.team1 = { 
        name: team1Name, 
        score: 0, 
        lifelines: { double: true, block: true, call: true } 
    };
    gameState.team2 = { 
        name: team2Name, 
        score: 0, 
        lifelines: { double: true, block: true, call: true } 
    };
    
    loadGameQuestions();
    gameState.currentTurn = Math.random() > 0.5 ? 1 : 2;
    
    showScreen('game-board-screen');
}

function loadGameQuestions() {
    gameState.questions = [];
    
    if (!gameState.allQuestionsData) {
        console.error('Questions data not loaded');
        return;
    }
    
    gameState.selectedCategories.forEach(catId => {
        const category = categories.find(c => c.id === catId);
        let catQuestions = gameState.allQuestionsData[catId] || [];
        
        // Filter out already answered questions for this user
        catQuestions = catQuestions.filter(q => !isQuestionAnswered(q.id));
        
        if (catQuestions.length > 0) {
            // Shuffle questions randomly
            catQuestions = shuffleArray(catQuestions);
            
            // Get questions by point value (2 each)
            const q200 = catQuestions.filter(q => q.points === 200).slice(0, 2);
            const q400 = catQuestions.filter(q => q.points === 400).slice(0, 2);
            const q600 = catQuestions.filter(q => q.points === 600).slice(0, 2);
            
            // Add category info to each question
            [...q200, ...q400, ...q600].forEach(q => {
                q.categoryName = category.name;
                q.categoryImage = category.image;
                gameState.questions.push(q);
            });
        }
    });
    
    console.log(`Loaded ${gameState.questions.length} questions for this game`);
    
    // Check if we have enough questions
    if (gameState.questions.length < gameState.selectedCategories.length * 6) {
        alert('بعض الأسئلة قد نفذت في هذه الفئات. سيتم استخدام الأسئلة المتاحة فقط.');
    }
}

// Shuffle array function
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function renderGameBoard() {
    document.getElementById('team1-display').textContent = gameState.team1.name;
    document.getElementById('team2-display').textContent = gameState.team2.name;
    updateScores();
    
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    gameState.selectedCategories.forEach(catId => {
        const category = categories.find(c => c.id === catId);
        const column = document.createElement('div');
        column.className = 'category-column';
        column.dataset.categoryId = catId;
        
        const header = document.createElement('div');
        header.className = 'category-header';
        const img = document.createElement('img');
        img.src = category.image;
        img.alt = category.name;
        img.onerror = () => {
            header.style.background = 'linear-gradient(135deg, #b8a67d, #8b8577)';
            header.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.9rem; font-weight: 800; padding: 5px; color: #2d2923;">${category.name}</div>`;
        };
        header.appendChild(img);
        column.appendChild(header);
        
        const catQuestions = gameState.questions.filter(q => q.category === catId);
        const q200 = catQuestions.filter(q => q.points === 200);
        const q400 = catQuestions.filter(q => q.points === 400);
        const q600 = catQuestions.filter(q => q.points === 600);
        
        const orderedQuestions = [
            q200[0], q200[1], q400[0], q400[1], q600[0], q600[1]
        ];
        
        orderedQuestions.forEach((question, index) => {
            const cell = document.createElement('div');
            cell.className = 'question-cell';
            const points = index < 2 ? 200 : index < 4 ? 400 : 600;
            cell.textContent = points;
            
            if (question && !isQuestionAnswered(question.id)) {
                cell.addEventListener('click', () => openQuestion(question));
            } else {
                cell.classList.add('answered');
            }
            
            column.appendChild(cell);
        });
        
        const unanswered = catQuestions.filter(q => !isQuestionAnswered(q.id));
        if (unanswered.length === 0) {
            column.classList.add('depleted');
        }
        
        board.appendChild(column);
    });
}

function openQuestion(question) {
    gameState.currentQuestion = { ...question, originalPoints: question.points };
    
    if (!gameState.currentTurn) {
        gameState.currentTurn = Math.random() > 0.5 ? 1 : 2;
    }
    
    const img = document.getElementById('question-category-img');
    img.src = question.categoryImage;
    img.alt = question.categoryName;
    img.onerror = () => {
        img.style.display = 'none';
    };
    
    document.getElementById('question-text').textContent = question.question;
    
    loadQuestionImage(question.question);
    
    document.getElementById('answer-section').classList.add('hidden');
    document.getElementById('team-selection').classList.add('hidden');
    document.getElementById('show-answer-btn').style.display = 'block';
    
    const select1 = document.getElementById('select-team1');
    const select2 = document.getElementById('select-team2');
    const selectNone = document.querySelector('.team-select-btn[data-team="none"]');
    
    select1.textContent = gameState.team1.name;
    select2.textContent = gameState.team2.name;
    select1.style.display = 'block';
    select2.style.display = 'block';
    
    const newSelect1 = select1.cloneNode(true);
    const newSelect2 = select2.cloneNode(true);
    const newSelectNone = selectNone.cloneNode(true);
    
    select1.parentNode.replaceChild(newSelect1, select1);
    select2.parentNode.replaceChild(newSelect2, select2);
    selectNone.parentNode.replaceChild(newSelectNone, selectNone);
    
    newSelect1.addEventListener('click', () => handleAnswer(1));
    newSelect2.addEventListener('click', () => handleAnswer(2));
    newSelectNone.addEventListener('click', () => handleAnswer(0));
    
    renderLifelines();
    startTimer();
    
    showScreen('question-screen');
}

async function loadQuestionImage(questionText) {
    const imageContainer = document.getElementById('question-image-container');
    const imageElement = document.getElementById('question-image');
    
    imageContainer.style.display = 'none';
    
    try {
        const keywords = extractKeywords(questionText);
        
        if (!keywords) {
            return;
        }
        
        imageContainer.style.display = 'block';
        imageElement.classList.add('loading');
        imageElement.src = '';
        
        // Try Wikipedia API first (more reliable for general topics)
        const wikiUrl = `https://ar.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=400&titles=${encodeURIComponent(keywords)}`;
        
        const response = await fetch(wikiUrl);
        const data = await response.json();
        
        if (data.query && data.query.pages) {
            const pages = Object.values(data.query.pages);
            if (pages[0] && pages[0].thumbnail) {
                imageElement.src = pages[0].thumbnail.source;
                imageElement.classList.remove('loading');
                return;
            }
        }
        
        // Fallback to Wikimedia Commons search
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(keywords)}&srnamespace=6&srlimit=1&srprop=snippet`;
        
        const commonsResponse = await fetch(commonsUrl);
        const commonsData = await commonsResponse.json();
        
        if (commonsData.query && commonsData.query.search && commonsData.query.search.length > 0) {
            const fileName = commonsData.query.search[0].title;
            
            // Get image info
            const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=400`;
            
            const imageInfoResponse = await fetch(imageInfoUrl);
            const imageInfoData = await imageInfoResponse.json();
            
            if (imageInfoData.query && imageInfoData.query.pages) {
                const imagePages = Object.values(imageInfoData.query.pages);
                if (imagePages[0] && imagePages[0].imageinfo) {
                    const imageUrl = imagePages[0].imageinfo[0].thumburl || imagePages[0].imageinfo[0].url;
                    imageElement.src = imageUrl;
                    imageElement.classList.remove('loading');
                    imageElement.onerror = () => {
                        imageContainer.style.display = 'none';
                    };
                    return;
                }
            }
        }
        
        // If both failed, hide the container
        imageContainer.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading image:', error);
        imageContainer.style.display = 'none';
    }
}

function extractKeywords(questionText) {
    // Remove common Arabic question words and punctuation
    const commonWords = ['ما', 'من', 'هو', 'هي', 'كم', 'أين', 'متى', 'لماذا', 'كيف', 'هل', 'الذي', 'التي', 'في', 'إلى', 'على', 'عن', 'مع', 'أو', 'و', 'ف', 'ب', 'ل', 'ك', 'اسم', 'يسمى', 'تسمى', 'يلقب', 'الملقب'];
    
    // Clean and split
    let words = questionText
        .replace(/[؟?!،,.]/g, '')
        .split(' ')
        .filter(word => word.length > 2 && !commonWords.includes(word));
    
    // Get the most important word (usually the subject)
    // Prioritize words that are longer and appear later in the question
    if (words.length > 0) {
        // Take the longest meaningful word
        words.sort((a, b) => b.length - a.length);
        return words[0];
    }
    
    return null;
}

function showAnswer() {
    document.getElementById('answer-text').textContent = gameState.currentQuestion.answer;
    document.getElementById('answer-section').classList.remove('hidden');
    document.getElementById('team-selection').classList.remove('hidden');
    document.getElementById('show-answer-btn').style.display = 'none';
}

function handleAnswer(teamNumber) {
    stopTimer();
    
    if (teamNumber > 0) {
        const points = gameState.currentQuestion.points;
        if (teamNumber === 1) {
            gameState.team1.score += points;
        } else {
            gameState.team2.score += points;
        }
    }
    
    markQuestionAnswered(gameState.currentQuestion.id);
    gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
    
    if (isGameOver()) {
        endGame();
    } else {
        showScreen('game-board-screen');
    }
}

function renderLifelines() {
    const container = document.getElementById('lifelines-container');
    container.innerHTML = '';
    container.classList.remove('hidden');
    
    const currentTeam = gameState.currentTurn === 1 ? gameState.team1 : gameState.team2;
    
    if (currentTeam.lifelines.double) {
        const btn = document.createElement('button');
        btn.className = 'lifeline-btn';
        btn.textContent = '⚡ دبل النقاط';
        btn.addEventListener('click', () => useLifeline('double'));
        container.appendChild(btn);
    }
    
    if (currentTeam.lifelines.block) {
        const btn = document.createElement('button');
        btn.className = 'lifeline-btn';
        btn.textContent = '🚫 منع الإجابة';
        btn.addEventListener('click', () => useLifeline('block'));
        container.appendChild(btn);
    }
    
    if (currentTeam.lifelines.call) {
        const btn = document.createElement('button');
        btn.className = 'lifeline-btn';
        btn.textContent = '📞 اتصال بصديق';
        btn.addEventListener('click', () => useLifeline('call'));
        container.appendChild(btn);
    }
}

function useLifeline(type) {
    const currentTeam = gameState.currentTurn === 1 ? gameState.team1 : gameState.team2;
    currentTeam.lifelines[type] = false;
    
    if (type === 'double') {
        gameState.currentQuestion.points *= 2;
        alert(`تم مضاعفة النقاط! السؤال الآن يساوي ${gameState.currentQuestion.points} نقطة 🎉`);
    } else if (type === 'block') {
        const otherTeam = gameState.currentTurn === 1 ? 2 : 1;
        const otherBtn = document.getElementById(`select-team${otherTeam}`);
        if (otherBtn) {
            otherBtn.style.display = 'none';
        }
        alert('تم منع الفريق الآخر من الإجابة! 🚫');
    } else if (type === 'call') {
        alert('وقت الاتصال بصديق! المؤقت مستمر... 📞');
    }
    
    renderLifelines();
}

function startTimer() {
    gameState.timerSeconds = 0;
    updateTimerDisplay();
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timerSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timerSeconds / 60);
    const seconds = gameState.timerSeconds % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('question-timer').textContent = display;
}

function handleScoreAdjustment(e) {
    const team = parseInt(e.target.dataset.team);
    const action = e.target.dataset.action;
    
    if (team === 1) {
        gameState.team1.score += action === 'add' ? 100 : -100;
        gameState.team1.score = Math.max(0, gameState.team1.score);
    } else {
        gameState.team2.score += action === 'add' ? 100 : -100;
        gameState.team2.score = Math.max(0, gameState.team2.score);
    }
    
    updateScores();
}

function updateScores() {
    document.getElementById('team1-points').textContent = gameState.team1.score;
    document.getElementById('team2-points').textContent = gameState.team2.score;
}

function reportQuestion() {
    const reason = prompt('ما هو سبب البلاغ؟');
    if (reason && reason.trim()) {
        const report = {
            questionId: gameState.currentQuestion.id,
            question: gameState.currentQuestion.question,
            answer: gameState.currentQuestion.answer,
            category: gameState.currentQuestion.categoryName,
            reason: reason.trim(),
            timestamp: new Date().toISOString(),
            username: gameState.username
        };
        
        const reports = JSON.parse(localStorage.getItem('zahin_reports') || '[]');
        reports.push(report);
        localStorage.setItem('zahin_reports', JSON.stringify(reports));
        
        alert('تم إرسال البلاغ بنجاح! شكراً لك 🙏');
    }
}

function isQuestionAnswered(questionId) {
    return gameState.answeredQuestions.includes(questionId);
}

function markQuestionAnswered(questionId) {
    if (!gameState.answeredQuestions.includes(questionId)) {
        gameState.answeredQuestions.push(questionId);
        saveAnsweredQuestions();
    }
}

function loadAnsweredQuestions() {
    if (gameState.username) {
        const saved = localStorage.getItem(`zahin_answered_${gameState.username}`);
        if (saved) {
            try {
                gameState.answeredQuestions = JSON.parse(saved);
            } catch (e) {
                gameState.answeredQuestions = [];
            }
        }
    }
}

function saveAnsweredQuestions() {
    if (gameState.username) {
        localStorage.setItem(
            `zahin_answered_${gameState.username}`, 
            JSON.stringify(gameState.answeredQuestions)
        );
    }
}

function isGameOver() {
    return gameState.questions.every(q => isQuestionAnswered(q.id));
}

function endGame() {
    const score1 = gameState.team1.score;
    const score2 = gameState.team2.score;
    
    if (score1 === score2) {
        showTiebreaker();
    } else {
        showWinScreen();
    }
}

function showWinScreen() {
    const score1 = gameState.team1.score;
    const score2 = gameState.team2.score;
    
    document.getElementById('final-team1-name').textContent = gameState.team1.name;
    document.getElementById('final-team1-score').textContent = score1;
    document.getElementById('final-team2-name').textContent = gameState.team2.name;
    document.getElementById('final-team2-score').textContent = score2;
    
    if (score1 > score2) {
        document.getElementById('win-title').textContent = `🎉 ${gameState.team1.name} فاز! 🎉`;
    } else if (score2 > score1) {
        document.getElementById('win-title').textContent = `🎉 ${gameState.team2.name} فاز! 🎉`;
    } else {
        document.getElementById('win-title').textContent = '🤝 تعادل! 🤝';
    }
    
    showScreen('win-screen');
}

function showTiebreaker() {
    // Use the tiebreaker from the loaded game file
    const tiebreakerQ = gameState.tiebreakerQuestion || {
        question: 'سؤال كسر التعادل: ما هي عاصمة أستراليا؟',
        answer: 'كانبيرا'
    };
    
    document.getElementById('tiebreaker-question').textContent = tiebreakerQ.question;
    document.getElementById('tiebreaker-answer-text').textContent = tiebreakerQ.answer;
    document.getElementById('tiebreaker-answer').classList.add('hidden');
    document.getElementById('tiebreaker-selection').classList.add('hidden');
    
    const showBtn = document.getElementById('show-tiebreaker-answer');
    const newShowBtn = showBtn.cloneNode(true);
    showBtn.parentNode.replaceChild(newShowBtn, showBtn);
    
    newShowBtn.addEventListener('click', () => {
        document.getElementById('tiebreaker-answer').classList.remove('hidden');
        document.getElementById('tiebreaker-selection').classList.remove('hidden');
    });
    
    const buttons = document.querySelectorAll('#tiebreaker-selection .team-select-btn');
    buttons.forEach((btn, index) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.textContent = index === 0 ? gameState.team1.name : gameState.team2.name;
        newBtn.addEventListener('click', () => {
            if (index === 0) {
                gameState.team1.score += 800;
            } else {
                gameState.team2.score += 800;
            }
            showWinScreen();
        });
    });
    
    showScreen('tiebreaker-screen');
}

function newGame() {
    gameState.selectedCategories = [];
    gameState.team1 = { name: 'فريق 1', score: 0, lifelines: { double: true, block: true, call: true } };
    gameState.team2 = { name: 'فريق 2', score: 0, lifelines: { double: true, block: true, call: true } };
    gameState.currentTurn = 1;
    gameState.questions = [];
    gameState.currentQuestion = null;
    
    document.getElementById('team1-name').value = 'فريق 1';
    document.getElementById('team2-name').value = 'فريق 2';
    
    showScreen('category-screen');
}

function resetGame() {
    gameState.selectedCategories = [];
    gameState.team1 = { name: 'فريق 1', score: 0, lifelines: { double: true, block: true, call: true } };
    gameState.team2 = { name: 'فريق 2', score: 0, lifelines: { double: true, block: true, call: true } };
    gameState.currentTurn = 1;
    gameState.questions = [];
    gameState.currentQuestion = null;
    
    document.getElementById('team1-name').value = 'فريق 1';
    document.getElementById('team2-name').value = 'فريق 2';
}