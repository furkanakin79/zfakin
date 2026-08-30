/**
 * Çarpım Tablosu Keşif & Görsel Öğrenme Modülü
 * Ezberlemeye son: Gruplama, Alan/Grid, Sayı Doğrusu ve Tekrarlı Toplama Görselleştirmeleri
 */

class MultSoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  }

  playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.09;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch (e) {}
  }

  playFlip() {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(640, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }
}

class MultiplicationExplorer {
  constructor() {
    this.sound = new MultSoundSynth();
    
    // Durum
    this.activeNum1 = 4;
    this.activeNum2 = 6;
    this.isFlipped = false; // A x B <-> B x A
    this.activeModel = 'baskets'; // 'baskets', 'grid', 'numberline', 'addition'
    this.selectedItemEmoji = '🍎';
    this.selectedTableFilter = 'all'; // 'all' veya 1..10
    
    // Quiz İstatistikleri
    this.quizTotal = 0;
    this.quizCorrect = 0;
    this.quizStreak = 0;
    this.isAnswered = false;

    // DOM Referansları
    this.dom = {};
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.buildMatrixTable();
    this.newQuizQuestion();
    this.renderCurrentVisualModel();
  }

  cacheDom() {
    this.dom.tabQuiz = document.getElementById('multTabBtnQuiz');
    this.dom.tabMatrix = document.getElementById('multTabBtnMatrix');
    this.dom.paneQuiz = document.getElementById('multPaneQuiz');
    this.dom.paneMatrix = document.getElementById('multPaneMatrix');

    this.dom.modelTabs = document.querySelectorAll('.mult-model-tab-btn');
    this.dom.visualStage = document.getElementById('multVisualStage');
    this.dom.btnFlipOrder = document.getElementById('btnMultFlipOrder');
    this.dom.equationDisplay = document.getElementById('multEquationDisplay');
    this.dom.conceptSubtitle = document.getElementById('multConceptSubtitle');
    this.dom.emojiSelector = document.getElementById('multEmojiSelector');
    this.dom.tableFilterSelect = document.getElementById('multTableFilter');

    // Quiz Elemanları
    this.dom.quizQText = document.getElementById('multQuizQText');
    this.dom.quizInput = document.getElementById('multQuizInput');
    this.dom.quizSubmitBtn = document.getElementById('multQuizSubmitBtn');
    this.dom.quizNextBtn = document.getElementById('multQuizNextBtn');
    this.dom.quizFeedback = document.getElementById('multQuizFeedback');
    this.dom.quizStreakText = document.getElementById('multQuizStreakText');
    this.dom.quizScoreText = document.getElementById('multQuizScoreText');

    // Matris Elemanı
    this.dom.matrixGrid = document.getElementById('multMatrixGrid');
    this.dom.matrixHoverInfo = document.getElementById('multMatrixHoverInfo');
  }

  bindEvents() {
    // Üst Mod Değişimi: Quiz vs Matris Tablosu
    if (this.dom.tabQuiz && this.dom.tabMatrix) {
      this.dom.tabQuiz.addEventListener('click', () => this.switchMode('quiz'));
      this.dom.tabMatrix.addEventListener('click', () => this.switchMode('matrix'));
    }

    // Görsel Model Değişimi (Sepetler, Grid, Sayı Doğrusu, Toplama)
    if (this.dom.modelTabs) {
      this.dom.modelTabs.forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playPop();
          this.dom.modelTabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeModel = btn.getAttribute('data-model');
          this.renderCurrentVisualModel();
        });
      });
    }

    // Yer Değiştirme (Değişme Özelliği A x B <-> B x A)
    if (this.dom.btnFlipOrder) {
      this.dom.btnFlipOrder.addEventListener('click', () => {
        this.sound.playFlip();
        this.isFlipped = !this.isFlipped;
        this.renderCurrentVisualModel();
      });
    }

    // Emoji / Meyve Nesne Seçimi
    if (this.dom.emojiSelector) {
      this.dom.emojiSelector.addEventListener('click', (e) => {
        const target = e.target.closest('.emoji-choice-btn');
        if (target) {
          this.sound.playPop();
          document.querySelectorAll('.emoji-choice-btn').forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          this.selectedItemEmoji = target.getAttribute('data-emoji');
          this.renderCurrentVisualModel();
        }
      });
    }

    // Çarpan Filtresi Değişimi (2'ler, 3'ler...)
    if (this.dom.tableFilterSelect) {
      this.dom.tableFilterSelect.addEventListener('change', () => {
        this.selectedTableFilter = this.dom.tableFilterSelect.value;
        this.newQuizQuestion();
      });
    }

    // Quiz Cevap Gönderme & Sonraki Soru
    if (this.dom.quizSubmitBtn) {
      this.dom.quizSubmitBtn.addEventListener('click', () => this.checkQuizAnswer());
    }
    if (this.dom.quizNextBtn) {
      this.dom.quizNextBtn.addEventListener('click', () => this.newQuizQuestion());
    }

    // Numpad Butonları (Düz / Doğal Yazım)
    document.querySelectorAll('.mult-numpad-btn[data-key]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => e.preventDefault());
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.sound.playPop();
        const key = btn.getAttribute('data-key');
        if (this.dom.quizInput) {
          if (this.dom.quizInput.value.length < 5) {
            // Doğal düz yazım: 4'e sonra 6'ya basınca 46 yazar
            this.dom.quizInput.value += key;
          }
          this.dom.quizInput.focus();
        }
      });
    });

    const btnClear = document.getElementById('multKeyClear');
    if (btnClear) {
      btnClear.addEventListener('pointerdown', (e) => e.preventDefault());
      btnClear.addEventListener('click', (e) => {
        e.preventDefault();
        this.sound.playPop();
        if (this.dom.quizInput) {
          this.dom.quizInput.value = '';
          this.dom.quizInput.focus();
        }
      });
    }

    const btnBackspace = document.getElementById('multKeyBackspace');
    if (btnBackspace) {
      btnBackspace.addEventListener('pointerdown', (e) => e.preventDefault());
      btnBackspace.addEventListener('click', (e) => {
        e.preventDefault();
        this.sound.playPop();
        if (this.dom.quizInput && this.dom.quizInput.value.length > 0) {
          this.dom.quizInput.value = this.dom.quizInput.value.slice(0, -1);
          this.dom.quizInput.focus();
        }
      });
    }

    // Fiziksel Klavye Girişi (Doğal Düz Yazım)
    if (this.dom.quizInput) {
      this.dom.quizInput.addEventListener('keydown', (e) => {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          this.sound.playPop();
          if (this.dom.quizInput.value.length < 5) {
            this.dom.quizInput.value += e.key;
          }
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          this.sound.playPop();
          if (this.dom.quizInput.value.length > 0) {
            this.dom.quizInput.value = this.dom.quizInput.value.slice(0, -1);
          }
        } else if (e.key === 'Delete') {
          e.preventDefault();
          this.sound.playPop();
          this.dom.quizInput.value = '';
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (!this.isAnswered) {
            this.checkQuizAnswer();
          } else {
            this.newQuizQuestion();
          }
        }
      });
    }
  }

  switchMode(mode) {
    this.sound.playPop();
    if (mode === 'quiz') {
      if (this.dom.tabQuiz) this.dom.tabQuiz.classList.add('active');
      if (this.dom.tabMatrix) this.dom.tabMatrix.classList.remove('active');
      if (this.dom.paneQuiz) this.dom.paneQuiz.style.display = 'block';
      if (this.dom.paneMatrix) this.dom.paneMatrix.style.display = 'none';
      if (this.dom.quizInput) this.dom.quizInput.focus();
    } else {
      if (this.dom.tabQuiz) this.dom.tabQuiz.classList.remove('active');
      if (this.dom.tabMatrix) this.dom.tabMatrix.classList.add('active');
      if (this.dom.paneQuiz) this.dom.paneQuiz.style.display = 'none';
      if (this.dom.paneMatrix) this.dom.paneMatrix.style.display = 'block';
    }
  }

  // =========================================================================
  // QUIZ ENGINE
  // =========================================================================
  newQuizQuestion() {
    this.isAnswered = false;
    this.isFlipped = false;

    // Filtreye göre sayı üret
    if (this.selectedTableFilter === 'all') {
      this.activeNum1 = Math.floor(Math.random() * 9) + 2; // 2..10
      this.activeNum2 = Math.floor(Math.random() * 9) + 2; // 2..10
    } else {
      const fixed = parseInt(this.selectedTableFilter, 10) || 6;
      this.activeNum1 = fixed;
      this.activeNum2 = Math.floor(Math.random() * 10) + 1; // 1..10
      // 50% şansla yer değiştir ki hem 6x4 hem 4x6 görsün
      if (Math.random() > 0.5) {
        const tmp = this.activeNum1;
        this.activeNum1 = this.activeNum2;
        this.activeNum2 = tmp;
      }
    }

    if (this.dom.quizQText) {
      this.dom.quizQText.innerHTML = `<span>${this.activeNum1}</span> <span class="op-sym">×</span> <span>${this.activeNum2}</span> = ?`;
    }

    if (this.dom.quizInput) {
      this.dom.quizInput.value = '';
      this.dom.quizInput.disabled = false;
      this.dom.quizInput.focus();
      setTimeout(() => {
        try { this.dom.quizInput.setSelectionRange(0, 0); } catch(e){}
      }, 20);
    }

    if (this.dom.quizSubmitBtn) this.dom.quizSubmitBtn.style.display = 'inline-flex';
    if (this.dom.quizNextBtn) this.dom.quizNextBtn.style.display = 'none';
    if (this.dom.quizFeedback) {
      this.dom.quizFeedback.className = 'mult-feedback-box';
      this.dom.quizFeedback.innerHTML = '';
      this.dom.quizFeedback.style.display = 'none';
    }

    this.renderCurrentVisualModel();
  }

  checkQuizAnswer() {
    if (this.isAnswered || !this.dom.quizInput) return;
    const rawVal = this.dom.quizInput.value.trim();
    if (rawVal === '') {
      this.dom.quizInput.focus();
      return;
    }

    const userAns = parseInt(rawVal, 10);
    const correctAns = this.activeNum1 * this.activeNum2;
    const isCorrect = (userAns === correctAns);

    this.isAnswered = true;
    this.quizTotal++;
    this.dom.quizInput.disabled = true;

    if (this.dom.quizSubmitBtn) this.dom.quizSubmitBtn.style.display = 'none';
    if (this.dom.quizNextBtn) this.dom.quizNextBtn.style.display = 'inline-flex';

    if (isCorrect) {
      this.quizCorrect++;
      this.quizStreak++;
      this.sound.playSuccess();
      if (window.confetti) {
        window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }

      if (this.dom.quizFeedback) {
        this.dom.quizFeedback.className = 'mult-feedback-box correct animate-pop';
        this.dom.quizFeedback.innerHTML = `
          <div class="fb-title">🌟 Harikasın Prenses! Doğru Cevap: ${correctAns}</div>
          <div class="fb-desc">Bak, aşağıda <b>${this.activeNum1} tane ${this.activeNum2}</b>'nin nasıl bir araya geldiğini görsel olarak inceleyebilirsin! 👇</div>
        `;
        this.dom.quizFeedback.style.display = 'block';
      }
    } else {
      this.quizStreak = 0;
      this.sound.playPop();

      if (this.dom.quizFeedback) {
        this.dom.quizFeedback.className = 'mult-feedback-box wrong animate-pop';
        this.dom.quizFeedback.innerHTML = `
          <div class="fb-title">💡 Hiç sorun değil! Gel mantığına beraber bakalım:</div>
          <div class="fb-desc"><b>${this.activeNum1} × ${this.activeNum2} = ${correctAns}</b> eder. Çünkü aşağıda gördüğün gibi <b>${this.activeNum1} grupta ${this.activeNum2}'şer</b> nesne var! 👇</div>
        `;
        this.dom.quizFeedback.style.display = 'block';
      }
    }

    if (this.dom.quizStreakText) this.dom.quizStreakText.textContent = this.quizStreak;
    if (this.dom.quizScoreText) this.dom.quizScoreText.textContent = `${this.quizCorrect} / ${this.quizTotal}`;

    this.renderCurrentVisualModel();
  }

  // =========================================================================
  // GÖRSEL MODEL RENDER MERKEZİ
  // =========================================================================
  renderCurrentVisualModel() {
    if (!this.dom.visualStage) return;

    const a = this.isFlipped ? this.activeNum2 : this.activeNum1;
    const b = this.isFlipped ? this.activeNum1 : this.activeNum2;
    const product = a * b;

    // Üst Denklem ve Açıklama Metni
    if (this.dom.equationDisplay) {
      this.dom.equationDisplay.innerHTML = `
        <span class="eq-num eq-a">${a}</span>
        <span class="eq-op">×</span>
        <span class="eq-num eq-b">${b}</span>
        <span class="eq-op">=</span>
        <span class="eq-num eq-res">${product}</span>
      `;
    }

    if (this.dom.conceptSubtitle) {
      if (this.activeModel === 'baskets') {
        this.dom.conceptSubtitle.innerHTML = `🧺 <b>${a} Sepet</b> içinde <b>${b}'şer ${this.selectedItemEmoji}</b> var. Toplam: <b>${product} ${this.selectedItemEmoji}</b>`;
      } else if (this.activeModel === 'grid') {
        this.dom.conceptSubtitle.innerHTML = `🍫 <b>${a} Satır</b> ve <b>${b} Sütun</b> halinde <b>${product}</b> birim kare/blok.`;
      } else if (this.activeModel === 'numberline') {
        this.dom.conceptSubtitle.innerHTML = `🐰 0'dan başlayıp <b>${b}'şer</b> adım zıplayarak <b>${a} kez</b> ilerle $\\rightarrow$ <b>${product}</b>!`;
      } else if (this.activeModel === 'addition') {
        const terms = Array(a).fill(b).join(' + ');
        this.dom.conceptSubtitle.innerHTML = `➕ <b>${a} tane ${b}'nin</b> tekrarlı toplamı: <code>${terms} = ${product}</code>`;
      }
    }

    if (this.activeModel === 'baskets') {
      this.renderBasketsModel(a, b, product);
    } else if (this.activeModel === 'grid') {
      this.renderGridAreaModel(a, b, product);
    } else if (this.activeModel === 'numberline') {
      this.renderNumberLineModel(a, b, product);
    } else if (this.activeModel === 'addition') {
      this.renderRepeatedAdditionModel(a, b, product);
    }
  }

  // 1. SEPET / GRUPLAMA MODELİ
  renderBasketsModel(a, b, product) {
    let basketsHtml = '';
    const emoji = this.selectedItemEmoji;

    for (let i = 0; i < a; i++) {
      let itemsHtml = '';
      for (let j = 0; j < b; j++) {
        itemsHtml += `<span class="basket-item-emoji animate-pop" style="animation-delay: ${(i * b + j) * 0.02}s">${emoji}</span>`;
      }

      basketsHtml += `
        <div class="mult-basket-card animate-bounce-in" style="animation-delay: ${i * 0.05}s">
          <div class="basket-header-tag">${i + 1}. Sepet (${b})</div>
          <div class="basket-items-wrap">${itemsHtml}</div>
        </div>
      `;
    }

    this.dom.visualStage.innerHTML = `
      <div class="baskets-stage-wrap">
        <div class="baskets-grid">${basketsHtml}</div>
        <div class="baskets-summary-halo animate-glow">
          <span class="halo-icon">✨</span>
          <span>Hepsi bir araya gelince: <b>${a} × ${b} = ${product} ${emoji}</b> eder!</span>
        </div>
      </div>
    `;
  }

  // 2. DİKDÖRTGEN / ALAN / BLOK IZGARASI MODELİ
  renderGridAreaModel(a, b, product) {
    let gridRowsHtml = '';
    for (let r = 0; r < a; r++) {
      let rowCells = '';
      for (let c = 0; c < b; c++) {
        const cellNum = r * b + c + 1;
        rowCells += `
          <div class="grid-area-cell animate-pop" style="animation-delay: ${cellNum * 0.015}s" title="${r + 1}. Satır, ${c + 1}. Sütun">
            <span>${cellNum}</span>
          </div>
        `;
      }
      gridRowsHtml += `<div class="grid-area-row">${rowCells}</div>`;
    }

    this.dom.visualStage.innerHTML = `
      <div class="grid-stage-wrap">
        <div class="grid-dimension-top">
          <span class="dim-arrow">←</span> <b>${b} Sütun (Genişlik)</b> <span class="dim-arrow">→</span>
        </div>
        <div class="grid-middle-row">
          <div class="grid-dimension-left">
            <span class="dim-arrow">↑</span><br><b>${a} Satır</b><br><b>(Yükseklik)</b><br><span class="dim-arrow">↓</span>
          </div>
          <div class="grid-area-container">
            ${gridRowsHtml}
          </div>
        </div>
        <div class="grid-summary-tag">
          🍫 Alan = ${a} satır × ${b} sütun = <b>${product} birim kare</b>
        </div>
      </div>
    `;
  }

  // 3. SAYI DOĞRUSU / RİTMİK ZIPLAMA MODELİ (Yarım Daire Yayları & Zıplayan Emoji)
  renderNumberLineModel(a, b, product) {
    const maxVal = Math.max(product + b, 12);
    const emoji = this.selectedItemEmoji;
    const stepWidth = 38;
    const padX = 45;
    const svgWidth = padX * 2 + maxVal * stepWidth;
    const baselineY = 135;
    const svgHeight = 190;

    let svgArcs = '';
    let svgMarkers = '';
    let svgTicks = '';
    let svgLabels = '';

    // 1. Zıplama Yayları (Yarım Daire / Parabolik Eğriler)
    for (let s = 1; s <= a; s++) {
      const x1 = padX + (s - 1) * b * stepWidth;
      const x2 = padX + s * b * stepWidth;
      const dx = x2 - x1;
      const midX = (x1 + x2) / 2;
      const arcH = Math.min(dx * 0.45 + 30, 85);
      const midY = baselineY - arcH;
      const delay = (s - 1) * 0.6;

      // SVG Parabolik Yay Çizgisi
      svgArcs += `
        <path d="M ${x1},${baselineY} Q ${midX},${baselineY - arcH * 1.8} ${x2},${baselineY}" 
              class="animated-jump-arc" 
              style="animation-delay: ${delay}s;" />
      `;

      // Yayın Tepesindeki Adım Rozeti (+b)
      svgArcs += `
        <g class="arc-badge-group" style="animation-delay: ${delay + 0.2}s;">
          <rect x="${midX - 20}" y="${midY - 14}" width="40" height="22" rx="7" class="arc-badge-bg" />
          <text x="${midX}" y="${midY + 2}" text-anchor="middle" class="arc-badge-text">+${b}</text>
        </g>
      `;

      // Ucunda Zıplayan Sevimli Emoji
      svgMarkers += `
        <text x="${x2}" y="${baselineY - 8}" text-anchor="middle" class="jumping-emoji-marker" 
              style="animation-delay: ${delay + 0.45}s;">${emoji}</text>
      `;
    }

    // 2. Sayı Doğrusu Çizgisi, Tırtıkları ve Sayı Etiketleri
    for (let p = 0; p <= maxVal; p++) {
      const xp = padX + p * stepWidth;
      const isTarget = (p % b === 0 && p <= product && p > 0);
      const isFinal = (p === product);
      const isMajor = (p % b === 0 || p % 5 === 0);

      const tickTop = baselineY - (isFinal ? 12 : (isMajor ? 8 : 4));
      const tickBottom = baselineY + (isFinal ? 12 : (isMajor ? 8 : 4));

      svgTicks += `
        <line x1="${xp}" y1="${tickTop}" x2="${xp}" y2="${tickBottom}" 
              class="svg-tick ${isFinal ? 'tick-final' : (isTarget ? 'tick-step' : (isMajor ? 'tick-major' : ''))}" />
      `;

      svgLabels += `
        <text x="${xp}" y="${baselineY + 24}" text-anchor="middle" 
              class="svg-num-label ${isFinal ? 'label-final' : (isTarget ? 'label-step' : '')}">
          ${p}
        </text>
      `;
    }

    this.dom.visualStage.innerHTML = `
      <div class="numline-stage-wrap">
        <div class="numline-scroll-container">
          <svg class="numline-svg-canvas" viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: ${svgWidth}px; height: ${svgHeight}px;">
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#db2777" />
                <stop offset="100%" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>

            <!-- Ana Sayı Doğrusu Çizgisi -->
            <line x1="${padX - 10}" y1="${baselineY}" x2="${svgWidth - padX + 15}" y2="${baselineY}" class="svg-baseline" />
            <polygon points="${svgWidth - padX + 22},${baselineY} ${svgWidth - padX + 12},${baselineY - 5} ${svgWidth - padX + 12},${baselineY + 5}" fill="#a855f7" />

            <!-- Tırtıklar -->
            ${svgTicks}

            <!-- Sayılar -->
            ${svgLabels}

            <!-- Animasyonlu Zıplama Yayları -->
            ${svgArcs}

            <!-- Zıplayan Emojiler -->
            ${svgMarkers}
          </svg>
        </div>

        <div class="numline-character-bubble animate-bounce">
          🐰 <b>0</b>'dan başlayıp <b>${b}'şer</b> adımlarla <b>${a} yarım daire zıplayarak ${product}</b>'a ulaştık! (<b>${a} × ${b} = ${product} ${emoji}</b>)
        </div>
      </div>
    `;
  }

  // 4. TEKRARLI TOPLAMA MODELİ
  renderRepeatedAdditionModel(a, b, product) {
    const badges = [];
    for (let i = 0; i < a; i++) {
      badges.push(`
        <div class="addition-term-card animate-pop" style="animation-delay: ${i * 0.05}s">
          <span class="term-idx">${i + 1}. Adım</span>
          <span class="term-val">${b}</span>
        </div>
      `);
    }

    this.dom.visualStage.innerHTML = `
      <div class="addition-stage-wrap">
        <div class="addition-cards-row">
          ${badges.join('<span class="addition-plus-sym">+</span>')}
          <span class="addition-equals-sym">=</span>
          <div class="addition-result-card animate-glow">
            <span class="term-idx">Toplam Sonuç</span>
            <span class="term-val-res">${product}</span>
          </div>
        </div>
        <div class="addition-expl-box">
          💡 Çarpma işlemi, aslında <b>aynı sayıyı ${a} kez yan yana toplayıp</b> sonucu şimşek hızında bulmanın büyülü yoludur!
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 10x10 İNTERAKTİF MATRİS TABLOSU
  // =========================================================================
  buildMatrixTable() {
    if (!this.dom.matrixGrid) return;
    let gridHtml = '';

    // Sol üst köşe ×
    gridHtml += `<div class="matrix-cell matrix-corner">×</div>`;

    // Üst Başlıklar (1..10)
    for (let c = 1; c <= 10; c++) {
      gridHtml += `<div class="matrix-cell matrix-header-col" data-col="${c}">${c}</div>`;
    }

    // Gövde (Satırlar 1..10)
    for (let r = 1; r <= 10; r++) {
      gridHtml += `<div class="matrix-cell matrix-header-row" data-row="${r}">${r}</div>`;
      for (let c = 1; c <= 10; c++) {
        const prod = r * c;
        const isSquare = (r === c);
        gridHtml += `
          <div class="matrix-cell matrix-body-cell ${isSquare ? 'square-cell' : ''}" 
               data-r="${r}" data-c="${c}" data-prod="${prod}">
            ${prod}
          </div>
        `;
      }
    }

    this.dom.matrixGrid.innerHTML = gridHtml;

    // Matris Tıklama ve Hover Dinleyicileri
    this.dom.matrixGrid.querySelectorAll('.matrix-body-cell').forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const r = parseInt(cell.getAttribute('data-r'), 10);
        const c = parseInt(cell.getAttribute('data-c'), 10);
        const prod = parseInt(cell.getAttribute('data-prod'), 10);
        this.highlightMatrix(r, c);
        if (this.dom.matrixHoverInfo) {
          this.dom.matrixHoverInfo.innerHTML = `<b>${r} × ${c} = ${prod}</b> (Görseli aşağıda incelemek için tıkla!)`;
        }
      });

      cell.addEventListener('click', () => {
        this.sound.playPop();
        const r = parseInt(cell.getAttribute('data-r'), 10);
        const c = parseInt(cell.getAttribute('data-c'), 10);
        this.activeNum1 = r;
        this.activeNum2 = c;
        this.isFlipped = false;
        this.renderCurrentVisualModel();
      });
    });

    this.dom.matrixGrid.addEventListener('mouseleave', () => {
      this.clearMatrixHighlight();
    });
  }

  highlightMatrix(row, col) {
    this.clearMatrixHighlight();
    this.dom.matrixGrid.querySelectorAll('.matrix-cell').forEach(cell => {
      const r = parseInt(cell.getAttribute('data-r') || cell.getAttribute('data-row'), 10);
      const c = parseInt(cell.getAttribute('data-c') || cell.getAttribute('data-col'), 10);
      if (r === row || c === col) {
        cell.classList.add('highlight-axis');
      }
      if (r === row && c === col) {
        cell.classList.add('highlight-target');
      }
    });
  }

  clearMatrixHighlight() {
    this.dom.matrixGrid.querySelectorAll('.matrix-cell').forEach(cell => {
      cell.classList.remove('highlight-axis', 'highlight-target');
    });
  }
}

// Global Singleton
let multExplorerInstance = null;

window.initMultiplicationPage = function() {
  if (!multExplorerInstance) {
    multExplorerInstance = new MultiplicationExplorer();
    multExplorerInstance.init();
  } else {
    multExplorerInstance.renderCurrentVisualModel();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Eğer doğrudan bu sayfada açılırsa başlat
  const viewMult = document.getElementById('viewMultiplication');
  if (viewMult && viewMult.classList.contains('active')) {
    window.initMultiplicationPage();
  }
});
