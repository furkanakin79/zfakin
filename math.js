/**
 * Sihirli Matematik Dünyası - 4 İşlem Oyunu
 * 4. Sınıf Eğitsel Matematik Motoru & İstatistik Sistemi
 */

// ==========================================
// 1. Web Audio API Ses Sentezleyici
// ==========================================
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
    if (!this.soundEnabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playCorrect() {
    if (!this.soundEnabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // Do-Mi-Sol-Do
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.2, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.25);
      });
    } catch (e) {}
  }

  playWrong() {
    if (!this.soundEnabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.3);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playFanfare() {
    if (!this.soundEnabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.25, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    } catch (e) {}
  }

  playTick() {
    this.playTone(800, 'sine', 0.04, 0.05);
  }
}

// ==========================================
// 2. Veri Deposu (LocalStorage Yönetimi)
// ==========================================
class StatsStore {
  constructor() {
    this.STORAGE_KEY = 'sihirli_matematik_data_v1';
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.history)) return parsed;
      }
    } catch (e) {}
    return {
      history: [],
      stars: 0,
      bestStreak: 0
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }

  addRecord(record) {
    this.data.history.push(record);
    if (record.isCorrect) {
      this.data.stars = (this.data.stars || 0) + 1;
    }
    this.save();
  }

  resetAll() {
    this.data = {
      history: [],
      stars: 0,
      bestStreak: 0
    };
    this.save();
  }

  getTodayRecords() {
    const todayStr = this.getLocalDateString(new Date());
    return this.data.history.filter(r => r.date === todayStr);
  }

  getWeekRecords() {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    return this.data.history.filter(r => {
      const recDate = new Date(r.date);
      return recDate >= startOfWeek;
    });
  }

  getRecordsForDate(dateStr) {
    return this.data.history.filter(r => r.date === dateStr);
  }

  getLocalDateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// ==========================================
// 3. Ana Oyun Sınıfı
// ==========================================
class MathGame {
  constructor() {
    this.sound = new SoundSynth();
    this.store = new StatsStore();
    
    // Oyun Durumu
    this.isGameRunning = false;
    this.currentQuestion = null;
    this.currentStreak = 0;
    this.timerInterval = null;
    this.timeLimit = 10;
    this.timeRemaining = 10;
    this.questionStartTime = 0;
    this.isAnsweringBlocked = false;

    // Aktif Odaklanmış Giriş Kutusu (Numpad için)
    this.activeInputEl = null;

    // Takvim Durumu
    this.calCurrentDate = new Date();
    this.selectedCalDateStr = this.store.getLocalDateString(new Date());

    this.initDOMElements();
    this.bindEvents();
    this.initCalendarDropdowns();
    this.updateScoreboard();
    this.updateMiniSummary();
  }

  initDOMElements() {
    // Skorlar & Header
    this.starCountEl = document.getElementById('starCount');
    this.streakCountEl = document.getElementById('streakCount');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIconEl = document.getElementById('soundIcon');
    
    // Ayarlar
    this.opRadios = document.querySelectorAll('input[name="operation"]');
    this.layoutRadios = document.querySelectorAll('input[name="layoutMode"]');
    this.digit1Select = document.getElementById('digit1Select');
    this.digit2Select = document.getElementById('digit2Select');
    this.timeLimitInput = document.getElementById('timeLimitInput');
    this.unlimitedTimeCheck = document.getElementById('unlimitedTimeCheck');
    
    // Başlat / Bitir Butonu
    this.toggleGamePlayBtn = document.getElementById('toggleGamePlayBtn');
    this.startBtnIcon = document.getElementById('startBtnIcon');
    this.startBtnText = document.getElementById('startBtnText');

    // Oyun Alanı & Sahne
    this.gameBoardSection = document.getElementById('gameBoardSection');
    this.idleSplash = document.getElementById('idleSplash');
    this.activeGameWrap = document.getElementById('activeGameWrap');
    this.timerSection = document.getElementById('timerSection');
    this.timerBarFill = document.getElementById('timerBarFill');
    this.timerSeconds = document.getElementById('timerSeconds');
    this.questionStageContainer = document.getElementById('questionStageContainer');
    this.submitBtn = document.getElementById('submitBtn');
    this.feedbackBanner = document.getElementById('feedbackBanner');
    this.feedbackContent = document.getElementById('feedbackContent');

    // Mini Özet
    this.todayTotalVal = document.getElementById('todayTotalVal');
    this.todayCorrectVal = document.getElementById('todayCorrectVal');
    this.todayWrongVal = document.getElementById('todayWrongVal');
    this.todaySuccessRate = document.getElementById('todaySuccessRate');

    // İstatistik Modalı
    this.openStatsBtn = document.getElementById('openStatsBtn');
    this.statsModalOverlay = document.getElementById('statsModalOverlay');
    this.closeStatsModalBtn = document.getElementById('closeStatsModalBtn');
    this.modalTotalSolved = document.getElementById('modalTotalSolved');
    this.modalTotalCorrect = document.getElementById('modalTotalCorrect');
    this.modalTotalWrong = document.getElementById('modalTotalWrong');
    this.modalOverallRate = document.getElementById('modalOverallRate');
    this.todayDetailedSummary = document.getElementById('todayDetailedSummary');
    this.weekDetailedSummary = document.getElementById('weekDetailedSummary');

    // Takvim Öğeleri
    this.calMonthYearTitle = document.getElementById('calMonthYearTitle');
    this.calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
    this.calNextMonthBtn = document.getElementById('calNextMonthBtn');
    this.calYearSelect = document.getElementById('calYearSelect');
    this.calMonthSelect = document.getElementById('calMonthSelect');
    this.calTodayBtn = document.getElementById('calTodayBtn');
    this.calendarDaysGrid = document.getElementById('calendarDaysGrid');
    this.selectedDayTitle = document.getElementById('selectedDayTitle');
    this.selectedDayStatsContent = document.getElementById('selectedDayStatsContent');

    // Veri Yönetimi & Modallar
    this.resetDataBtn = document.getElementById('resetDataBtn');
    this.exportDataBtn = document.getElementById('exportDataBtn');
    this.importDataInput = document.getElementById('importDataInput');
    this.confirmModalOverlay = document.getElementById('confirmModalOverlay');
    this.confirmResetBtn = document.getElementById('confirmResetBtn');
    this.cancelResetBtn = document.getElementById('cancelResetBtn');

    // Tebrik Modalı
    this.celebrationOverlay = document.getElementById('celebrationOverlay');
    this.closeCelebBtn = document.getElementById('closeCelebBtn');
    this.celebTitle = document.getElementById('celebTitle');
    this.celebMsg = document.getElementById('celebMsg');
  }

  bindEvents() {
    // Ses Aç/Kapat
    this.soundToggleBtn.addEventListener('click', () => {
      const enabled = this.sound.toggle();
      this.soundIconEl.textContent = enabled ? '🔊' : '🔇';
    });

    // Başlat / Bitir Butonu
    this.toggleGamePlayBtn.addEventListener('click', () => {
      this.toggleGamePlay();
    });

    // Cevap Gönderme (Buton)
    this.submitBtn.addEventListener('click', () => this.handleAnswerSubmit());

    // Ayar Değişikliklerinde Eğer Oyun Çalışıyorsa Yeni Soru Üret
    this.opRadios.forEach(r => r.addEventListener('change', () => {
      if (this.isGameRunning) this.generateNewQuestion();
    }));
    this.layoutRadios.forEach(r => r.addEventListener('change', () => {
      if (this.isGameRunning) this.renderCurrentQuestionStage();
    }));
    this.digit1Select.addEventListener('change', () => {
      if (this.isGameRunning) this.generateNewQuestion();
    });
    this.digit2Select.addEventListener('change', () => {
      if (this.isGameRunning) this.generateNewQuestion();
    });
    this.timeLimitInput.addEventListener('change', () => {
      let val = parseInt(this.timeLimitInput.value, 10);
      if (isNaN(val) || val < 3) val = 3;
      if (val > 120) val = 120;
      this.timeLimitInput.value = val;
      if (this.isGameRunning) this.startTimer();
    });
    this.unlimitedTimeCheck.addEventListener('change', () => {
      if (this.isGameRunning) this.startTimer();
    });

    // Numpad Butonları (Sağdan Sola Basamak Girişi: Yeni basamak sola eklenir)
    document.querySelectorAll('.numpad-btn[data-key]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => e.preventDefault());
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.sound.playTick();
        const key = btn.getAttribute('data-key');
        const targetInput = this.getActiveInput();
        if (targetInput) {
          const val = targetInput.value;
          if (val.length < 8) {
            // Sağdan sola hesaplama: yeni basamak en sola eklenir
            targetInput.value = key + val;
          }
          targetInput.focus();
          targetInput.setSelectionRange(0, 0);
        }
      });
    });

    const btnClear = document.getElementById('btnKeyClear');
    if (btnClear) {
      btnClear.addEventListener('pointerdown', (e) => e.preventDefault());
      btnClear.addEventListener('click', (e) => {
        e.preventDefault();
        this.sound.playTick();
        const targetInput = this.getActiveInput();
        if (targetInput) {
          targetInput.value = '';
          targetInput.focus();
          targetInput.setSelectionRange(0, 0);
        }
      });
    }

    const btnBackspace = document.getElementById('btnKeyBackspace');
    if (btnBackspace) {
      btnBackspace.addEventListener('pointerdown', (e) => e.preventDefault());
      btnBackspace.addEventListener('click', (e) => {
        e.preventDefault();
        this.sound.playTick();
        const targetInput = this.getActiveInput();
        if (targetInput) {
          const val = targetInput.value;
          if (val.length > 0) {
            // En son sola eklenen basamağı sil
            targetInput.value = val.slice(1);
          }
          targetInput.focus();
          targetInput.setSelectionRange(0, 0);
        }
      });
    }

    // İstatistik Modalı
    this.openStatsBtn.addEventListener('click', () => this.openStatsModal());
    this.closeStatsModalBtn.addEventListener('click', () => this.closeStatsModal());
    this.statsModalOverlay.addEventListener('click', (e) => {
      if (e.target === this.statsModalOverlay) this.closeStatsModal();
    });

    // Takvim Navigasyonu
    this.calPrevMonthBtn.addEventListener('click', () => {
      this.sound.playTick();
      this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() - 1);
      this.syncCalendarView();
    });

    this.calNextMonthBtn.addEventListener('click', () => {
      this.sound.playTick();
      this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() + 1);
      this.syncCalendarView();
    });

    this.calYearSelect.addEventListener('change', () => {
      this.calCurrentDate.setFullYear(parseInt(this.calYearSelect.value, 10));
      this.syncCalendarView();
    });

    this.calMonthSelect.addEventListener('change', () => {
      this.calCurrentDate.setMonth(parseInt(this.calMonthSelect.value, 10));
      this.syncCalendarView();
    });

    this.calTodayBtn.addEventListener('click', () => {
      this.sound.playTick();
      this.calCurrentDate = new Date();
      this.selectedCalDateStr = this.store.getLocalDateString(new Date());
      this.syncCalendarView();
    });

    // Veri Sıfırlama & Yedekleme (Ebeveyn Parolası Korumalı)
    this.resetDataBtn.addEventListener('click', () => {
      const password = prompt("Matematik istatistiklerini sıfırlamak için ebeveyn parolasını girin:");
      if (password === "7395fa") {
        this.confirmModalOverlay.classList.add('active');
      } else if (password !== null) {
        alert("Hatalı parola! İstatistikler sıfırlanmadı.");
      }
    });

    this.cancelResetBtn.addEventListener('click', () => {
      this.confirmModalOverlay.classList.remove('active');
    });

    this.confirmResetBtn.addEventListener('click', () => {
      this.store.resetAll();
      this.currentStreak = 0;
      this.confirmModalOverlay.classList.remove('active');
      this.updateScoreboard();
      this.updateMiniSummary();
      this.renderStatsModal();
      this.syncCalendarView();
      this.showFeedback('Tüm veriler başarıyla sıfırlandı 🧹', 'timeout');
      alert("Tüm matematik istatistikleri başarıyla sıfırlandı! 🌟");
    });

    this.exportDataBtn.addEventListener('click', () => this.exportData());
    this.importDataInput.addEventListener('change', (e) => this.importData(e));

    // Tebrik Modalı Kapatma
    this.closeCelebBtn.addEventListener('click', () => {
      this.celebrationOverlay.classList.remove('active');
      if (this.isGameRunning) this.generateNewQuestion();
    });
  }

  // ==========================================
  // Başlat / Bitir Durum Yönetimi
  // ==========================================
  toggleGamePlay() {
    this.sound.playTick();
    if (!this.isGameRunning) {
      // Oyunu Başlat
      this.isGameRunning = true;
      this.toggleGamePlayBtn.classList.add('active-running');
      this.startBtnIcon.textContent = '🛑';
      this.startBtnText.textContent = 'Oyunu Bitir';
      
      this.idleSplash.style.display = 'none';
      this.activeGameWrap.style.display = 'grid';
      
      this.generateNewQuestion();
    } else {
      // Oyunu Durdur
      this.isGameRunning = false;
      this.clearTimer();
      this.toggleGamePlayBtn.classList.remove('active-running');
      this.startBtnIcon.textContent = '🚀';
      this.startBtnText.textContent = 'Oyunu Başlat';
      
      this.activeGameWrap.style.display = 'none';
      this.idleSplash.style.display = 'flex';
      this.feedbackContent.className = 'feedback-content';
      this.feedbackContent.textContent = '';
    }
  }

  // ==========================================
  // Soru Üretim Motoru (Basamak Sayılarına Kesin Riayet)
  // ==========================================
  getRandomNumber(digits) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getSelectedOperation() {
    const checked = document.querySelector('input[name="operation"]:checked');
    let op = checked ? checked.value : 'add';
    if (op === 'mixed') {
      const ops = ['add', 'sub', 'mul', 'div'];
      return ops[Math.floor(Math.random() * ops.length)];
    }
    return op;
  }

  getSelectedLayoutMode() {
    const checked = document.querySelector('input[name="layoutMode"]:checked');
    return checked ? checked.value : 'classic';
  }

  generateNewQuestion() {
    if (!this.isGameRunning) return;

    this.clearTimer();
    this.isAnsweringBlocked = false;
    this.feedbackContent.className = 'feedback-content';
    this.feedbackContent.textContent = '';

    const d1 = parseInt(this.digit1Select.value, 10) || 3;
    const d2 = parseInt(this.digit2Select.value, 10) || 2;
    const op = this.getSelectedOperation();

    let num1, num2, symbol, answer, remainder = 0;

    if (op === 'add') {
      num1 = this.getRandomNumber(d1);
      num2 = this.getRandomNumber(d2);
      symbol = '+';
      answer = num1 + num2;
    } else if (op === 'sub') {
      let nA = this.getRandomNumber(d1);
      let nB = this.getRandomNumber(d2);
      
      if (d1 === d2) {
        num1 = Math.max(nA, nB);
        num2 = Math.min(nA, nB);
      } else if (d1 > d2) {
        num1 = nA;
        num2 = nB;
      } else {
        // d1 < d2 ise büyük basamaklı olan üstte olsun
        num1 = nB;
        num2 = nA;
      }
      symbol = '−';
      answer = num1 - num2;
    } else if (op === 'mul') {
      num1 = this.getRandomNumber(d1);
      num2 = this.getRandomNumber(d2);
      symbol = '×';
      answer = num1 * num2;
    } else if (op === 'div') {
      // BÖLME İŞLEMİNDE BASAMAKLARA KESİN RİAYET
      // num1: d1 basamaklı Bölünen
      // num2: d2 basamaklı Bölen
      let dividendDigits = d1;
      let divisorDigits = d2;

      // Eğer bölen basamağı bölünenden büyükse, bölüneni büyük yap
      if (dividendDigits < divisorDigits) {
        dividendDigits = d2;
        divisorDigits = d1;
      }

      num1 = this.getRandomNumber(dividendDigits);
      num2 = this.getRandomNumber(divisorDigits);

      // num1 >= num2 güvencesi (bölünen >= bölen)
      if (num1 < num2) {
        num1 = num2 + Math.floor(Math.random() * 10);
      }

      symbol = '÷';
      answer = Math.floor(num1 / num2); // Bölüm
      remainder = num1 % num2;          // Kalan
    }

    this.currentQuestion = {
      num1,
      num2,
      symbol,
      op,
      answer,       // veya Bölüm
      remainder,    // Kalan
      d1,
      d2
    };

    this.renderCurrentQuestionStage();
    this.startTimer();
  }

  // Renkli rakam formatlama
  formatColorfulDigits(num) {
    const str = num.toLocaleString('tr-TR');
    const colorClasses = ['digit-c1', 'digit-c2', 'digit-c3', 'digit-c4', 'digit-c5'];
    return str.split('').map((char, index) => {
      if (char === '.' || char === ',') {
        return `<span style="color:#a855f7; font-size: 0.9em;">${char}</span>`;
      }
      const cClass = colorClasses[index % colorClasses.length];
      return `<span class="${cClass}">${char}</span>`;
    }).join('');
  }

  // ==========================================
  // Soru Görünümünü Render Etme (Klasik vs Düz)
  // ==========================================
  renderCurrentQuestionStage() {
    if (!this.currentQuestion) return;

    const q = this.currentQuestion;
    const layout = this.getSelectedLayoutMode();
    const num1Html = this.formatColorfulDigits(q.num1);
    const num2Html = this.formatColorfulDigits(q.num2);

    let stageHtml = '';

    if (q.op === 'div') {
      // BÖLME İŞLEMİ GÖRÜNÜMLERİ
      if (layout === 'classic') {
        // Klasik Bölme Tablosu (Bölme Çizgisi)
        stageHtml = `
          <div class="question-container-classic-div" id="activeQuestionCard">
            <div class="division-classic-grid">
              
              <!-- Bölünen -->
              <div class="div-cell-dividend">
                <span class="div-label-tag">Bölünen</span>
                <div class="num-wrapper"><span class="number-display">${num1Html}</span></div>
              </div>
              
              <!-- Bölen -->
              <div class="div-cell-divisor">
                <span class="div-label-tag">Bölen</span>
                <div class="num-wrapper"><span class="number-display">${num2Html}</span></div>
              </div>
              
              <!-- Kalan -->
              <div class="div-cell-remainder">
                <span class="div-label-tag">Kalan</span>
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" id="inputRemainder" class="answer-input input-sm" placeholder="Kalan" autocomplete="off">
              </div>
              
              <!-- Bölüm -->
              <div class="div-cell-quotient">
                <span class="div-label-tag">Bölüm</span>
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" id="inputQuotient" class="answer-input input-sm" placeholder="Bölüm" autocomplete="off" autofocus>
              </div>

            </div>
          </div>
        `;
      } else {
        // Düz (Yan Yana) Bölme Görünümü
        stageHtml = `
          <div class="question-container-inline division-inline" id="activeQuestionCard">
            <div class="num-wrapper"><span class="number-display">${num1Html}</span></div>
            <div class="op-badge">÷</div>
            <div class="num-wrapper"><span class="number-display">${num2Html}</span></div>
            <div class="equals-badge">=</div>
            
            <div class="inline-div-answers">
              <div class="input-block">
                <span class="input-block-label">Bölüm</span>
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" id="inputQuotient" class="answer-input input-sm" placeholder="Bölüm" autocomplete="off" autofocus>
              </div>
              <div class="input-block">
                <span class="input-block-label">Kalan</span>
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" id="inputRemainder" class="answer-input input-sm" placeholder="Kalan" autocomplete="off">
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // TOPLAMA, ÇIKARMA, ÇARPMA GÖRÜNÜMLERİ
      if (q.op === 'mul' && layout === 'classic' && q.d2 >= 2) {
        // ÇOK BASAMAKLI ÇARPMA (2, 3, 4 Basamaklı Çarpan için Ara Çarpım Satırları + Toplama)
        const num2Str = String(q.num2);
        const k = num2Str.length;
        let partialRowsHtml = '';
        
        for (let i = 0; i < k; i++) {
          const shiftPx = i * 19;
          partialRowsHtml += `
            <div class="classic-row" style="margin-top: 4px; justify-content: flex-end;">
              <div style="margin-right: ${shiftPx}px;">
                <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" 
                       id="inputPartial${i}" class="answer-input input-partial" 
                       placeholder="${i + 1}. Çarpım" autocomplete="off" ${i === 0 ? 'autofocus' : ''}>
              </div>
            </div>
          `;
        }

        stageHtml = `
          <div class="question-container-classic question-container-classic-mul" id="activeQuestionCard">
            <div class="classic-row">
              <div class="num-wrapper"><span class="number-display">${num1Html}</span></div>
            </div>
            <div class="classic-row">
              <span class="classic-op-sym">${q.symbol}</span>
              <div class="num-wrapper"><span class="number-display">${num2Html}</span></div>
            </div>
            <div class="classic-divider-line"></div>
            
            <!-- Ara Çarpım Satırları (Her basamak için bir satır) -->
            ${partialRowsHtml}
            
            <!-- Toplama Çizgisi ve + Sembolü -->
            <div class="classic-plus-row">
              <span class="classic-plus-sym">+</span>
              <div class="classic-divider-line plus-line"></div>
            </div>
            
            <!-- Genel Toplam Satırı -->
            <div class="classic-row" style="margin-top: 4px;">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="12" 
                     id="inputFinalAnswer" class="answer-input input-final-answer" placeholder="Sonuç" autocomplete="off">
            </div>
          </div>
        `;
      } else if (layout === 'classic') {
        // Klasik (Alt Alta) Standart Tek Satır Cevap
        stageHtml = `
          <div class="question-container-classic" id="activeQuestionCard">
            <div class="classic-row">
              <div class="num-wrapper"><span class="number-display">${num1Html}</span></div>
            </div>
            <div class="classic-row">
              <span class="classic-op-sym">${q.symbol}</span>
              <div class="num-wrapper"><span class="number-display">${num2Html}</span></div>
            </div>
            <div class="classic-divider-line"></div>
            <div class="classic-row" style="margin-top: 6px;">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" id="inputSingleAnswer" class="answer-input" placeholder="?" autocomplete="off" autofocus>
            </div>
          </div>
        `;
      } else {
        // Düz (Yan Yana)
        stageHtml = `
          <div class="question-container-inline" id="activeQuestionCard">
            <div class="num-wrapper"><span class="number-display">${num1Html}</span></div>
            <div class="op-badge">${q.symbol}</div>
            <div class="num-wrapper"><span class="number-display">${num2Html}</span></div>
            <div class="equals-badge">=</div>
            <div class="answer-box-wrapper">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" id="inputSingleAnswer" class="answer-input" placeholder="?" autocomplete="off" autofocus>
            </div>
          </div>
        `;
      }
    }

    this.questionStageContainer.innerHTML = stageHtml;
    this.bindStageInputs();
  }

  bindStageInputs() {
    const singleInput = document.getElementById('inputSingleAnswer');
    const quotientInput = document.getElementById('inputQuotient');
    const remainderInput = document.getElementById('inputRemainder');

    const multiMulPartialInputs = [];
    if (this.currentQuestion && this.currentQuestion.op === 'mul' && this.getSelectedLayoutMode() === 'classic' && this.currentQuestion.d2 >= 2) {
      const num2Str = String(this.currentQuestion.num2);
      for (let i = 0; i < num2Str.length; i++) {
        const pInput = document.getElementById('inputPartial' + i);
        if (pInput) multiMulPartialInputs.push(pInput);
      }
    }
    const finalAnswerInput = document.getElementById('inputFinalAnswer');

    const setupInputFilter = (input, onEnter) => {
      const keepCursorLeft = () => {
        this.activeInputEl = input;
        setTimeout(() => {
          try { input.setSelectionRange(0, 0); } catch (e) {}
        }, 10);
      };

      input.addEventListener('click', keepCursorLeft);
      input.addEventListener('focus', keepCursorLeft);
      
      input.addEventListener('keydown', (e) => {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          this.sound.playTick();
          if (input.value.length < 8) {
            // Sağdan sola hesaplama: yeni basamak sola eklenir
            input.value = e.key + input.value;
            input.setSelectionRange(0, 0);
          }
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          this.sound.playTick();
          if (input.value.length > 0) {
            // En son sola eklenen basamağı sil
            input.value = input.value.slice(1);
            input.setSelectionRange(0, 0);
          }
        } else if (e.key === 'Delete') {
          e.preventDefault();
          this.sound.playTick();
          input.value = '';
          input.setSelectionRange(0, 0);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (onEnter) onEnter();
        }
      });
    };

    if (multiMulPartialInputs.length > 0 && finalAnswerInput) {
      this.activeInputEl = multiMulPartialInputs[0];
      
      multiMulPartialInputs.forEach((pInput, idx) => {
        setupInputFilter(pInput, () => {
          if (idx + 1 < multiMulPartialInputs.length) {
            multiMulPartialInputs[idx + 1].focus();
            this.activeInputEl = multiMulPartialInputs[idx + 1];
          } else {
            finalAnswerInput.focus();
            this.activeInputEl = finalAnswerInput;
          }
        });
      });

      setupInputFilter(finalAnswerInput, () => this.handleAnswerSubmit());

      multiMulPartialInputs[0].focus();
      setTimeout(() => { try { multiMulPartialInputs[0].setSelectionRange(0, 0); } catch(e){} }, 20);
    } else if (singleInput) {
      this.activeInputEl = singleInput;
      setupInputFilter(singleInput, () => this.handleAnswerSubmit());
      singleInput.focus();
      setTimeout(() => { try { singleInput.setSelectionRange(0, 0); } catch(e){} }, 20);
    } else if (quotientInput && remainderInput) {
      this.activeInputEl = quotientInput;
      setupInputFilter(quotientInput, () => {
        remainderInput.focus();
        setTimeout(() => { try { remainderInput.setSelectionRange(0, 0); } catch(e){} }, 20);
        this.activeInputEl = remainderInput;
      });
      setupInputFilter(remainderInput, () => this.handleAnswerSubmit());
      quotientInput.focus();
      setTimeout(() => { try { quotientInput.setSelectionRange(0, 0); } catch(e){} }, 20);
    }
  }

  getActiveInput() {
    if (this.activeInputEl && document.body.contains(this.activeInputEl)) {
      return this.activeInputEl;
    }
    const partial0 = document.getElementById('inputPartial0');
    if (partial0) return partial0;
    const finalAns = document.getElementById('inputFinalAnswer');
    if (finalAns) return finalAns;
    const single = document.getElementById('inputSingleAnswer');
    if (single) return single;
    const quot = document.getElementById('inputQuotient');
    if (quot) return quot;
    return null;
  }

  // ==========================================
  // Süre Sayacı
  // ==========================================
  startTimer() {
    this.clearTimer();
    const isUnlimited = this.unlimitedTimeCheck.checked;
    this.timeLimit = parseInt(this.timeLimitInput.value, 10) || 10;
    this.timeRemaining = this.timeLimit;
    this.questionStartTime = Date.now();

    if (isUnlimited) {
      this.timerSection.style.display = 'none';
      return;
    }

    this.timerSection.style.display = 'block';
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeRemaining -= 0.1;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.updateTimerDisplay();
        this.handleTimeout();
      } else {
        this.updateTimerDisplay();
      }
    }, 100);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const secondsRounded = Math.ceil(this.timeRemaining);
    this.timerSeconds.textContent = secondsRounded;
    
    const percent = Math.max(0, Math.min(100, (this.timeRemaining / this.timeLimit) * 100));
    this.timerBarFill.style.width = `${percent}%`;

    if (percent < 25) {
      this.timerBarFill.style.background = '#ef4444';
    } else if (percent < 50) {
      this.timerBarFill.style.background = '#f59e0b';
    } else {
      this.timerBarFill.style.background = 'linear-gradient(90deg, #10b981 0%, #fbbf24 50%, #f43f5e 100%)';
    }
  }

  // ==========================================
  // Cevap Kontrolü & Geri Bildirim
  // ==========================================
  handleAnswerSubmit() {
    if (this.isAnsweringBlocked || !this.currentQuestion || !this.isGameRunning) return;

    const q = this.currentQuestion;
    const isDiv = (q.op === 'div');

    let isCorrect = false;
    let userAnsText = '';
    let correctAnsText = '';

    if (isDiv) {
      const quotInput = document.getElementById('inputQuotient');
      const remInput = document.getElementById('inputRemainder');
      if (!quotInput || !remInput) return;

      const userQuotRaw = quotInput.value.trim();
      const userRemRaw = remInput.value.trim();

      if (userQuotRaw === '') {
        quotInput.focus();
        return;
      }

      const userQuot = parseInt(userQuotRaw, 10);
      const userRem = userRemRaw === '' ? 0 : parseInt(userRemRaw, 10);

      isCorrect = (userQuot === q.answer && userRem === q.remainder);
      userAnsText = `Bölüm: ${userQuot}, Kalan: ${userRem}`;
      correctAnsText = `Bölüm: ${q.answer}, Kalan: ${q.remainder}`;

      quotInput.disabled = true;
      remInput.disabled = true;
    } else if (q.op === 'mul' && this.getSelectedLayoutMode() === 'classic' && q.d2 >= 2) {
      const num2Str = String(q.num2);
      const k = num2Str.length;
      let allCorrect = true;
      const userPartials = [];
      const expectedPartials = [];

      for (let i = 0; i < k; i++) {
        const pInput = document.getElementById('inputPartial' + i);
        if (!pInput) return;
        const valRaw = pInput.value.trim();
        if (valRaw === '') {
          pInput.focus();
          this.activeInputEl = pInput;
          return;
        }
        const val = parseInt(valRaw, 10);
        const digit = parseInt(num2Str[num2Str.length - 1 - i], 10);
        const expected = q.num1 * digit;
        userPartials.push(val);
        expectedPartials.push(expected);
        if (val !== expected) {
          allCorrect = false;
        }
      }

      const finalInput = document.getElementById('inputFinalAnswer');
      if (!finalInput) return;
      const finalRaw = finalInput.value.trim();
      if (finalRaw === '') {
        finalInput.focus();
        this.activeInputEl = finalInput;
        return;
      }
      const userFinal = parseInt(finalRaw, 10);
      if (userFinal !== q.answer) {
        allCorrect = false;
      }

      // Inputları kilitle
      for (let i = 0; i < k; i++) {
        const pInput = document.getElementById('inputPartial' + i);
        if (pInput) pInput.disabled = true;
      }
      finalInput.disabled = true;

      isCorrect = allCorrect;
      userAnsText = `Ara: [${userPartials.join(', ')}], Sonuç: ${userFinal}`;
      correctAnsText = `Ara: [${expectedPartials.join(', ')}], Sonuç: ${q.answer}`;
    } else {
      const singleInput = document.getElementById('inputSingleAnswer');
      if (!singleInput) return;

      const raw = singleInput.value.trim();
      if (raw === '') {
        singleInput.focus();
        return;
      }

      const userAns = parseInt(raw, 10);
      isCorrect = (userAns === q.answer);
      userAnsText = `${userAns}`;
      correctAnsText = `${q.answer}`;

      singleInput.disabled = true;
    }

    this.clearTimer();
    this.isAnsweringBlocked = true;

    const timeSpent = Math.max(0.5, ((Date.now() - this.questionStartTime) / 1000)).toFixed(1);
    const now = new Date();
    const record = {
      date: this.store.getLocalDateString(now),
      time: now.toTimeString().split(' ')[0],
      op: q.symbol,
      q: `${q.num1} ${q.symbol} ${q.num2}`,
      userAnswer: userAnsText,
      correctAnswer: correctAnsText,
      isCorrect: isCorrect,
      timeSpent: parseFloat(timeSpent)
    };

    this.store.addRecord(record);

    if (isCorrect) {
      this.handleCorrectAnswer();
    } else {
      this.handleWrongAnswer(userAnsText, correctAnsText);
    }

    this.updateScoreboard();
    this.updateMiniSummary();
  }

  handleCorrectAnswer() {
    this.currentStreak++;
    if (this.currentStreak > (this.store.data.bestStreak || 0)) {
      this.store.data.bestStreak = this.currentStreak;
      this.store.save();
    }

    this.sound.playCorrect();
    if (window.confettiEffect) {
      window.confettiEffect.burst(window.innerWidth / 2, window.innerHeight / 2, 70);
    }

    const praises = [
      'Harikasın Prenses! ⭐',
      'Muhteşem Cevap! 🦄',
      'Sihirli bir başarı! ✨',
      'Süper Hız, Doğru Yanıt! 🚀',
      'Matematik Kraliçesi! 👑',
      'Bravo, böyle devam et! 💖'
    ];
    const msg = praises[Math.floor(Math.random() * praises.length)];
    this.showFeedback(`🎉 ${msg} (+1 Yıldız)`, 'correct');

    if (this.currentStreak === 5 || this.currentStreak === 10 || this.currentStreak === 20) {
      setTimeout(() => {
        this.triggerMilestoneCelebration(this.currentStreak);
      }, 500);
      return;
    }

    setTimeout(() => {
      if (this.isGameRunning) this.generateNewQuestion();
    }, 1400);
  }

  handleWrongAnswer(userAnsText, correctAnsText) {
    this.currentStreak = 0;
    this.sound.playWrong();
    
    const card = document.getElementById('activeQuestionCard');
    if (card) {
      card.classList.add('shake-anim');
      setTimeout(() => card.classList.remove('shake-anim'), 600);
    }

    this.showFeedback(`💡 Doğru Cevap: ${correctAnsText} (Sen: ${userAnsText}). Devam! 💪`, 'wrong');

    setTimeout(() => {
      if (this.isGameRunning) this.generateNewQuestion();
    }, 3000);
  }

  handleTimeout() {
    if (this.isAnsweringBlocked || !this.currentQuestion || !this.isGameRunning) return;
    this.clearTimer();
    this.isAnsweringBlocked = true;

    const singleInput = document.getElementById('inputSingleAnswer');
    if (singleInput) singleInput.disabled = true;
    const quotInput = document.getElementById('inputQuotient');
    if (quotInput) quotInput.disabled = true;
    const remInput = document.getElementById('inputRemainder');
    if (remInput) remInput.disabled = true;

    this.currentStreak = 0;
    this.sound.playWrong();

    const q = this.currentQuestion;
    const correctAnsText = (q.op === 'div') ? `Bölüm: ${q.answer}, Kalan: ${q.remainder}` : `${q.answer}`;

    const now = new Date();
    const record = {
      date: this.store.getLocalDateString(now),
      time: now.toTimeString().split(' ')[0],
      op: q.symbol,
      q: `${q.num1} ${q.symbol} ${q.num2}`,
      userAnswer: 'Süre Bitti',
      correctAnswer: correctAnsText,
      isCorrect: false,
      timeSpent: this.timeLimit
    };

    this.store.addRecord(record);
    this.updateScoreboard();
    this.updateMiniSummary();

    this.showFeedback(`⏳ Süre doldu! Doğru cevap: ${correctAnsText}. Bir sonrakinde daha hızlı olacaksın! 🌟`, 'timeout');

    setTimeout(() => {
      if (this.isGameRunning) this.generateNewQuestion();
    }, 3000);
  }

  showFeedback(text, type) {
    this.feedbackContent.className = `feedback-content show ${type}`;
    this.feedbackContent.textContent = text;
  }

  triggerMilestoneCelebration(streak) {
    this.sound.playFanfare();
    if (window.confettiEffect) {
      window.confettiEffect.burst(window.innerWidth / 2, window.innerHeight / 2, 120);
    }
    this.celebTitle.textContent = `${streak}'li Süper Seri! 🔥`;
    this.celebMsg.textContent = `Tebrikler! Üst üste ${streak} soruyu doğru bildin ve gerçek bir Matematik Yıldızı oldun! 🌟✨`;
    this.celebrationOverlay.classList.add('active');
  }

  // ==========================================
  // Skor Tablosu & Mini Özet
  // ==========================================
  updateScoreboard() {
    this.starCountEl.textContent = this.store.data.stars || 0;
    this.streakCountEl.textContent = this.currentStreak;
  }

  updateMiniSummary() {
    const todayRecords = this.store.getTodayRecords();
    const total = todayRecords.length;
    const correct = todayRecords.filter(r => r.isCorrect).length;
    const wrong = total - correct;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

    this.todayTotalVal.textContent = total;
    this.todayCorrectVal.textContent = correct;
    this.todayWrongVal.textContent = wrong;
    this.todaySuccessRate.textContent = `${rate}%`;
  }

  // ==========================================
  // İstatistikler Modalı
  // ==========================================
  openStatsModal() {
    this.sound.playTick();
    this.renderStatsModal();
    this.syncCalendarView();
    this.statsModalOverlay.classList.add('active');
  }

  closeStatsModal() {
    this.statsModalOverlay.classList.remove('active');
  }

  renderStatsModal() {
    const all = this.store.data.history;
    const total = all.length;
    const correct = all.filter(r => r.isCorrect).length;
    const wrong = total - correct;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

    this.modalTotalSolved.textContent = total;
    this.modalTotalCorrect.textContent = correct;
    this.modalTotalWrong.textContent = wrong;
    this.modalOverallRate.textContent = `${rate}%`;

    // Bugün
    const today = this.store.getTodayRecords();
    const tTot = today.length;
    const tCor = today.filter(r => r.isCorrect).length;
    const tRate = tTot > 0 ? Math.round((tCor / tTot) * 100) : 0;
    this.todayDetailedSummary.textContent = tTot > 0 
      ? `Bugün ${tTot} soru çözüldü (${tCor} Doğru, ${tTot - tCor} Yanlış). Başarı oranı: %${tRate}`
      : 'Bugün henüz soru çözülmedi. Haydi hemen başla!';

    // Bu Hafta
    const week = this.store.getWeekRecords();
    const wTot = week.length;
    const wCor = week.filter(r => r.isCorrect).length;
    const wRate = wTot > 0 ? Math.round((wCor / wTot) * 100) : 0;
    this.weekDetailedSummary.textContent = wTot > 0
      ? `Bu hafta ${wTot} soru çözüldü (${wCor} Doğru, ${wTot - wCor} Yanlış). Başarı oranı: %${wRate}`
      : 'Bu hafta henüz çözülmüş soru bulunmuyor.';
  }

  // ==========================================
  // İnteraktif Takvim Yönetimi
  // ==========================================
  initCalendarDropdowns() {
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    this.calMonthSelect.innerHTML = monthNames.map((m, idx) => `<option value="${idx}">${m}</option>`).join('');

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 3; y <= currentYear + 5; y++) {
      years.push(y);
    }
    this.calYearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  }

  syncCalendarView() {
    const year = this.calCurrentDate.getFullYear();
    const month = this.calCurrentDate.getMonth();

    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    this.calMonthYearTitle.textContent = `${monthNames[month]} ${year}`;
    this.calYearSelect.value = year;
    this.calMonthSelect.value = month;

    this.renderCalendar();
    this.renderSelectedDayDetails();
  }

  renderCalendar() {
    this.calendarDaysGrid.innerHTML = '';

    const year = this.calCurrentDate.getFullYear();
    const month = this.calCurrentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = this.store.getLocalDateString(new Date());

    for (let i = 0; i < startOffset; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day-cell empty';
      this.calendarDaysGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRecords = this.store.getRecordsForDate(dayStr);
      
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      if (dayStr === todayStr) cell.classList.add('today');
      if (dayStr === this.selectedCalDateStr) cell.classList.add('selected');

      const numSpan = document.createElement('span');
      numSpan.className = 'day-num';
      numSpan.textContent = day;
      cell.appendChild(numSpan);

      if (dayRecords.length > 0) {
        const correct = dayRecords.filter(r => r.isCorrect).length;
        const rate = Math.round((correct / dayRecords.length) * 100);
        
        const badge = document.createElement('span');
        badge.className = 'day-badge';
        if (rate >= 85) {
          badge.classList.add('badge-perfect');
          badge.textContent = `⭐ %${rate}`;
        } else if (rate >= 50) {
          badge.classList.add('badge-good');
          badge.textContent = `%${rate}`;
        } else {
          badge.classList.add('badge-practice');
          badge.textContent = `${dayRecords.length}S`;
        }
        cell.appendChild(badge);
      }

      cell.addEventListener('click', () => {
        this.sound.playTick();
        this.selectedCalDateStr = dayStr;
        this.renderCalendar();
        this.renderSelectedDayDetails();
      });

      this.calendarDaysGrid.appendChild(cell);
    }
  }

  renderSelectedDayDetails() {
    const dayRecords = this.store.getRecordsForDate(this.selectedCalDateStr);
    const [y, m, d] = this.selectedCalDateStr.split('-');
    this.selectedDayTitle.textContent = `📅 ${d}.${m}.${y} Tarihli Karnesi`;

    if (dayRecords.length === 0) {
      this.selectedDayStatsContent.innerHTML = `
        <p style="color: #64748b; font-style: italic;">Bu tarihte çözülmüş soru bulunmuyor.</p>
      `;
      return;
    }

    const total = dayRecords.length;
    const correct = dayRecords.filter(r => r.isCorrect).length;
    const wrong = total - correct;
    const rate = Math.round((correct / total) * 100);

    const recentQuestionsHtml = dayRecords.slice(-6).reverse().map(r => `
      <div style="font-size:0.8rem; padding:3px 0; border-bottom:1px solid #f3e8ff; display:flex; justify-content:space-between;">
        <span>${r.time} • <b>${r.q}</b> ➔ ${r.correctAnswer}</span>
        <span style="font-weight:bold; color: ${r.isCorrect ? '#16a34a' : '#e11d48'};">
          ${r.isCorrect ? '✅ Doğru' : `❌ (Cevap: ${r.userAnswer})`}
        </span>
      </div>
    `).join('');

    this.selectedDayStatsContent.innerHTML = `
      <div class="day-stats-chips">
        <span class="stat-chip">🎯 Toplam Soru: <b>${total}</b></span>
        <span class="stat-chip" style="color:#16a34a;">🌟 Doğru: <b>${correct}</b></span>
        <span class="stat-chip" style="color:#e11d48;">💡 Yanlış: <b>${wrong}</b></span>
        <span class="stat-chip" style="color:#9333ea;">🏆 Başarı: <b>%${rate}</b></span>
      </div>
      <div style="margin-top:12px; max-height:140px; overflow-y:auto;">
        <span style="font-size:0.82rem; font-weight:700; color:#701a75;">Çözülen Sorular (Son 6):</span>
        ${recentQuestionsHtml}
      </div>
    `;
  }

  // ==========================================
  // Veri Dışa / İçe Aktarma
  // ==========================================
  exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.store.data, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `sihirli_matematik_yedek_${this.store.getLocalDateString(new Date())}.json`);
    dlAnchor.click();
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported && Array.isArray(imported.history)) {
          this.store.data = imported;
          this.store.save();
          this.updateScoreboard();
          this.updateMiniSummary();
          this.renderStatsModal();
          this.syncCalendarView();
          alert('İstatistikler ve geçmiş kayıtlar başarıyla geri yüklendi! ⭐');
        } else {
          alert('Geçersiz dosya formatı.');
        }
      } catch (err) {
        alert('Dosya okunurken bir hata oluştu.');
      }
    };
    reader.readAsText(file);
  }
}

// Başlat
document.addEventListener('DOMContentLoaded', () => {
  window.mathApp = new MathGame();
});
