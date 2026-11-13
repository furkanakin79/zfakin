/**
 * Alan Modeli ile Blok Çarpma Bulmacası (Area Model Multiplication Puzzle)
 * Sayıları basamaklarına ayırarak orantılı dikdörtgen blokları birleştirme oyunu
 */

class AreaSoundSynth {
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
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playSnap() {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
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
        const t = now + idx * 0.1;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (e) {}
  }
}

class AreaMultiplicationGame {
  constructor() {
    this.sound = new AreaSoundSynth();
    
    // Oyun Seviyesi: '2x2' (varsayılan), '2x1', '3x1', '3x2'
    this.level = '2x2';
    
    // Kenar Sayılarını Göster/Gizle Durumu (Başlangıçta AÇIK)
    this.showDimensions = true;

    // Aktif Soru Verisi
    this.num1 = 12;
    this.num2 = 23;
    this.rowParts = [10, 2];
    this.colParts = [20, 3];
    this.slots = [];
    this.calcPieces = [];
    this.prodPieces = [];
    this.selectedPiece = null; // { type: 'calc'|'prod', id: '...' }
    this.isCompleted = false;

    // İstatistikler
    this.totalSolved = 0;
    this.streak = 0;

    // DOM Referansları
    this.dom = {};
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.newQuestion();
  }

  cacheDom() {
    this.dom.stage = document.getElementById('areaPuzzleStage');
    this.dom.calcsPool = document.getElementById('areaCalcsPool');
    this.dom.piecesPool = document.getElementById('areaPiecesPool');
    this.dom.questionText = document.getElementById('areaQuestionText');
    this.dom.levelSelect = document.getElementById('areaLevelSelect');
    this.dom.toggleDimsBtn = document.getElementById('areaToggleDimsBtn');
    this.dom.nextBtn = document.getElementById('areaNextBtn');
    this.dom.newQBtn = document.getElementById('areaNewQBtn');
    this.dom.summaryCard = document.getElementById('areaSummaryCard');
    this.dom.sumEquation = document.getElementById('areaSumEquation');
    this.dom.statSolved = document.getElementById('areaStatSolved');
    this.dom.statStreak = document.getElementById('areaStatStreak');
  }

  bindEvents() {
    if (this.dom.levelSelect) {
      this.dom.levelSelect.addEventListener('change', () => {
        this.level = this.dom.levelSelect.value;
        this.newQuestion();
      });
    }

    if (this.dom.toggleDimsBtn) {
      this.dom.toggleDimsBtn.addEventListener('click', () => {
        this.sound.playPop();
        this.showDimensions = !this.showDimensions;
        this.updateDimensionsVisibility();
      });
    }

    if (this.dom.nextBtn) {
      this.dom.nextBtn.addEventListener('click', () => {
        this.sound.playPop();
        this.newQuestion();
      });
    }

    if (this.dom.newQBtn) {
      this.dom.newQBtn.addEventListener('click', () => {
        this.sound.playPop();
        this.newQuestion();
      });
    }
  }

  updateDimensionsVisibility() {
    if (this.dom.toggleDimsBtn) {
      if (this.showDimensions) {
        this.dom.toggleDimsBtn.classList.add('active');
        this.dom.toggleDimsBtn.innerHTML = '<span>👁️</span> Kenar Sayıları: Açık';
      } else {
        this.dom.toggleDimsBtn.classList.remove('active');
        this.dom.toggleDimsBtn.innerHTML = '<span>👁️</span> Kenar Sayıları: Kapalı';
      }
    }

    if (this.dom.stage) {
      if (this.showDimensions) {
        this.dom.stage.classList.remove('hide-dimensions');
      } else {
        this.dom.stage.classList.add('hide-dimensions');
      }
    }
  }

  // Basamaklarına Ayırma Fonksiyonu
  decomposeNumber(num) {
    if (num < 10) return [num];
    if (num < 100) {
      const tens = Math.floor(num / 10) * 10;
      const ones = num % 10;
      return ones > 0 ? [tens, ones] : [tens];
    }
    const hundreds = Math.floor(num / 100) * 100;
    const rem = num % 100;
    const tens = Math.floor(rem / 10) * 10;
    const ones = rem % 10;
    const parts = [hundreds];
    if (tens > 0) parts.push(tens);
    if (ones > 0) parts.push(ones);
    return parts;
  }

  generateRandomQuestion() {
    let n1, n2;
    if (this.level === '2x1') {
      n1 = Math.floor(Math.random() * 80) + 12; // 12..91
      n2 = Math.floor(Math.random() * 8) + 2;   // 2..9
      if (n1 % 10 === 0) n1 += Math.floor(Math.random() * 8) + 1;
    } else if (this.level === '3x1') {
      n1 = Math.floor(Math.random() * 800) + 112; // 112..911
      n2 = Math.floor(Math.random() * 8) + 2;     // 2..9
      if (n1 % 10 === 0) n1 += 3;
    } else if (this.level === '3x2') {
      n1 = Math.floor(Math.random() * 400) + 112; // 112..511
      n2 = Math.floor(Math.random() * 30) + 12;   // 12..41
      if (n1 % 10 === 0) n1 += 4;
      if (n2 % 10 === 0) n2 += 3;
    } else if (this.level === '3x3') {
      n1 = Math.floor(Math.random() * 400) + 112; // 112..511
      n2 = Math.floor(Math.random() * 400) + 112; // 112..511
      if (n1 % 10 === 0) n1 += 4;
      if (Math.floor(n1 / 10) % 10 === 0) n1 += 20;
      if (n2 % 10 === 0) n2 += 5;
      if (Math.floor(n2 / 10) % 10 === 0) n2 += 30;
    } else {
      // 2x2 (Standart ve Görseldeki 12 x 23 benzeri)
      n1 = Math.floor(Math.random() * 40) + 12; // 12..51
      n2 = Math.floor(Math.random() * 40) + 12; // 12..51
      if (n1 % 10 === 0) n1 += Math.floor(Math.random() * 8) + 1;
      if (n2 % 10 === 0) n2 += Math.floor(Math.random() * 8) + 1;
    }

    this.num1 = n1;
    this.num2 = n2;
    this.rowParts = this.decomposeNumber(n1); // Sol yükseklikler (ör: 10, 2)
    this.colParts = this.decomposeNumber(n2); // Üst genişlikler (ör: 20, 3)
  }

  newQuestion() {
    this.isCompleted = false;
    this.selectedPiece = null;
    this.generateRandomQuestion();

    if (this.dom.questionText) {
      this.dom.questionText.innerHTML = `
        <span class="q-num q-n1">${this.num1}</span> 
        <span class="q-op">×</span> 
        <span class="q-num q-n2">${this.num2}</span> 
        <span class="q-op">=</span> 
        <span class="q-placeholder">?</span>
      `;
    }

    if (this.dom.summaryCard) {
      this.dom.summaryCard.style.display = 'none';
      this.dom.summaryCard.classList.remove('active');
    }

    if (this.dom.nextBtn) {
      this.dom.nextBtn.style.display = 'none';
    }

    // Parçaları ve Slotları Oluştur
    this.buildPuzzleData();
    this.renderStage();
    this.renderCalcsPool();
    this.renderPiecesPool();
  }

  buildPuzzleData() {
    this.slots = [];
    this.calcPieces = [];
    this.prodPieces = [];

    let index = 0;
    for (let r = 0; r < this.rowParts.length; r++) {
      for (let c = 0; c < this.colParts.length; c++) {
        const rowVal = this.rowParts[r];
        const colVal = this.colParts[c];
        const prodVal = rowVal * colVal;
        const slotId = `slot_${r}_${c}`;

        this.slots.push({
          id: slotId,
          r,
          c,
          rowVal,
          colVal,
          prodVal,
          placedCalc: false,
          placedProd: false
        });

        // 1. Çarpım İşlem Parçası (Örn: 30 × 40)
        this.calcPieces.push({
          id: `calc_${index}`,
          type: 'calc',
          targetSlotId: slotId,
          r,
          c,
          rowVal,
          colVal,
          prodVal,
          isPlaced: false
        });

        // 2. Sonuç Blok Parçası (Örn: 1200)
        this.prodPieces.push({
          id: `prod_${index}`,
          type: 'prod',
          targetSlotId: slotId,
          r,
          c,
          rowVal,
          colVal,
          prodVal,
          isPlaced: false
        });

        index++;
      }
    }

    // Parçaları havuzlarda bağımsız karıştır
    this.calcPieces.sort(() => Math.random() - 0.5);
    this.prodPieces.sort(() => Math.random() - 0.5);
  }

  // Genişlik ve Yükseklik Oranlarını Hesapla
  calculateDimensions() {
    const totalW = this.colParts.reduce((a, b) => a + b, 0);
    const totalH = this.rowParts.reduce((a, b) => a + b, 0);

    const minPct = this.colParts.length >= 3 ? 15 : 22;
    const maxPct = this.colParts.length >= 3 ? 65 : 78;

    const colWidths = this.colParts.map(val => {
      const rawRatio = val / totalW;
      return Math.max(minPct, Math.min(maxPct, Math.round(rawRatio * 100)));
    });

    const minRowPct = this.rowParts.length >= 3 ? 15 : 24;
    const maxRowPct = this.rowParts.length >= 3 ? 65 : 76;

    const rowHeights = this.rowParts.map(val => {
      const rawRatio = val / totalH;
      return Math.max(minRowPct, Math.min(maxRowPct, Math.round(rawRatio * 100)));
    });

    const sumW = colWidths.reduce((a, b) => a + b, 0);
    const sumH = rowHeights.reduce((a, b) => a + b, 0);

    const normalizedColWidths = colWidths.map(w => `${(w / sumW) * 100}%`);
    const normalizedRowHeights = rowHeights.map(h => `${(h / sumH) * 100}%`);

    return { colWidths: normalizedColWidths, rowHeights: normalizedRowHeights };
  }

  renderStage() {
    if (!this.dom.stage) return;
    const { colWidths, rowHeights } = this.calculateDimensions();

    // 1. Üst Genişlik Etiketleri Satırı
    let topLabelsHtml = '<div class="area-top-labels-row">';
    topLabelsHtml += '<div class="area-label-corner"></div>';
    this.colParts.forEach((val, idx) => {
      topLabelsHtml += `
        <div class="area-dim-tag area-dim-top" style="width: ${colWidths[idx]}">
          <span>${val}</span>
        </div>
      `;
    });
    topLabelsHtml += '</div>';

    // 2. Sol Yükseklik Etiketleri Sütunu
    let leftLabelsHtml = '<div class="area-left-labels-col">';
    this.rowParts.forEach((rowVal, r) => {
      leftLabelsHtml += `
        <div class="area-dim-tag area-dim-left" style="height: ${rowHeights[r]}">
          <span>${rowVal}</span>
        </div>
      `;
    });
    leftLabelsHtml += '</div>';

    // 3. Kırmızı Çerçeveli Kutu
    let gridRowsHtml = '';
    for (let r = 0; r < this.rowParts.length; r++) {
      let rowSlotsHtml = '';

      for (let c = 0; c < this.colParts.length; c++) {
        const slot = this.slots.find(s => s.r === r && s.c === c);
        const colWidth = colWidths[c];
        const stateClass = (slot.placedCalc && slot.placedProd) ? 'fully-filled' 
                         : (slot.placedCalc ? 'with-calc' 
                         : (slot.placedProd ? 'with-prod' : 'empty'));

        rowSlotsHtml += `
          <div class="area-puzzle-slot ${stateClass}" 
               id="${slot.id}" 
               data-slot-id="${slot.id}"
               data-r="${r}" 
               data-c="${c}" 
               style="width: ${colWidth}; height: 100%;">
            ${this.renderSlotContent(slot)}
          </div>
        `;
      }

      gridRowsHtml += `
        <div class="area-slots-row" style="height: ${rowHeights[r]}">
          ${rowSlotsHtml}
        </div>
      `;
    }

    this.dom.stage.innerHTML = `
      <div class="area-stage-container">
        ${topLabelsHtml}
        <div class="area-main-body-row">
          ${leftLabelsHtml}
          <div class="area-grid-canvas">
            ${gridRowsHtml}
          </div>
        </div>
      </div>
    `;

    this.attachSlotListeners();
    this.updateDimensionsVisibility();
  }

  renderSlotContent(slot) {
    if (slot.placedCalc && slot.placedProd) {
      return `
        <div class="placed-slot-both animate-pop">
          <div class="placed-prod-val">${slot.prodVal}</div>
          <div class="placed-calc-sub">${slot.rowVal} × ${slot.colVal}</div>
        </div>
      `;
    } else if (slot.placedCalc) {
      return `
        <div class="placed-slot-calc-only animate-pop">
          <div class="placed-calc-sub-lg">${slot.rowVal} × ${slot.colVal}</div>
          <div class="placed-awaiting-hint">Sonucu Sürükle 👇</div>
        </div>
      `;
    } else if (slot.placedProd) {
      return `
        <div class="placed-slot-prod-only animate-pop">
          <div class="placed-prod-val">${slot.prodVal}</div>
          <div class="placed-awaiting-hint">İşlemi Sürükle 👇</div>
        </div>
      `;
    } else {
      return '';
    }
  }

  // 1. Çarpım İşlemleri Havuzunu Çiz
  renderCalcsPool() {
    if (!this.dom.calcsPool) return;
    let html = '';

    const unplaced = this.calcPieces.filter(p => !p.isPlaced);

    if (unplaced.length === 0) {
      html = `
        <div class="pool-done-badge animate-glow">
          <span>✅ Tüm işlemler yerleşti!</span>
        </div>
      `;
    } else {
      unplaced.forEach(piece => {
        const isSelected = this.selectedPiece && this.selectedPiece.id === piece.id;
        html += `
          <div class="calc-draggable-card ${isSelected ? 'selected' : ''}" 
               id="${piece.id}" 
               data-piece-id="${piece.id}" 
               data-piece-type="calc"
               draggable="true">
            <div class="calc-card-text">${piece.rowVal} × ${piece.colVal}</div>
            <div class="calc-card-hint">👆 Şekle Koy</div>
          </div>
        `;
      });
    }

    this.dom.calcsPool.innerHTML = html;
    this.attachCardListeners(this.dom.calcsPool, 'calc');
  }

  // 2. Çarpım Sonuçları Havuzunu Çiz
  renderPiecesPool() {
    if (!this.dom.piecesPool) return;
    let html = '';

    const unplaced = this.prodPieces.filter(p => !p.isPlaced);

    if (unplaced.length === 0) {
      html = `
        <div class="pool-done-badge animate-glow">
          <span>✅ Tüm sonuç blokları yerleşti!</span>
        </div>
      `;
    } else {
      unplaced.forEach(piece => {
        const isSelected = this.selectedPiece && this.selectedPiece.id === piece.id;
        html += `
          <div class="puzzle-draggable-piece ${isSelected ? 'selected' : ''}" 
               id="${piece.id}" 
               data-piece-id="${piece.id}" 
               data-piece-type="prod"
               draggable="true">
            <div class="piece-prod-preview">${piece.prodVal}</div>
            <div class="piece-touch-hint">👆 Şekle Koy</div>
          </div>
        `;
      });
    }

    this.dom.piecesPool.innerHTML = html;
    this.attachCardListeners(this.dom.piecesPool, 'prod');
  }

  attachCardListeners(containerEl, pieceType) {
    const cards = containerEl.querySelectorAll(`[data-piece-type="${pieceType}"]`);

    cards.forEach(el => {
      const pieceId = el.getAttribute('data-piece-id');

      // Tıklama / Dokunma ile Seçim
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.sound.playPop();

        if (this.selectedPiece && this.selectedPiece.id === pieceId) {
          this.selectedPiece = null;
        } else {
          this.selectedPiece = { type: pieceType, id: pieceId };
        }

        this.renderCalcsPool();
        this.renderPiecesPool();
        this.highlightCompatibleSlots();
      });

      // HTML5 Drag & Drop
      el.addEventListener('dragstart', (e) => {
        this.sound.playPop();
        this.selectedPiece = { type: pieceType, id: pieceId };
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: pieceType, id: pieceId }));
        el.classList.add('dragging');
        this.highlightCompatibleSlots();
      });

      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        this.clearSlotHighlights();
      });
    });
  }

  attachSlotListeners() {
    const slotElements = this.dom.stage.querySelectorAll('.area-puzzle-slot');

    slotElements.forEach(slotEl => {
      const slotId = slotEl.getAttribute('data-slot-id');

      // Tıklama ile Seçili Kartı Yerleştir
      slotEl.addEventListener('click', () => {
        if (!this.selectedPiece) return;
        this.tryPlacePiece(this.selectedPiece.type, this.selectedPiece.id, slotId);
      });

      // Drag Over
      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        slotEl.classList.add('drag-over');
      });

      slotEl.addEventListener('dragleave', () => {
        slotEl.classList.remove('drag-over');
      });

      // Drop
      slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        slotEl.classList.remove('drag-over');
        try {
          const dataStr = e.dataTransfer.getData('text/plain');
          const data = dataStr ? JSON.parse(dataStr) : this.selectedPiece;
          if (data && data.id && data.type) {
            this.tryPlacePiece(data.type, data.id, slotId);
          }
        } catch (err) {
          if (this.selectedPiece) {
            this.tryPlacePiece(this.selectedPiece.type, this.selectedPiece.id, slotId);
          }
        }
      });
    });
  }

  highlightCompatibleSlots() {
    this.clearSlotHighlights();
    if (!this.selectedPiece) return;

    this.dom.stage.querySelectorAll('.area-puzzle-slot').forEach(slotEl => {
      const slotId = slotEl.getAttribute('data-slot-id');
      const slot = this.slots.find(s => s.id === slotId);
      if (!slot) return;

      if (this.selectedPiece.type === 'calc' && !slot.placedCalc) {
        slotEl.classList.add('ready-target');
      } else if (this.selectedPiece.type === 'prod' && !slot.placedProd) {
        slotEl.classList.add('ready-target');
      }
    });
  }

  clearSlotHighlights() {
    if (!this.dom.stage) return;
    this.dom.stage.querySelectorAll('.area-puzzle-slot').forEach(slotEl => {
      slotEl.classList.remove('ready-target', 'drag-over');
    });
  }

  showMicroHint(msg) {
    let hintEl = document.getElementById('areaMicroHint');
    if (!hintEl && this.dom.stage && this.dom.stage.parentElement) {
      hintEl = document.createElement('div');
      hintEl.id = 'areaMicroHint';
      hintEl.className = 'area-micro-hint';
      this.dom.stage.parentElement.appendChild(hintEl);
    }
    if (hintEl) {
      hintEl.innerHTML = msg;
      hintEl.style.display = 'block';
    }
  }

  hideMicroHint() {
    const hintEl = document.getElementById('areaMicroHint');
    if (hintEl) hintEl.style.display = 'none';
  }

  tryPlacePiece(pieceType, pieceId, slotId) {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) return;

    if (pieceType === 'calc') {
      const piece = this.calcPieces.find(p => p.id === pieceId);
      if (!piece || piece.isPlaced || slot.placedCalc) return;

      const isCorrect = (piece.rowVal === slot.rowVal && piece.colVal === slot.colVal);

      if (isCorrect) {
        this.hideMicroHint();
        this.sound.playSnap();
        piece.isPlaced = true;
        slot.placedCalc = true;
        this.selectedPiece = null;

        this.renderStage();
        this.renderCalcsPool();
        this.renderPiecesPool();
        this.checkPuzzleCompletion();
      } else {
        this.sound.playPop();
        this.showMicroHint(`💡 <b>İpucu:</b> <b>${piece.rowVal} × ${piece.colVal}</b> kartını, soldaki <b>${piece.rowVal}</b> satırı ile üstteki <b>${piece.colVal}</b> sütununun kesiştiği kutuya koymalısın!`);
        const slotEl = document.getElementById(slotId);
        if (slotEl) {
          slotEl.classList.add('shake-error');
          setTimeout(() => slotEl.classList.remove('shake-error'), 400);
        }
      }
    } else if (pieceType === 'prod') {
      const piece = this.prodPieces.find(p => p.id === pieceId);
      if (!piece || piece.isPlaced || slot.placedProd) return;

      const isCorrect = (piece.prodVal === slot.prodVal && piece.rowVal === slot.rowVal && piece.colVal === slot.colVal);

      if (isCorrect) {
        this.hideMicroHint();
        this.sound.playSnap();
        piece.isPlaced = true;
        slot.placedProd = true;
        this.selectedPiece = null;

        this.renderStage();
        this.renderCalcsPool();
        this.renderPiecesPool();
        this.checkPuzzleCompletion();
      } else {
        this.sound.playPop();
        const rBase = String(piece.rowVal).replace(/0+$/, '') || String(piece.rowVal);
        const cBase = String(piece.colVal).replace(/0+$/, '') || String(piece.colVal);
        this.showMicroHint(`💡 <b>İpucu:</b> <b>${piece.prodVal}</b> sayısı için <b>${piece.rowVal} × ${piece.colVal}</b> kutusunu bul! (Sıfırları sakla: ${rBase} × ${cBase} = ${Number(rBase) * Number(cBase)})`);
        const slotEl = document.getElementById(slotId);
        if (slotEl) {
          slotEl.classList.add('shake-error');
          setTimeout(() => slotEl.classList.remove('shake-error'), 400);
        }
      }
    }
  }

  checkPuzzleCompletion() {
    const allDone = this.slots.every(s => s.placedCalc && s.placedProd);

    if (allDone) {
      this.isCompleted = true;
      this.totalSolved++;
      this.streak++;
      this.sound.playSuccess();

      if (window.confetti) {
        window.confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      }

      // Skor Güncelle
      if (this.dom.statSolved) this.dom.statSolved.textContent = this.totalSolved;
      if (this.dom.statStreak) this.dom.statStreak.textContent = this.streak;

      // Toplam Sonucu ve Çözüm Adımlarını Göster
      const totalProduct = this.num1 * this.num2;
      const terms = this.slots.map(s => s.prodVal);
      const additionString = terms.join(' + ');

      if (this.dom.summaryCard) {
        this.dom.summaryCard.style.display = 'block';
        this.dom.summaryCard.classList.add('active', 'animate-slide-down');
      }

      if (this.dom.sumEquation) {
        this.dom.sumEquation.innerHTML = `
          <div class="sum-step-line">
            <span class="sum-terms">${additionString}</span>
            <span class="sum-eq">=</span>
            <span class="sum-total-val">${totalProduct}</span>
          </div>
          <div class="sum-congrats-text">
            🌟 <b>Müthişsin!</b> ${this.num1} × ${this.num2} işleminin tüm basamak ve alan parçalarını eksiksiz yerleştirdin!
          </div>
        `;
      }

      if (this.dom.questionText) {
        this.dom.questionText.innerHTML = `
          <span class="q-num q-n1">${this.num1}</span> 
          <span class="q-op">×</span> 
          <span class="q-num q-n2">${this.num2}</span> 
          <span class="q-op">=</span> 
          <span class="q-result-total">${totalProduct}</span>
        `;
      }

      if (this.dom.nextBtn) {
        this.dom.nextBtn.style.display = 'inline-flex';
      }
    }
  }
}

// Global Singleton Başlatıcı
let areaGameInstance = null;

window.initAreaMultiplicationPage = function() {
  if (!areaGameInstance) {
    areaGameInstance = new AreaMultiplicationGame();
    areaGameInstance.init();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const viewArea = document.getElementById('viewAreaMultiplication');
  if (viewArea && viewArea.classList.contains('active')) {
    window.initAreaMultiplicationPage();
  }
});
