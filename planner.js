// ==========================================================================
// STATE MANAGEMENT & LOCAL STORAGE
// ==========================================================================

const DEFAULT_STATE = {
    level: 1,
    xp: 0,
    streak: 0,
    penalties: 0,
    totalBooksRead: 0,
    totalQuestionsSolved: 0,
    totalGuitarRepeats: 0,
    guitarGoal: 5,
    completedHours: 0,
    books: [], // Array of { title: string, date: string }
    solvedQuestionsLog: {}, // YYYY-MM-DD -> number
    guitarRepeatsLog: {}, // YYYY-MM-DD -> number
    completedTasksLog: {}, // YYYY-MM-DD -> Array of booleans representing completion of each slot
    extraTasks: {}, // YYYY-MM-DD -> Array of extra task objects
    schedules: {}, // YYYY-MM-DD -> Array of study subjects for slots 2,3,4
    lastCheckDate: null,
    weights: {
        "Matematik": 35,
        "Türkçe": 25,
        "Fen Bilgisi": 20,
        "Hayat Bilgisi": 20
    },
    unlockedBadges: []
};

let state = { ...DEFAULT_STATE };

function loadState() {
    const saved = localStorage.getItem("ders_yildizi_state");
    if (saved) {
        try {
            state = JSON.parse(saved);
            
            // Migration logic for old violin properties to guitar
            if (state.totalViolinRepeats !== undefined) {
                state.totalGuitarRepeats = state.totalViolinRepeats;
                delete state.totalViolinRepeats;
            }
            if (state.violinGoal !== undefined) {
                state.guitarGoal = state.violinGoal;
                delete state.violinGoal;
            }
            if (state.violinRepeatsLog !== undefined) {
                state.guitarRepeatsLog = state.violinRepeatsLog;
                delete state.violinRepeatsLog;
            }
            if (state.unlockedBadges) {
                state.unlockedBadges = state.unlockedBadges.map(badgeId => {
                    if (badgeId === "violin_1") return "guitar_1";
                    if (badgeId === "violin_50") return "guitar_50";
                    if (badgeId === "violin_150") return "guitar_150";
                    return badgeId;
                });
            }

            // Ensure backwards compatibility with any new keys
            for (let key in DEFAULT_STATE) {
                if (state[key] === undefined) {
                    state[key] = DEFAULT_STATE[key];
                }
            }
        } catch (e) {
            console.error("Error parsing saved state, resetting to default.", e);
            state = { ...DEFAULT_STATE };
        }
    }
}

function saveState() {
    localStorage.setItem("ders_yildizi_state", JSON.stringify(state));
}

// ==========================================================================
// SEEDED RANDOM & SCHEDULER
// ==========================================================================

// Seeded random helper for deterministic scheduling per date
function seededRandom(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(Math.sin(hash)) % 1;
}

// Get weighted subject based on current weights
function getWeightedSubject(seed, excludeList = []) {
    let activeWeights = { ...state.weights };
    excludeList.forEach(sub => delete activeWeights[sub]);
    
    let total = Object.values(activeWeights).reduce((a, b) => a + b, 0);
    if (total === 0) {
        activeWeights = { ...state.weights }; // fallback
        total = Object.values(activeWeights).reduce((a, b) => a + b, 0);
    }
    
    let r = seededRandom(seed) * total;
    let sum = 0;
    for (let sub in activeWeights) {
        sum += activeWeights[sub];
        if (r <= sum) return sub;
    }
    return "Matematik";
}

// Generate the 5 default daily tasks for a given date
function getDailyTasks(dateStr) {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
    
    // Day serial to determine alternating English and Reading 2
    // Monday = English (alternates: Day 0 = English, Day 1 = Reading 2, Day 2 = English...)
    // We compute days since a fixed epoch (Monday, Jan 5, 1970 is standard, but we'll use day timestamp)
    const daySerial = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    const isEnglishDay = daySerial % 2 === 0;

    // Slots array
    const tasks = [];

    // Slot 1: Okuma 1 (Daily, 30m, locked)
    tasks.push({
        title: "Kitap Okuma Saati - 1 📖",
        duration: 30,
        type: "reading",
        locked: true,
        subject: "Okuma"
    });

    // Slot 2: English or Reading 2 (Alternating, 30m, locked)
    if (isEnglishDay) {
        tasks.push({
            title: "İngilizce Çalışma Saati 🇬🇧",
            duration: 30,
            type: "english",
            locked: true,
            subject: "İngilizce"
        });
    } else {
        tasks.push({
            title: "Kitap Okuma Saati - 2 📖",
            duration: 30,
            type: "reading",
            locked: true,
            subject: "Okuma"
        });
    }

    // Slots 3, 4, 5: Three study sessions (30m, swappable) - ONLY on weekdays
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 = Sunday, 6 = Saturday
    if (!isWeekend) {
        // Check if we already generated subjects for this day in state
        if (!state.schedules[dateStr]) {
            const sub1 = getWeightedSubject(dateStr + "_s1");
            const sub2 = getWeightedSubject(dateStr + "_s2", [sub1]);
            const sub3 = getWeightedSubject(dateStr + "_s3", [sub1, sub2]);
            state.schedules[dateStr] = [sub1, sub2, sub3];
            saveState();
        }

        const studySubjects = state.schedules[dateStr];
        studySubjects.forEach((sub, idx) => {
            let emoji = "✏️";
            if (sub === "Matematik") emoji = "🧮";
            else if (sub === "Fen Bilgisi") emoji = "🧪";
            else if (sub === "Hayat Bilgisi") emoji = "🌍";
            else if (sub === "Türkçe") emoji = "📚";

            tasks.push({
                title: `${sub} Çalışması ${emoji}`,
                duration: 30,
                type: "study",
                locked: false,
                subject: sub
            });
        });
    }

    // Slot 6: Gitar Pratiği (Daily, locked)
    tasks.push({
        title: "Gitar Pratiği 🎸",
        duration: 0,
        type: "guitar",
        locked: true,
        subject: "Gitar"
    });

    // Append extra tasks if any exist for this day
    const extras = state.extraTasks[dateStr] || [];
    extras.forEach((ext, idx) => {
        tasks.push({
            title: ext.title,
            duration: ext.duration,
            type: "extra",
            locked: false,
            subject: ext.subject || "Ekstra",
            extraIndex: idx
        });
    });

    return tasks;
}

// Get completion array for a date
function getCompletionArray(dateStr, totalCount) {
    if (!state.completedTasksLog[dateStr]) {
        state.completedTasksLog[dateStr] = Array(totalCount).fill(false);
        saveState();
    }
    // Pad array if extra tasks were added
    while (state.completedTasksLog[dateStr].length < totalCount) {
        state.completedTasksLog[dateStr].push(false);
    }
    return state.completedTasksLog[dateStr];
}

// ==========================================================================
// SOUND SYNTHESIS ENGINE (Web Audio API)
// ==========================================================================

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Sparkling success chime
function playSuccessSound() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
    });
}

// Triumphant Level-up arpeggio
function playLevelUpSound() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51]; // C4 arpeggio
    
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = idx % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.4);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.45);
    });
}

// Gentle Alarm Tune
let alarmInterval = null;
let alarmOscillators = [];

function playAlarmSound() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (alarmInterval) return; // already playing
    
    let tick = true;
    alarmInterval = setInterval(() => {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(tick ? 880 : 660, now); // Alternate A5 and E5
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.5);
        
        tick = !tick;
    }, 500);
}

function stopAlarmSound() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
}

// ==========================================================================
// GAMIFICATION: XP, LEVEL, BADGES, PENALTIES
// ==========================================================================

function addXP(amount) {
    state.xp += amount;
    
    // Level Up check (100 XP per level)
    let leveledUp = false;
    while (state.xp >= 100) {
        state.xp -= 100;
        state.level += 1;
        leveledUp = true;
    }
    
    if (leveledUp) {
        setTimeout(() => {
            playLevelUpSound();
            alert(`Tebrikler! Seviye Atladın! 🎉 Şuan ${state.level}. Seviyedesin! ⭐`);
        }, 600);
    }
    
    saveState();
    updateHeaderStats();
}

const BADGES = [
    { id: "first_task", title: "İlk Yıldız", desc: "İlk görevini başarıyla tamamla", icon: "⭐" },
    { id: "math_50", title: "Matematik Sever", desc: "Matematikte toplam 50 soru çöz", icon: "🧮" },
    { id: "math_150", title: "Soru Canavarı", desc: "Matematikte toplam 150 soru çöz", icon: "🧠" },
    { id: "books_3", title: "Kitap Dostu", desc: "Toplam 3 kitap bitir", icon: "📚" },
    { id: "books_10", title: "Kütüphaneci", desc: "Toplam 10 kitap bitir", icon: "🏰" },
    { id: "english_streak", title: "Global Yıldız", desc: "5 İngilizce görevi tamamla", icon: "🇬🇧" },
    { id: "guitar_1", title: "Müzisyen Adayı", desc: "İlk Gitar pratiğini tamamla", icon: "🎸" },
    { id: "guitar_50", title: "Gitar Virtüözü", desc: "Toplam 50 Gitar tekrarı yap", icon: "🎵" },
    { id: "guitar_150", title: "Melodi Kraliçesi", desc: "Toplam 150 Gitar tekrarı yap", icon: "🎶" },
    { id: "perfect_day", title: "Günün Kahramanı", desc: "Gündeki tüm görevleri eksiksiz yap", icon: "👑" },
    { id: "streak_3", title: "Harika Başlangıç", desc: "3 gün üst üste seri yap", icon: "🔥" },
    { id: "streak_7", title: "Efsane Haftalık", desc: "7 gün üst üste seri yap", icon: "🏆" }
];

function checkAndUnlockBadges() {
    let newlyUnlocked = [];

    // Helper function to check if badge is already unlocked
    const isUnlocked = (id) => state.unlockedBadges.includes(id);

    // Badge 1: First Task
    if (!isUnlocked("first_task")) {
        // Check if at least one task is completed in any date
        let done = Object.values(state.completedTasksLog).some(arr => arr.includes(true));
        if (done) newlyUnlocked.push("first_task");
    }

    // Badge 2 & 3: Math Solved
    if (!isUnlocked("math_50") && state.totalQuestionsSolved >= 50) newlyUnlocked.push("math_50");
    if (!isUnlocked("math_150") && state.totalQuestionsSolved >= 150) newlyUnlocked.push("math_150");

    // Badge 4 & 5: Books Read
    if (!isUnlocked("books_3") && state.totalBooksRead >= 3) newlyUnlocked.push("books_3");
    if (!isUnlocked("books_10") && state.totalBooksRead >= 10) newlyUnlocked.push("books_10");

    // Badge 6: English Completion Count
    if (!isUnlocked("english_streak")) {
        // Count how many English tasks are completed across logs
        let englishCount = 0;
        for (let date in state.completedTasksLog) {
            const tasks = getDailyTasks(date);
            const comp = state.completedTasksLog[date];
            tasks.forEach((t, i) => {
                if (t.type === "english" && comp[i]) englishCount++;
            });
        }
        if (englishCount >= 5) newlyUnlocked.push("english_streak");
    }

    // Guitar Badges
    if (!isUnlocked("guitar_1")) {
        let done = Object.keys(state.completedTasksLog).some(date => {
            const tasks = getDailyTasks(date);
            const comp = state.completedTasksLog[date];
            const guitarIdx = tasks.findIndex(t => t.type === "guitar");
            return guitarIdx !== -1 && comp && comp[guitarIdx] === true;
        });
        if (done) newlyUnlocked.push("guitar_1");
    }
    if (!isUnlocked("guitar_50") && state.totalGuitarRepeats >= 50) newlyUnlocked.push("guitar_50");
    if (!isUnlocked("guitar_150") && state.totalGuitarRepeats >= 150) newlyUnlocked.push("guitar_150");

    // Badge 7: Perfect Day
    if (!isUnlocked("perfect_day")) {
        let perfect = Object.keys(state.completedTasksLog).some(date => {
            const tasks = getDailyTasks(date);
            const comp = state.completedTasksLog[date];
            return comp.length >= tasks.length && comp.slice(0, tasks.length).every(v => v === true);
        });
        if (perfect) newlyUnlocked.push("perfect_day");
    }

    // Badge 8 & 9: Streak
    if (!isUnlocked("streak_3") && state.streak >= 3) newlyUnlocked.push("streak_3");
    if (!isUnlocked("streak_7") && state.streak >= 7) newlyUnlocked.push("streak_7");

    if (newlyUnlocked.length > 0) {
        state.unlockedBadges.push(...newlyUnlocked);
        saveState();
        setTimeout(() => {
            playLevelUpSound();
            newlyUnlocked.forEach(id => {
                const b = BADGES.find(x => x.id === id);
                alert(`🏆 Yeni Rozet Kazandın: "${b.title}"!\n${b.desc}`);
            });
            renderBadges();
        }, 1000);
    }
}

// ==========================================================================
// DATE HANDLERS & DAY TRANSITION (Streak / Penalties Engine)
// ==========================================================================

function getTodayStr() {
    const d = new Date();
    // Return format YYYY-MM-DD local time
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getYesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Check for day transitions to increase penalties or adjust streak
function handleDayTransition() {
    const todayStr = getTodayStr();
    
    if (state.lastCheckDate && state.lastCheckDate !== todayStr) {
        // Let's check all dates between state.lastCheckDate and todayStr
        let start = new Date(state.lastCheckDate);
        let end = new Date(todayStr);
        
        // Loop through each day up to yesterday
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const checkStr = d.toISOString().split('T')[0];
            
            // Generate tasks for this historical day
            const tasks = getDailyTasks(checkStr);
            const comp = state.completedTasksLog[checkStr];
            
            if (comp) {
                const completedAll = tasks.every((t, i) => comp[i] === true);
                if (!completedAll) {
                    // Missed some tasks!
                    state.penalties += 1;
                    state.streak = 0; // Break the streak
                } else {
                    // Completed all tasks for this day
                    // Wait, we only increment streak if they weren't already accounted for.
                    // To keep streak simple, we will evaluate it based on consecutive perfect days
                }
            } else {
                // Day was completely skipped (no interactions at all)
                state.penalties += 1;
                state.streak = 0;
            }
        }
        
        // Recalculate streak
        recalculateStreak();
    }
    
    state.lastCheckDate = todayStr;
    saveState();
}

function recalculateStreak() {
    let currentStreak = 0;
    let d = new Date();
    
    // We check today, yesterday, and go backwards
    // If today is complete, we count it. If not, streak depends on yesterday.
    let checkDate = new Date(d);
    
    // If yesterday is fully completed, streak is active.
    // Let's loop back
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const tasks = getDailyTasks(dateStr);
        const comp = state.completedTasksLog[dateStr];
        
        if (comp && tasks.every((t, i) => comp[i] === true)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // If it is today, we don't break the streak yet because the day is still running!
            if (dateStr === getTodayStr()) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break; // Streak broken
        }
    }
    
    state.streak = currentStreak;
    saveState();
}

// ==========================================================================
// ADAPTIVE SCHEDULING ALGORITHM
// ==========================================================================

function runAdaptiveScheduling() {
    // Count task completions over the last 7 days for study subjects
    const subjects = ["Matematik", "Türkçe", "Fen Bilgisi", "Hayat Bilgisi"];
    const attempts = { "Matematik": 0, "Türkçe": 0, "Fen Bilgisi": 0, "Hayat Bilgisi": 0 };
    const completions = { "Matematik": 0, "Türkçe": 0, "Fen Bilgisi": 0, "Hayat Bilgisi": 0 };

    const today = new Date();
    for (let i = 1; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const tasks = getDailyTasks(dateStr);
        const comp = state.completedTasksLog[dateStr];
        if (comp) {
            tasks.forEach((t, idx) => {
                if (t.type === "study" && subjects.includes(t.subject)) {
                    attempts[t.subject]++;
                    if (comp[idx]) {
                        completions[t.subject]++;
                    }
                }
            });
        }
    }

    // Determine if any subject is neglected (completions/attempts < 0.4 and attempts > 0)
    let neglectedSubject = null;
    let minRate = 1.0;
    
    for (let sub of subjects) {
        if (attempts[sub] >= 2) {
            const rate = completions[sub] / attempts[sub];
            if (rate < 0.5 && rate < minRate) {
                minRate = rate;
                neglectedSubject = sub;
            }
        }
    }

    const msgEl = document.getElementById("adaptiveMessage");
    if (neglectedSubject) {
        // Boost this subject's weight slightly for future generations
        // We add 10 to neglected, and subtract from others
        const boostAmt = 10;
        let newWeights = { ...state.weights };
        newWeights[neglectedSubject] += boostAmt;
        
        // Subtract from other subjects proportionally
        let otherTotal = 0;
        subjects.forEach(sub => {
            if (sub !== neglectedSubject) otherTotal += state.weights[sub];
        });
        
        subjects.forEach(sub => {
            if (sub !== neglectedSubject) {
                const proportion = state.weights[sub] / otherTotal;
                newWeights[sub] = Math.max(10, Math.round(newWeights[sub] - boostAmt * proportion));
            }
        });

        // Normalize sum to 100
        let sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
        let diff = 100 - sum;
        newWeights["Matematik"] += diff; // adjust math for rounding errors

        state.weights = newWeights;
        saveState();

        if (msgEl) {
            msgEl.innerHTML = `
                <i data-lucide="sparkles" class="text-gold" style="width:16px;height:16px;"></i>
                <span>Görüşümüze göre son günlerde <strong>${neglectedSubject}</strong> çalışmasını biraz aksattın. Sana destek olmak için programda <strong>${neglectedSubject}</strong> sıklığını arttırdık! 🌟</span>
            `;
            lucide.createIcons();
        }
    } else {
        // Reset to standard weights if all balanced
        state.weights = {
            "Matematik": 35,
            "Türkçe": 25,
            "Fen Bilgisi": 20,
            "Hayat Bilgisi": 20
        };
        saveState();
        if (msgEl) {
            msgEl.innerHTML = `
                <i data-lucide="smile" class="text-gold" style="width:16px;height:16px;"></i>
                <span>Harika! Bütün derslerdeki ilerlemen dengeli görünüyor. Böyle devam et! 🌟</span>
            `;
            lucide.createIcons();
        }
    }
}

// ==========================================================================
// UI RENDERERS
// ==========================================================================

let activeDateStr = getTodayStr();

// Helper to parse local YYYY-MM-DD
function parseLocalDate(dateStr) {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

let calendarViewDate = parseLocalDate(activeDateStr);

function getWeekRange(dateStr) {
    const d = parseLocalDate(dateStr);
    const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    
    const y1 = monday.getFullYear(), m1 = String(monday.getMonth() + 1).padStart(2, '0'), d1 = String(monday.getDate()).padStart(2, '0');
    const y2 = sunday.getFullYear(), m2 = String(sunday.getMonth() + 1).padStart(2, '0'), d2 = String(sunday.getDate()).padStart(2, '0');
    
    return {
        mondayStr: `${y1}-${m1}-${d1}`,
        sundayStr: `${y2}-${m2}-${d2}`,
        mondayDate: monday,
        sundayDate: sunday
    };
}

function getMonthRange(dateStr) {
    const d = parseLocalDate(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const y1 = firstDay.getFullYear(), m1 = String(firstDay.getMonth() + 1).padStart(2, '0'), d1 = "01";
    const y2 = lastDay.getFullYear(), m2 = String(lastDay.getMonth() + 1).padStart(2, '0'), d2 = String(lastDay.getDate()).padStart(2, '0');
    
    return {
        startStr: `${y1}-${m1}-${d1}`,
        endStr: `${y2}-${m2}-${d2}`,
        firstDay: firstDay,
        lastDay: lastDay,
        totalDays: lastDay.getDate()
    };
}

function isDateInPeriod(dateStr) {
    if (reportPeriod === 'day') {
        return dateStr === activeDateStr;
    } else if (reportPeriod === 'week') {
        const { mondayStr, sundayStr } = getWeekRange(activeDateStr);
        return dateStr >= mondayStr && dateStr <= sundayStr;
    } else if (reportPeriod === 'month') {
        const { startStr, endStr } = getMonthRange(activeDateStr);
        return dateStr >= startStr && dateStr <= endStr;
    } else if (reportPeriod === 'custom') {
        const startVal = document.getElementById("reportStartDate").value;
        const endVal = document.getElementById("reportEndDate").value;
        let start = "0000-00-00";
        let end = "9999-99-99";
        if (startVal) start = startVal;
        if (endVal) end = endVal;
        return dateStr >= start && dateStr <= end;
    } else {
        // all
        return true;
    }
}

function updateHeaderStats() {
    document.getElementById("statStreak").innerText = state.streak;
    document.getElementById("statLevel").innerText = state.level;
    document.getElementById("statPenalties").innerText = state.penalties;
    
    // XP Bar
    const xpBar = document.getElementById("xpBarInner");
    xpBar.style.width = `${state.xp}%`;
    document.getElementById("xpText").innerText = `${state.xp} / 100 XP`;

    // Filtered Mini Stats
    let booksRead = 0;
    state.books.forEach(book => {
        if (isDateInPeriod(book.date)) {
            booksRead++;
        }
    });
    
    let questionsSolved = 0;
    for (let date in state.solvedQuestionsLog) {
        if (isDateInPeriod(date)) {
            questionsSolved += state.solvedQuestionsLog[date] || 0;
        }
    }
    
    let guitarRepeats = 0;
    for (let date in state.guitarRepeatsLog) {
        if (isDateInPeriod(date)) {
            guitarRepeats += state.guitarRepeatsLog[date] || 0;
        }
    }

    let totalCheckedSlots = 0;
    for (let date in state.completedTasksLog) {
        if (isDateInPeriod(date)) {
            const arr = state.completedTasksLog[date];
            const tasks = getDailyTasks(date);
            const dayCompletions = arr.slice(0, tasks.length);
            totalCheckedSlots += dayCompletions.filter(Boolean).length;
        }
    }
    const completedHours = totalCheckedSlots * 0.5;

    document.getElementById("statBooksRead").innerText = booksRead;
    document.getElementById("statTotalQuestions").innerText = questionsSolved;
    document.getElementById("statGuitarRepeats").innerText = guitarRepeats;
    document.getElementById("statCompletedHours").innerText = `${completedHours} Saat`;
    saveState();
}

function renderTaskList() {
    const container = document.getElementById("taskListContainer");
    container.innerHTML = "";
    
    const tasks = getDailyTasks(activeDateStr);
    const comp = getCompletionArray(activeDateStr, tasks.length);
    
    // Update daily progress bar
    const checkedCount = comp.filter(Boolean).length;
    const totalCount = tasks.length;
    const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
    document.getElementById("todayProgressPercent").innerText = `${percent}%`;
    document.getElementById("todayProgressInner").style.width = `${percent}%`;

    tasks.forEach((task, index) => {
        const isChecked = comp[index] || false;
        
        const taskItem = document.createElement("div");
        taskItem.className = `task-item ${isChecked ? 'completed' : ''} ${task.type === 'extra' ? 'extra' : ''}`;
        
        let tagClass = "tag-study";
        if (task.type === "reading") tagClass = "tag-reading";
        else if (task.type === "english") tagClass = "tag-english";
        else if (task.type === "guitar") tagClass = "tag-guitar";
        else if (task.type === "extra") tagClass = "tag-extra";

        // Details on what was logged
        let logDetailsHtml = "";
        if (task.subject === "Matematik" && isChecked) {
            const solved = state.solvedQuestionsLog[activeDateStr] || 0;
            logDetailsHtml = `
                <div class="logged-info" style="display: flex; align-items: center; gap: 0.3rem;">
                    <span>✏️ ${solved} soru çözüldü</span>
                    <button onclick="openMathEditModal()" title="Güncelle" style="background: none; border: none; padding: 0.2rem; cursor: pointer; color: var(--primary-purple); display: inline-flex; align-items: center;">
                        <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                    </button>
                </div>`;
        } else if (task.type === "reading" && isChecked) {
            const booksToday = state.books.filter(b => b.date === activeDateStr);
            if (booksToday.length > 0) {
                logDetailsHtml = `
                    <div class="logged-info" style="display: flex; align-items: center; gap: 0.3rem;">
                        <span>📖 Kitap: ${booksToday[booksToday.length - 1].title}</span>
                        <button onclick="openBookEditModalFromTask('${activeDateStr}')" title="Güncelle" style="background: none; border: none; padding: 0.2rem; cursor: pointer; color: var(--primary-purple); display: inline-flex; align-items: center;">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                        </button>
                    </div>`;
            } else {
                logDetailsHtml = `
                    <div class="logged-info" style="display: flex; align-items: center; gap: 0.3rem;">
                        <span>📖 Okuma yapıldı</span>
                        <button onclick="openBookEditModalFromTask('${activeDateStr}')" title="Kitap Ekle" style="background: none; border: none; padding: 0.2rem; cursor: pointer; color: var(--primary-purple); display: inline-flex; align-items: center;">
                            <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
                        </button>
                    </div>`;
            }
        } else if (task.type === "guitar" && isChecked) {
            const repeats = state.guitarRepeatsLog[activeDateStr] || 0;
            const goal = state.guitarGoal || 5;
            logDetailsHtml = `
                <div class="logged-info" style="display: flex; align-items: center; gap: 0.3rem;">
                    <span>🎸 ${repeats} / ${goal} tekrar yapıldı</span>
                    <button onclick="openGuitarEditModal()" title="Güncelle" style="background: none; border: none; padding: 0.2rem; cursor: pointer; color: var(--primary-purple); display: inline-flex; align-items: center;">
                        <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                    </button>
                </div>`;
        }

        taskItem.innerHTML = `
            <div class="task-left">
                <label class="checkbox-container">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleTask(${index}, this.checked)">
                    <span class="checkmark"></span>
                </label>
                <div class="task-text-details">
                    <span class="task-title">${task.title}</span>
                    <div class="task-meta">
                        <span class="task-tag ${tagClass}">${task.subject}</span>
                        <span class="task-duration">${task.type === 'guitar' ? 'Ödev/Tekrar' : `<i data-lucide="clock" style="width:11px;height:11px;display:inline-block;vertical-align:middle;margin-right:2px;"></i>${task.duration} dk`}</span>
                    </div>
                    ${logDetailsHtml}
                </div>
            </div>
            <div class="task-actions-group">
                ${!task.locked && task.type !== "extra" ? `
                    <button class="btn-swap" onclick="openSwapModal(${index})" title="Dersi Değiştir">
                        <i data-lucide="shuffle" style="width:16px;height:16px;"></i>
                    </button>
                ` : task.locked ? `
                    <button class="btn-swap locked" title="${task.type === 'guitar' ? 'Gitar programı kilitlidir' : 'Okuma ve İngilizce programı kilitlidir'}" disabled>
                        <i data-lucide="lock" style="width:16px;height:16px;"></i>
                    </button>
                ` : ''}
                
                ${task.type === "extra" ? `
                    <button class="btn-delete-task" onclick="deleteExtraTask(${task.extraIndex})" title="Görevi Sil">
                        <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(taskItem);
    });
    
    lucide.createIcons();
    updateHeaderStats();
}

function renderBadges() {
    const grid = document.getElementById("badgesGrid");
    grid.innerHTML = "";
    
    BADGES.forEach(badge => {
        const isUnlocked = state.unlockedBadges.includes(badge.id);
        const item = document.createElement("div");
        item.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
        item.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-title">${badge.title}</div>
            <div class="badge-desc">${badge.desc}</div>
        `;
        grid.appendChild(item);
    });
}

function renderBookshelf() {
    const list = document.getElementById("bookshelfList");
    list.innerHTML = "";
    
    if (state.books.length === 0) {
        list.innerHTML = `<p class="empty-books-text">Henüz okunan kitap eklenmemiş. Okuma görevlerini tamamlayıp ilk kitabını ekle! 🌟</p>`;
        return;
    }
    
    state.books.forEach((book, idx) => {
        const item = document.createElement("div");
        item.className = "book-item-visual";
        item.style.position = "relative";
        
        const formattedDate = new Date(book.date).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'});
        
        item.innerHTML = `
            <span style="word-break: break-word; margin-right: 4.5rem; text-align: left;">${book.title}</span>
            <div style="display: flex; align-items: center; gap: 0.2rem; position: absolute; right: 8px;">
                <span class="book-date" style="opacity: 0.8; font-size: 0.7rem; margin-right: 0.2rem;">${formattedDate}</span>
                <button onclick="editBookDirect(${idx})" title="Düzenle" style="background: none; border: none; cursor: pointer; color: inherit; padding: 0.2rem; display: flex; align-items: center;">
                    <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                </button>
                <button onclick="deleteBookDirect(${idx})" title="Sil" style="background: none; border: none; cursor: pointer; color: inherit; padding: 0.2rem; display: flex; align-items: center;">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
    lucide.createIcons();
}

function renderCalendar() {
    const grid = document.getElementById("weeklyCalendarGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const currentYear = calendarViewDate.getFullYear();
    const currentMonth = calendarViewDate.getMonth();

    // Update Header Text
    const headerEl = document.getElementById("calendarMonthYear");
    if (headerEl) {
        headerEl.innerText = `${monthNames[currentMonth]} ${currentYear}`;
    }

    // First day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
    let startDayOfWeek = firstDay.getDay();
    // Align with Mon = 0, Tue = 1, ..., Sun = 6
    let emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    // Total days in month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Today YYYY-MM-DD
    const todayStr = getTodayStr();

    // 1. Render empty slots prefix
    for (let i = 0; i < emptyDays; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day-node-empty";
        emptyCell.style.visibility = "hidden";
        emptyCell.style.aspectRatio = "1/1";
        emptyCell.style.minWidth = "0";
        grid.appendChild(emptyCell);
    }

    // 2. Render month days
    for (let d = 1; d <= totalDays; d++) {
        const targetDate = new Date(currentYear, currentMonth, d);
        
        // Form YYYY-MM-DD local
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dayVal = String(targetDate.getDate()).padStart(2, '0');
        const targetDateStr = `${y}-${m}-${dayVal}`;

        const isToday = targetDateStr === todayStr;
        const isActive = targetDateStr === activeDateStr;

        // Compute completion status
        const tasks = getDailyTasks(targetDateStr);
        const comp = state.completedTasksLog[targetDateStr];

        let statusClass = "";
        let statusText = "•";

        if (comp) {
            const total = tasks.length;
            const completed = comp.slice(0, total).filter(Boolean).length;
            if (completed === total && total > 0) {
                statusClass = "success";
                statusText = "✓";
            } else if (completed > 0) {
                statusClass = "partial";
                statusText = "/";
            } else {
                statusClass = "fail";
                statusText = "✗";
            }
        }

        const node = document.createElement("div");
        node.className = "calendar-day-node";
        node.style.cursor = "pointer";
        node.style.aspectRatio = "1/1";
        node.style.minWidth = "0";
        node.style.boxSizing = "border-box";
        node.style.display = "flex";
        node.style.flexDirection = "column";
        node.style.justifyContent = "center";
        node.style.alignItems = "center";
        node.style.borderRadius = "10px";
        node.style.padding = "2px";
        node.style.position = "relative";
        node.style.transition = "var(--transition)";

        // Style borders for today and active day
        if (isActive) {
            node.style.border = "2px solid var(--primary-purple)";
            node.style.background = "rgba(123, 31, 162, 0.08)";
        } else if (isToday) {
            node.style.border = "2px solid var(--primary-pink)";
            node.style.background = "rgba(255, 116, 164, 0.05)";
        } else {
            node.style.border = "1px solid rgba(123, 31, 162, 0.08)";
            node.style.background = "white";
        }

        // Color coding based on completion status
        let statusDotHtml = "";
        if (statusClass === "success") {
            node.style.backgroundColor = "rgba(0, 137, 123, 0.12)"; // light mint
            statusDotHtml = `<span style="font-size: 0.65rem; color: var(--accent-mint); font-weight: 900; line-height: 1;">✓</span>`;
        } else if (statusClass === "partial") {
            node.style.backgroundColor = "rgba(255, 179, 0, 0.12)"; // light gold
            statusDotHtml = `<span style="font-size: 0.65rem; color: var(--accent-gold); font-weight: 900; line-height: 1;">/</span>`;
        } else if (statusClass === "fail") {
            node.style.backgroundColor = "rgba(244, 67, 54, 0.12)"; // light red
            statusDotHtml = `<span style="font-size: 0.65rem; color: #f44336; font-weight: 900; line-height: 1;">✗</span>`;
        } else {
            statusDotHtml = `<span style="font-size: 0.6rem; color: #bdbdbd; line-height: 1;">•</span>`;
        }

        node.innerHTML = `
            <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-color);">${d}</span>
            <div style="display: flex; align-items: center; justify-content: center; height: 9px; margin-top: 1px;">
                ${statusDotHtml}
            </div>
        `;

        node.onclick = () => {
            activeDateStr = targetDateStr;
            calendarViewDate = parseLocalDate(targetDateStr);
            updateDayTitle();
            updateAllViews();
        };

        grid.appendChild(node);
    }
}

// ==========================================================================
// CHARTS (Chart.js Integration)
// ==========================================================================

let distributionChart = null;
let questionsChart = null;
let guitarChart = null;
let reportPeriod = 'week'; // 'week', 'month', 'all', 'custom'

function setReportPeriod(period) {
    reportPeriod = period;
    
    // Toggle active classes on buttons
    const btnDay = document.getElementById("btnReportDay");
    const btnWeek = document.getElementById("btnReportWeek");
    const btnMonth = document.getElementById("btnReportMonth");
    const btnAll = document.getElementById("btnReportAll");
    const btnCustom = document.getElementById("btnReportCustom");
    
    if (btnDay) btnDay.classList.toggle("active", period === 'day');
    if (btnWeek) btnWeek.classList.toggle("active", period === 'week');
    if (btnMonth) btnMonth.classList.toggle("active", period === 'month');
    if (btnAll) btnAll.classList.toggle("active", period === 'all');
    if (btnCustom) btnCustom.classList.toggle("active", period === 'custom');
    
    const customWrap = document.getElementById("customDateRangeWrap");
    if (customWrap) {
        if (period === 'custom') {
            customWrap.style.display = "flex";
            
            // Set defaults if empty
            const startInput = document.getElementById("reportStartDate");
            const endInput = document.getElementById("reportEndDate");
            
            if (startInput && !startInput.value) {
                const startDefault = new Date();
                startDefault.setDate(startDefault.getDate() - 7);
                startInput.value = startDefault.toISOString().split('T')[0];
            }
            if (endInput && !endInput.value) {
                endInput.value = new Date().toISOString().split('T')[0];
            }
        } else {
            customWrap.style.display = "none";
        }
    }
    
    renderCharts();
    updateHeaderStats();
}

function onCustomDateChange() {
    if (reportPeriod === 'custom') {
        renderCharts();
    }
}

function renderCharts() {
    const today = new Date();

    // 1. SUBJECT DISTRIBUTION CHART (DOUGHNUT)
    const ctx1 = document.getElementById('subjectDistributionChart').getContext('2d');
    
    // Count completions per subject in the selected interval
    const counts = { "Matematik": 0, "Türkçe": 0, "Fen Bilgisi": 0, "Hayat Bilgisi": 0, "İngilizce": 0, "Okuma": 0, "Gitar": 0 };
    
    for (let date in state.completedTasksLog) {
        if (!isDateInPeriod(date)) continue;
        
        const tasks = getDailyTasks(date);
        const comp = state.completedTasksLog[date];
        tasks.forEach((t, i) => {
            if (comp[i]) {
                if (counts[t.subject] !== undefined) {
                    counts[t.subject]++;
                }
            }
        });
    }

    if (distributionChart) distributionChart.destroy();
    
    distributionChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: [
                    '#ffc107', // Matematik (Gold)
                    '#9c27b0', // Türkçe (Purple)
                    '#03a9f4', // Fen (Blue)
                    '#8bc34a', // Hayat Bilgisi (Light Green)
                    '#e91e63', // İngilizce (Pink)
                    '#009688', // Okuma (Mint)
                    '#d81b60'  // Gitar (Magenta)
                ],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Nunito', size: 10, weight: 'bold' },
                        boxWidth: 12
                    }
                }
            }
        }
    });

    // 2. MATH QUESTIONS LOG (BAR/LINE CHART BASED ON FILTER)
    const ctx2 = document.getElementById('mathQuestionsChart').getContext('2d');
    
    const labels = [];
    const questionData = [];
    let chartType = 'bar';
    
    if (reportPeriod === 'day') {
        chartType = 'bar';
        labels.push(new Date(activeDateStr).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }));
        questionData.push(state.solvedQuestionsLog[activeDateStr] || 0);
    } else if (reportPeriod === 'week') {
        chartType = 'bar';
        const { mondayDate } = getWeekRange(activeDateStr);
        for (let i = 0; i < 7; i++) {
            const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
            const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dayVal = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayVal}`;
            labels.push(d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }));
            questionData.push(state.solvedQuestionsLog[dateStr] || 0);
        }
    } else if (reportPeriod === 'month') {
        chartType = 'line';
        const { firstDay, totalDays } = getMonthRange(activeDateStr);
        for (let i = 1; i <= totalDays; i++) {
            const d = new Date(firstDay.getFullYear(), firstDay.getMonth(), i);
            const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dayVal = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayVal}`;
            labels.push(String(i));
            questionData.push(state.solvedQuestionsLog[dateStr] || 0);
        }
    } else if (reportPeriod === 'custom') {
        const startVal = document.getElementById("reportStartDate").value;
        const endVal = document.getElementById("reportEndDate").value;
        
        const startDateObj = startVal ? new Date(startVal + "T00:00:00") : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const endDateObj = endVal ? new Date(endVal + "T23:59:59") : new Date();
        
        const diffTime = Math.abs(endDateObj - startDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        chartType = diffDays <= 7 ? 'bar' : 'line';
        
        const tempDate = new Date(startDateObj);
        for (let i = 0; i < diffDays; i++) {
            const dateStr = tempDate.toISOString().split('T')[0];
            labels.push(tempDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }));
            questionData.push(state.solvedQuestionsLog[dateStr] || 0);
            tempDate.setDate(tempDate.getDate() + 1);
        }
    } else {
        // All Time
        chartType = 'line';
        const solvedDates = Object.keys(state.solvedQuestionsLog).sort();
        if (solvedDates.length > 0) {
            solvedDates.forEach(dateStr => {
                const d = new Date(dateStr);
                labels.push(d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }));
                questionData.push(state.solvedQuestionsLog[dateStr] || 0);
            });
        } else {
            const { mondayDate } = getWeekRange(activeDateStr);
            for (let i = 0; i < 7; i++) {
                const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
                labels.push(d.toLocaleDateString('tr-TR', { weekday: 'short' }));
                questionData.push(0);
            }
        }
    }

    if (questionsChart) questionsChart.destroy();

    questionsChart = new Chart(ctx2, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Soru Sayısı',
                data: questionData,
                backgroundColor: chartType === 'line' ? 'rgba(255, 96, 144, 0.1)' : 'rgba(255, 96, 144, 0.7)',
                borderColor: '#ff6090',
                borderWidth: 2,
                borderRadius: chartType === 'bar' ? 8 : 0,
                fill: chartType === 'line',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: 'Nunito', weight: 'bold' }
                    }
                },
                x: {
                    ticks: {
                        font: { family: 'Nunito', size: reportPeriod === 'month' || reportPeriod === 'custom' ? 8 : 10, weight: 'bold' }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // 3. GUITAR REPEATS CHART
    const ctx3 = document.getElementById('guitarRepeatsChart').getContext('2d');
    
    const guitarLabels = [];
    const guitarData = [];
    const guitarGoalData = [];
    let guitarChartType = 'bar';
    
    if (reportPeriod === 'day') {
        guitarChartType = 'bar';
        guitarLabels.push(new Date(activeDateStr).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }));
        guitarData.push(state.guitarRepeatsLog[activeDateStr] || 0);
        guitarGoalData.push(state.guitarGoal || 5);
    } else if (reportPeriod === 'week') {
        guitarChartType = 'bar';
        const { mondayDate } = getWeekRange(activeDateStr);
        for (let i = 0; i < 7; i++) {
            const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
            const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dayVal = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayVal}`;
            guitarLabels.push(d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }));
            guitarData.push(state.guitarRepeatsLog[dateStr] || 0);
            guitarGoalData.push(state.guitarGoal || 5);
        }
    } else if (reportPeriod === 'month') {
        guitarChartType = 'line';
        const { firstDay, totalDays } = getMonthRange(activeDateStr);
        for (let i = 1; i <= totalDays; i++) {
            const d = new Date(firstDay.getFullYear(), firstDay.getMonth(), i);
            const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dayVal = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayVal}`;
            guitarLabels.push(String(i));
            guitarData.push(state.guitarRepeatsLog[dateStr] || 0);
            guitarGoalData.push(state.guitarGoal || 5);
        }
    } else if (reportPeriod === 'custom') {
        const startVal = document.getElementById("reportStartDate").value;
        const endVal = document.getElementById("reportEndDate").value;
        
        const startDateObj = startVal ? new Date(startVal + "T00:00:00") : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const endDateObj = endVal ? new Date(endVal + "T23:59:59") : new Date();
        
        const diffTime = Math.abs(endDateObj - startDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        guitarChartType = diffDays <= 7 ? 'bar' : 'line';
        
        const tempDate = new Date(startDateObj);
        for (let i = 0; i < diffDays; i++) {
            const dateStr = tempDate.toISOString().split('T')[0];
            guitarLabels.push(tempDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }));
            guitarData.push(state.guitarRepeatsLog[dateStr] || 0);
            guitarGoalData.push(state.guitarGoal || 5);
            tempDate.setDate(tempDate.getDate() + 1);
        }
    } else {
        // All Time
        guitarChartType = 'line';
        const guitarDates = Object.keys(state.guitarRepeatsLog).sort();
        if (guitarDates.length > 0) {
            guitarDates.forEach(dateStr => {
                const d = new Date(dateStr);
                guitarLabels.push(d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }));
                guitarData.push(state.guitarRepeatsLog[dateStr] || 0);
                guitarGoalData.push(state.guitarGoal || 5);
            });
        } else {
            const { mondayDate } = getWeekRange(activeDateStr);
            for (let i = 0; i < 7; i++) {
                const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
                guitarLabels.push(d.toLocaleDateString('tr-TR', { weekday: 'short' }));
                guitarData.push(0);
                guitarGoalData.push(state.guitarGoal || 5);
            }
        }
    }
    
    if (guitarChart) guitarChart.destroy();
    
    guitarChart = new Chart(ctx3, {
        type: guitarChartType,
        data: {
            labels: guitarLabels,
            datasets: [
                {
                    label: 'Yapılan Tekrar',
                    data: guitarData,
                    backgroundColor: guitarChartType === 'line' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.7)',
                    borderColor: '#9c27b0',
                    borderWidth: 2,
                    borderRadius: guitarChartType === 'bar' ? 8 : 0,
                    fill: guitarChartType === 'line',
                    tension: 0.3
                },
                {
                    label: 'Hedef Tekrar',
                    data: guitarGoalData,
                    borderColor: 'rgba(255, 116, 164, 0.5)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: 'Nunito', weight: 'bold' }
                    }
                },
                x: {
                    ticks: {
                        font: { family: 'Nunito', size: reportPeriod === 'month' || reportPeriod === 'custom' ? 8 : 10, weight: 'bold' }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { family: 'Nunito', size: 10, weight: 'bold' },
                        boxWidth: 10
                    }
                }
            }
        }
    });
}

function updateAllViews() {
    renderTaskList();
    renderCalendar();
    renderBookshelf();
    renderBadges();
    renderCharts();
    runAdaptiveScheduling();
}

// ==========================================================================
// INTERACTIVE FUNCTIONS: CHECKS, SWAPS, EXTRAS
// ==========================================================================

let activeTaskIndexForAction = -1;
let activeBookIndexForEdit = -1;

function toggleTask(index, isChecked) {
    const tasks = getDailyTasks(activeDateStr);
    const comp = getCompletionArray(activeDateStr, tasks.length);
    
    comp[index] = isChecked;
    saveState();

    if (isChecked) {
        const task = tasks[index];
        playSuccessSound();
        addXP(20); // 20 XP per task completed

        // Special modal triggers
        if (task.subject === "Matematik") {
            activeTaskIndexForAction = index;
            openModal("mathModal");
        } else if (task.type === "reading") {
            activeTaskIndexForAction = index;
            openBookModal(true);
        } else if (task.type === "guitar") {
            activeTaskIndexForAction = index;
            // Pre-fill inputs
            document.getElementById("guitarGoalInput").value = state.guitarGoal || 5;
            document.getElementById("guitarInput").value = "";
            openModal("guitarModal");
        }
    } else {
        // If unchecked, deduct XP (but do not go below 0)
        state.xp = Math.max(0, state.xp - 20);
        saveState();
    }

    // Check if streak was achieved today
    recalculateStreak();
    checkAndUnlockBadges();
    updateAllViews();
}

// Subject swapping
function openSwapModal(index) {
    activeTaskIndexForAction = index;
    const grid = document.getElementById("swapOptionsGrid");
    grid.innerHTML = "";
    
    const subjects = ["Matematik", "Türkçe", "Fen Bilgisi", "Hayat Bilgisi"];
    subjects.forEach(sub => {
        let emoji = "✏️";
        if (sub === "Matematik") emoji = "🧮";
        else if (sub === "Fen Bilgisi") emoji = "🧪";
        else if (sub === "Hayat Bilgisi") emoji = "🌍";
        else if (sub === "Türkçe") emoji = "📚";

        const btn = document.createElement("button");
        btn.className = "subject-option-btn";
        btn.innerHTML = `${emoji} ${sub}`;
        btn.onclick = () => {
            swapSubject(sub);
        };
        grid.appendChild(btn);
    });

    openModal("swapModal");
}

function swapSubject(newSubject) {
    // Schedules stores the 3 swappable slots (index 2, 3, 4 of daily tasks)
    // Map activeTaskIndexForAction (which is 0-indexed task list) to schedule index
    // Slots are: 0=Reading1, 1=Reading2/English, 2=Slot0_Study, 3=Slot1_Study, 4=Slot2_Study
    const scheduleIndex = activeTaskIndexForAction - 2;
    
    if (state.schedules[activeDateStr] && scheduleIndex >= 0 && scheduleIndex < 3) {
        state.schedules[activeDateStr][scheduleIndex] = newSubject;
        saveState();
        closeModal("swapModal");
        updateAllViews();
    }
}

// Extra tasks
function addExtraTask(title, duration, subject = "Ekstra") {
    if (!state.extraTasks[activeDateStr]) {
        state.extraTasks[activeDateStr] = [];
    }
    state.extraTasks[activeDateStr].push({
        title: title,
        duration: duration,
        subject: subject
    });
    
    // Expand completions array to match new task length
    const tasks = getDailyTasks(activeDateStr);
    const comp = getCompletionArray(activeDateStr, tasks.length);
    comp.push(false);
    
    saveState();
    updateAllViews();
}

function deleteExtraTask(idx) {
    if (state.extraTasks[activeDateStr]) {
        state.extraTasks[activeDateStr].splice(idx, 1);
        
        // Remove corresponding element from completion log
        const tasks = getDailyTasks(activeDateStr);
        // The index of extra task in checklist is calculated dynamically based on default tasks
        const defaultTasksCount = tasks.filter(t => t.type !== 'extra').length;
        const checkIdx = defaultTasksCount + idx;
        
        const comp = getCompletionArray(activeDateStr, tasks.length + 1); // prior length
        comp.splice(checkIdx, 1);
        
        saveState();
        updateAllViews();
    }
}

// ==========================================================================
// MODAL CONTROLLERS & ALARM CONTROLLER
// ==========================================================================

function openModal(id) {
    document.getElementById(id).classList.add("open");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
    if (id === "bookModal") {
        activeBookIndexForEdit = -1;
    }
}

function openBookModal(isFromTask = true) {
    const titleEl = document.querySelector("#bookModal h3");
    const footerBtn1 = document.querySelector("#bookModal .modal-footer .btn-secondary");
    const footerBtn2 = document.querySelector("#bookModal .modal-footer .btn-primary");
    
    if (isFromTask) {
        titleEl.innerHTML = `<i data-lucide="book-open" class="text-purple"></i> Kitap Girişi`;
        footerBtn1.innerText = "Sadece Tamamla";
        footerBtn2.innerText = "Kitap Ekle & Tamamla";
    } else {
        titleEl.innerHTML = `<i data-lucide="book-open" class="text-purple"></i> Kitaplığıma Kitap Ekle`;
        footerBtn1.innerText = "Vazgeç";
        footerBtn2.innerText = "Kitaplığıma Ekle";
    }
    lucide.createIcons();
    openModal("bookModal");
}

function openMathEditModal() {
    const current = state.solvedQuestionsLog[activeDateStr] || 0;
    document.getElementById("mathInput").value = current;
    openModal("mathModal");
}

function openBookEditModalFromTask(dateStr) {
    const booksToday = state.books.filter(b => b.date === dateStr);
    if (booksToday.length > 0) {
        const lastBook = booksToday[booksToday.length - 1];
        const idx = state.books.indexOf(lastBook);
        if (idx !== -1) {
            editBookDirect(idx);
        }
    } else {
        activeBookIndexForEdit = -1;
        openBookModal(true);
    }
}

function editBookDirect(idx) {
    activeBookIndexForEdit = idx;
    const book = state.books[idx];
    document.getElementById("bookInput").value = book.title;
    openBookModal(false);
    
    document.querySelector("#bookModal h3").innerHTML = `<i data-lucide="book-open" class="text-purple"></i> Kitap Düzenle`;
    document.querySelector("#bookModal .modal-footer .btn-primary").innerText = "Güncelle";
    lucide.createIcons();
}

function deleteBookDirect(idx) {
    if (confirm("Bu kitabı kitaplığınızdan silmek istediğinize emin misiniz?")) {
        state.books.splice(idx, 1);
        state.totalBooksRead = Math.max(0, state.totalBooksRead - 1);
        saveState();
        updateAllViews();
    }
}

function openGuitarEditModal() {
    document.getElementById("guitarGoalInput").value = state.guitarGoal || 5;
    document.getElementById("guitarInput").value = state.guitarRepeatsLog[activeDateStr] || 0;
    openModal("guitarModal");
}

function stopAlarm() {
    stopAlarmSound();
    closeModal("alarmModal");
}

// Save math solved questions
document.getElementById("btnSaveMath").addEventListener("click", () => {
    const input = document.getElementById("mathInput");
    const val = parseInt(input.value);
    
    if (!isNaN(val) && val >= 0) {
        const oldVal = state.solvedQuestionsLog[activeDateStr] || 0;
        const diff = val - oldVal;
        state.solvedQuestionsLog[activeDateStr] = val;
        state.totalQuestionsSolved += diff;
        saveState();
        
        input.value = "";
        closeModal("mathModal");
        checkAndUnlockBadges();
        updateAllViews();
    } else {
        alert("Lütfen geçerli bir soru sayısı gir!");
    }
});

// Save book read title
document.getElementById("btnSaveBook").addEventListener("click", () => {
    const input = document.getElementById("bookInput");
    const title = input.value.trim();
    
    if (title) {
        if (activeBookIndexForEdit !== -1) {
            state.books[activeBookIndexForEdit].title = title;
            activeBookIndexForEdit = -1;
        } else {
            state.books.push({
                title: title,
                date: activeDateStr
            });
            state.totalBooksRead += 1;
        }
        saveState();
    }
    
    input.value = "";
    closeModal("bookModal");
    checkAndUnlockBadges();
    updateAllViews();
});

// Save guitar repetitions
document.getElementById("btnSaveGuitar").addEventListener("click", () => {
    const goalInput = document.getElementById("guitarGoalInput");
    const repeatsInput = document.getElementById("guitarInput");
    
    const goal = parseInt(goalInput.value);
    const repeats = parseInt(repeatsInput.value);
    
    if (!isNaN(goal) && goal > 0 && !isNaN(repeats) && repeats >= 0) {
        state.guitarGoal = goal;
        state.guitarRepeatsLog[activeDateStr] = repeats;
        
        // Recalculate total guitar repeats
        let total = 0;
        for (let date in state.guitarRepeatsLog) {
            total += state.guitarRepeatsLog[date] || 0;
        }
        state.totalGuitarRepeats = total;
        saveState();
        
        closeModal("guitarModal");
        checkAndUnlockBadges();
        updateAllViews();
    } else {
        alert("Lütfen hedef ve yapılan tekrar sayılarını doğru gir!");
    }
});

// Add extra task button in modal
document.getElementById("btnSaveExtraTask").addEventListener("click", () => {
    const subjectSelect = document.getElementById("extraTaskSubject");
    const durationSelect = document.getElementById("extraTaskDuration");
    
    if (subjectSelect && durationSelect) {
        const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
        const subject = selectedOption.value;
        const emoji = selectedOption.getAttribute("data-emoji") || "🌟";
        const duration = parseInt(durationSelect.value) || 30;
        
        const title = `${subject} Ekstra Çalışması ${emoji}`;
        
        addExtraTask(title, duration, subject);
        closeModal("extraTaskModal");
    }
});

document.getElementById("btnAddExtraTask").addEventListener("click", () => {
    openModal("extraTaskModal");
});

document.getElementById("btnAddBookDirect").addEventListener("click", () => {
    activeTaskIndexForAction = -1;
    openBookModal(false);
});

// Test Alarm Button
document.getElementById("btnTestAlarm").addEventListener("click", () => {
    const tasks = getDailyTasks(activeDateStr);
    const comp = getCompletionArray(activeDateStr, tasks.length);
    const incomplete = tasks.length - comp.filter(Boolean).length;
    
    document.getElementById("remainingTasksText").innerText = `Kalan Görevler: ${incomplete} adet`;
    openModal("alarmModal");
    playAlarmSound();
});



function updateDayTitle() {
    const dateObj = new Date(activeDateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateFormatted = dateObj.toLocaleDateString('tr-TR', options);
    document.getElementById("currentDayTitle").innerText = `${dateFormatted} Görevleri`;
}

// ==========================================================================
// BACKUP & RESTORE SYSTEMS (Import/Export JSON)
// ==========================================================================

// Export state as a downloadable JSON file
document.getElementById("btnExportBackup").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ders_yildizi_yedek_${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// Trigger file input click
document.getElementById("btnImportBackup").addEventListener("click", () => {
    document.getElementById("fileBackupInput").click();
});

// Import state from uploaded JSON file
document.getElementById("fileBackupInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const importedState = JSON.parse(evt.target.result);
            
            // Validate imported schema (make sure basic fields are present)
            const requiredFields = ["level", "xp", "streak", "penalties", "totalBooksRead", "totalQuestionsSolved", "books", "completedTasksLog"];
            const isValid = requiredFields.every(field => importedState.hasOwnProperty(field));
            
            if (isValid) {
                // Confirm with user
                const confirmRestore = confirm("Dikkat: Bu yedek dosyasını yüklediğinizde, cihazdaki mevcut tüm veriler silinip yedektekilerle değiştirilecektir. Devam etmek istiyor musunuz?");
                if (confirmRestore) {
                    state = { ...DEFAULT_STATE, ...importedState };
                    saveState();
                    updateAllViews();
                    alert("Harika! İlerlemeler başarıyla yedekten yüklendi. 🌟");
                }
            } else {
                alert("Hata: Yüklediğiniz dosya geçerli bir yedek dosyası formatında değil!");
            }
        } catch (err) {
            console.error(err);
            alert("Hata: Dosya okunurken veya çözümlenirken bir sorun oluştu!");
        }
        // Reset file input value so it can trigger change event again
        e.target.value = "";
    };
    reader.readAsText(file);
});

// Reset state with password protection
document.getElementById("btnResetData").addEventListener("click", () => {
    const password = prompt("Tüm verileri sıfırlamak için ebeveyn parolasını girin:");
    if (password === "7395fa") {
        const confirmReset = confirm("Dikkat: Tüm çalışma verileriniz, çözülen sorular, okunan kitaplar ve kazandığınız rozetler tamamen silinecektir. Devam etmek istiyor musunuz?");
        if (confirmReset) {
            state = { ...DEFAULT_STATE };
            saveState();
            updateAllViews();
            alert("Tüm veriler başarıyla sıfırlandı! 🌟");
            window.location.reload();
        }
    } else if (password !== null) {
        alert("Hatalı parola! Veriler sıfırlanmadı.");
    }
});

// ==========================================================================
// BACKGROUND AUTOMATED ENGINE (Alarm at 20:00 & Floating Stars)
// ==========================================================================

let alarmTriggeredToday = false;

function startBackgroundCheckers() {
    // 1. Clock checker for 20:00 Alarm
    setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const dateStr = now.toISOString().split('T')[0];
        
        // At 20:00, if we have incomplete tasks for today and haven't triggered alarm yet
        if (hour === 20 && min === 0 && !alarmTriggeredToday) {
            const tasks = getDailyTasks(dateStr);
            const comp = getCompletionArray(dateStr, tasks.length);
            const incompleteCount = tasks.length - comp.filter(Boolean).length;
            
            if (incompleteCount > 0) {
                alarmTriggeredToday = true;
                document.getElementById("remainingTasksText").innerText = `Kalan Görevler: ${incompleteCount} adet`;
                openModal("alarmModal");
                playAlarmSound();
            }
        }
        
        // Reset alarm trigger at midnight
        if (hour === 0 && min === 0) {
            alarmTriggeredToday = false;
        }
    }, 10000); // Check every 10 seconds

    // 2. Generate floating stars for design background
    const bg = document.getElementById("starsBg");
    const starCount = 30;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement("div");
        star.className = "star";
        
        const size = Math.random() * 5 + 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}vw`;
        
        // Stagger animation starts and durations
        star.style.animationDuration = `${Math.random() * 12 + 6}s`;
        star.style.animationDelay = `${Math.random() * 8}s`;
        
        bg.appendChild(star);
    }
}

// ==========================================================================
// APPLICATION INITIALIZATION
// ==========================================================================

window.addEventListener("DOMContentLoaded", () => {
    loadState();
    handleDayTransition();
    
    // Add Event Listeners for Month Navigation
    const btnPrev = document.getElementById("btnPrevMonth");
    const btnNext = document.getElementById("btnNextMonth");
    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
            renderCalendar();
        });
    }
    if (btnNext) {
        btnNext.addEventListener("click", () => {
            calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    updateDayTitle();
    updateAllViews();
    startBackgroundCheckers();
});
