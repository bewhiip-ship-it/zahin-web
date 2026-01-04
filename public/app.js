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
    timerSeconds: 0
};

// Categories Data
const categories = [
    { id: 'islamic', name: 'الإسلاميات', image: 'images/islamic.jpg' },
    { id: 'science', name: 'العلوم والاختراعات', image: 'images/science.jpg' },
    { id: 'arabic', name: 'اللغة العربية والأدب', image: 'images/arabic.jpg' },
    { id: 'sports', name: 'الرياضة والتاريخ الرياضي', image: 'images/sports.jpg' },
    { id: 'history', name: 'التاريخ والجغرافيا', image: 'images/history.jpg' },
    { id: 'nature', name: 'الحيوان والنبات', image: 'images/nature.jpg' },
    { id: 'people', name: 'الألقاب والشخصيات', image: 'images/people.jpg' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Show splash for 3 seconds
    setTimeout(() => {
        showScreen('login-screen');
    }, 3000);
    
    // Load answered questions from localStorage
    loadAnsweredQuestions();
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('username-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Home
    document.getElementById('start-game-btn').addEventListener('click', () => showScreen('category-screen'));
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Categories
    document.getElementById('next-categories-btn').addEventListener('click', handleCategoriesNext);
    
    // Team Names
    document.getElementById('start-playing-btn').addEventListener('click', startGame);
    
    // Question
    document.getElementById('show-answer-btn').addEventListener('click', showAnswer);
    document.getElementById('report-btn').addEventListener('click', reportQuestion);
    
    // Win Screen
    document.getElementById('new-game-btn').addEventListener('click', newGame);
    document.getElementById('home-btn').addEventListener('click', () => showScreen('home-screen'));
    
    // Score buttons
    document.querySelectorAll('.score-btn').forEach(btn => {
        btn.addEventListener('click', handleScoreAdjustment);
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Special screen initializations
    if (screenId === 'category-screen') {
        renderCategories();
    } else if (screenId === 'game-board-screen') {
        renderGameBoard();
    }
}

function handleLogin() {
    const username = document.getElementById('username-input').value.trim();
    if (username) {
        gameState.username = username;
        showScreen('home-screen');
    }
}

function handleLogout() {
    gameState.username = '';
    document.getElementById('username-input').value = '';
    showScreen('login-screen');
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
            // Fallback if image doesn't exist
            card.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
            card.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 1.5rem; font-weight: bold;">${category.name}</div>`;
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
    showScreen('team-names-screen');
}

function startGame() {
    const team1Name = document.getElementById('team1-name').value.trim() || 'فريق 1';
    const team2Name = document.getElementById('team2-name').value.trim() || 'فريق 2';
    
    gameState.team1.name = team1Name;
    gameState.team2.name = team2Name;
    gameState.team1.score = 0;
    gameState.team2.score = 0;
    
    // Load questions for selected categories
    loadQuestions();
    
    // Random first turn
    gameState.currentTurn = Math.random() > 0.5 ? 1 : 2;
    
    showScreen('game-board-screen');
}

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        
        // Filter questions by selected categories
        gameState.questions = [];
        gameState.selectedCategories.forEach(catId => {
            const catQuestions = data[catId] || [];
            // Get 6 questions per category (2x200, 2x400, 2x600)
            const questions200 = catQuestions.filter(q => q.points === 200).slice(0, 2);
            const questions400 = catQuestions.filter(q => q.points === 400).slice(0, 2);
            const questions600 = catQuestions.filter(q => q.points === 600).slice(0, 2);
            
            gameState.questions.push(...questions200, ...questions400, ...questions600);
        });
    } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback: create dummy questions
        createDummyQuestions();
    }
}

function createDummyQuestions() {
    gameState.questions = [];
    gameState.selectedCategories.forEach((catId, index) => {
        const category = categories.find(c => c.id === catId);
        [200, 200, 400, 400, 600, 600].forEach((points, qIndex) => {
            gameState.questions.push({
                id: `${catId}_${qIndex}`,
                category: catId,
                categoryName: category.name,
                categoryImage: category.image,
                points: points,
                question: `سؤال تجريبي ${points} نقطة - ${category.name}`,
                answer: `إجابة تجريبية`
            });
        });
    });
}

function renderGameBoard() {
    // Update team names and scores
    document.getElementById('team1-display').textContent = gameState.team1.name;
    document.getElementById('team2-display').textContent = gameState.team2.name;
    updateScores();
    
    // Render board
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    gameState.selectedCategories.forEach(catId => {
        const category = categories.find(c => c.id === catId);
        const column = document.createElement('div');
        column.className = 'category-column';
        column.dataset.categoryId = catId;
        
        // Category header
        const header = document.createElement('div');
        header.className = 'category-header';
        const img = document.createElement('img');
        img.src = category.image;
        img.alt = category.name;
        img.onerror = () => {
            header.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
            header.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 1rem; font-weight: bold; padding: 5px;">${category.name}</div>`;
        };
        header.appendChild(img);
        column.appendChild(header);
        
        // Questions
        const catQuestions = gameState.questions.filter(q => q.category === catId);
        [200, 200, 400, 400, 600, 600].forEach((points, index) => {
            const question = catQuestions[index];
            const cell = document.createElement('div');
            cell.className = 'question-cell';
            cell.textContent = points;
            
            if (question && !isQuestionAnswered(question.id)) {
                cell.addEventListener('click', () => openQuestion(question));
            } else {
                cell.classList.add('answered');
            }
            
            column.appendChild(cell);
        });
        
        // Check if category is depleted
        const unanswered = catQuestions.filter(q => !isQuestionAnswered(q.id));
        if (unanswered.length === 0) {
            column.classList.add('depleted');
        }
        
        board.appendChild(column);
    });
}

function openQuestion(question) {
    gameState.currentQuestion = question;
    
    // Set category image
    const img = document.getElementById('question-category-img');
    img.src = question.categoryImage;
    img.alt = question.categoryName;
    
    // Set question text
    document.getElementById('question-text').textContent = question.question;
    
    // Hide answer initially
    document.getElementById('answer-section').classList.add('hidden');
    document.getElementById('team-selection').classList.add('hidden');
    document.getElementById('show-answer-btn').style.display = 'block';
    
    // Setup team selection buttons
    document.getElementById('select-team1').textContent = gameState.team1.name;
    document.getElementById('select-team2').textContent = gameState.team2.name;
    
    // Add event listeners for team selection
    document.querySelectorAll('.team-select-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Remove old listeners
    });
    
    document.getElementById('select-team1').addEventListener('click', () => handleAnswer(1));
    document.getElementById('select-team2').addEventListener('click', () => handleAnswer(2));
    document.querySelector('.team-select-btn[data-team="none"]').addEventListener('click', () => handleAnswer(0));
    
    // Show lifelines for current turn
    renderLifelines();
    
    // Start timer
    startTimer();
    
    showScreen('question-screen');
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
    
    // Mark question as answered
    markQuestionAnswered(gameState.currentQuestion.id);
    
    // Switch turn
    gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
    
    // Check if game is over
    if (isGameOver()) {
        endGame();
    } else {
        showScreen('game-board-screen');
    }
}

function renderLifelines() {
    const container = document.getElementById('lifelines-container');
    container.innerHTML = '';
    
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
    
    container.classList.remove('hidden');
}

function useLifeline(type) {
    const currentTeam = gameState.currentTurn === 1 ? gameState.team1 : gameState.team2;
    currentTeam.lifelines[type] = false;
    
    if (type === 'double') {
        gameState.currentQuestion.points *= 2;
        alert('تم مضاعفة النقاط! 🎉');
    } else if (type === 'block') {
        const otherTeam = gameState.currentTurn === 1 ? 2 : 1;
        const otherBtn = document.getElementById(`select-team${otherTeam}`);
        if (otherBtn) otherBtn.style.display = 'none';
        alert('تم منع الفريق الآخر من الإجابة! 🚫');
    } else if (type === 'call') {
        alert('وقت الاتصال بصديق! المؤقت مستمر... 📞');
    }
    
    renderLifelines();
}

function startTimer() {
    gameState.timerSeconds = 0;
    updateTimerDisplay();
    
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
    const reason = prompt('سبب البلاغ:');
    if (reason) {
        const report = {
            questionId: gameState.currentQuestion.id,
            question: gameState.currentQuestion.question,
            answer: gameState.currentQuestion.answer,
            reason: reason,
            timestamp: new Date().toISOString(),
            username: gameState.username
        };
        
        // Save to localStorage
        const reports = JSON.parse(localStorage.getItem('zahin_reports') || '[]');
        reports.push(report);
        localStorage.setItem('zahin_reports', JSON.stringify(reports));
        
        alert('تم إرسال البلاغ! شكراً لك 🙏');
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
    const saved = localStorage.getItem(`zahin_answered_${gameState.username}`);
    if (saved) {
        gameState.answeredQuestions = JSON.parse(saved);
    }
}

function saveAnsweredQuestions() {
    localStorage.setItem(`zahin_answered_${gameState.username}`, JSON.stringify(gameState.answeredQuestions));
}

function isGameOver() {
    return gameState.questions.every(q => isQuestionAnswered(q.id));
}

function endGame() {
    const score1 = gameState.team1.score;
    const score2 = gameState.team2.score;
    
    if (score1 === score2) {
        // Tiebreaker
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
    // Load a hard tiebreaker question
    const tiebreakerQ = {
        question: 'سؤال كسر التعادل الصعب هنا',
        answer: 'الإجابة الصعبة هنا'
    };
    
    document.getElementById('tiebreaker-question').textContent = tiebreakerQ.question;
    document.getElementById('tiebreaker-answer-text').textContent = tiebreakerQ.answer;
    document.getElementById('tiebreaker-answer').classList.add('hidden');
    document.getElementById('tiebreaker-selection').classList.add('hidden');
    
    // Setup buttons
    document.getElementById('show-tiebreaker-answer').addEventListener('click', () => {
        document.getElementById('tiebreaker-answer').classList.remove('hidden');
        document.getElementById('tiebreaker-selection').classList.remove('hidden');
    });
    
    document.querySelectorAll('#tiebreaker-selection .team-select-btn').forEach((btn, index) => {
        btn.textContent = index === 0 ? gameState.team1.name : gameState.team2.name;
        btn.addEventListener('click', () => {
            if (index === 0) {
                gameState.team1.score += 1000;
            } else {
                gameState.team2.score += 1000;
            }
            showWinScreen();
        });
    });
    
    showScreen('tiebreaker-screen');
}

function newGame() {
    // Reset game state but keep username and answered questions
    gameState.selectedCategories = [];
    gameState.team1 = { name: 'فريق 1', score: 0, lifelines: { double: true, block: true, call: true } };
    gameState.team2 = { name: 'فريق 2', score: 0, lifelines: { double: true, block: true, call: true } };
    gameState.currentTurn = 1;
    gameState.questions = [];
    gameState.currentQuestion = null;
    
    showScreen('category-screen');
}