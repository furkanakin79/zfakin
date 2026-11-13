(function () {
  'use strict';

  const GRID_ROWS = 7;
  const GRID_COLS = 10;
  let grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));

  const MISSIONS = [
    { text: 'Alanı tam 12 birim kare olan bir şekil boya!', check: (a, p) => a === 12 },
    { text: 'Alanı 9, Çevresi 12 olan bir kare boya! (3×3)', check: (a, p) => a === 9 && p === 12 },
    { text: 'Alanı 8 olan ama Çevresi EN AZ 14 olan uzun bir şekil boya!', check: (a, p) => a === 8 && p >= 14 },
    { text: 'Alanı 16, Çevresi 16 olan büyük bir kare boya! (4×4)', check: (a, p) => a === 16 && p === 16 }
  ];
  let missionIdx = 0;

  // Rounding state
  let roundMode = 'ten'; // 'ten' | 'hundred'
  let roundNum = 43;
  let roundScore = 0;
  let initialized = false;

  function playBeep(freq = 540) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.11, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {}
  }

  function calcAreaAndPerimeter() {
    let area = 0;
    let perimeter = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!grid[r][c]) continue;
        area++;
        if (r === 0 || !grid[r - 1][c]) perimeter++;
        if (r === GRID_ROWS - 1 || !grid[r + 1][c]) perimeter++;
        if (c === 0 || !grid[r][c - 1]) perimeter++;
        if (c === GRID_COLS - 1 || !grid[r][c + 1]) perimeter++;
      }
    }
    return { area, perimeter };
  }

  function renderGrid() {
    const board = document.getElementById('geoGridBoard');
    const areaEl = document.getElementById('geoAreaVal');
    const perimEl = document.getElementById('geoPerimVal');
    const missionEl = document.getElementById('geoMissionBox');
    if (!board) return;

    let html = '';
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        html += `<div class="geo-cell ${grid[r][c] ? 'filled' : ''}" onclick="GEO.toggleCell(${r}, ${c})"></div>`;
      }
    }
    board.innerHTML = html;

    const { area, perimeter } = calcAreaAndPerimeter();
    if (areaEl) areaEl.textContent = area;
    if (perimEl) perimEl.textContent = perimeter;

    if (missionEl) {
      const m = MISSIONS[missionIdx];
      const done = m.check(area, perimeter);
      missionEl.innerHTML = done
        ? `<span class="geo-mission-done">🎉 Görev Tamamlandı! "${m.text}"</span>`
        : `<span>🎯 <b>Görev:</b> ${m.text}</span>`;
      if (done && window.confetti) {
        // Trigger subtle celebration only once when completed
      }
    }
  }

  function newRoundQuestion() {
    if (roundMode === 'ten') {
      roundNum = Math.floor(Math.random() * 88) + 11; // 11..98
      if (roundNum % 10 === 0) roundNum += 3;
    } else {
      roundNum = Math.floor(Math.random() * 850) + 112; // 112..961
      if (roundNum % 100 === 0) roundNum += 25;
    }
    renderRounding();
  }

  function renderRounding() {
    const numEl = document.getElementById('roundTargetNum');
    const lowBtn = document.getElementById('roundOptLow');
    const highBtn = document.getElementById('roundOptHigh');
    const markerEl = document.getElementById('roundCarMarker');
    const lowLabel = document.getElementById('roundLineLow');
    const midLabel = document.getElementById('roundLineMid');
    const highLabel = document.getElementById('roundLineHigh');
    const fbEl = document.getElementById('roundFeedback');
    const scoreEl = document.getElementById('roundScoreVal');

    const step = roundMode === 'ten' ? 10 : 100;
    const low = Math.floor(roundNum / step) * step;
    const high = low + step;
    const mid = low + step / 2;
    const pct = ((roundNum - low) / step) * 100;

    if (numEl) numEl.textContent = roundNum;
    if (lowBtn) lowBtn.textContent = low;
    if (highBtn) highBtn.textContent = high;
    if (lowLabel) lowLabel.textContent = low;
    if (midLabel) midLabel.textContent = mid;
    if (highLabel) highLabel.textContent = high;
    if (markerEl) markerEl.style.left = `${pct}%`;
    if (scoreEl) scoreEl.textContent = roundScore;
    if (fbEl) {
      fbEl.textContent = `Sayı doğrusuna bak: ${roundNum} sayısı ${low}'a mı yoksa ${high}'a mı daha yakın? (Tam ortadaki ${mid} her zaman yukarı yuvarlanır!)`;
      fbEl.className = 'round-feedback';
    }
  }

  function checkRounding(choice) {
    const step = roundMode === 'ten' ? 10 : 100;
    const low = Math.floor(roundNum / step) * step;
    const high = low + step;
    const rem = roundNum % step;
    const correct = rem >= step / 2 ? high : low;
    const chosenVal = choice === 'low' ? low : high;
    const fbEl = document.getElementById('roundFeedback');

    if (chosenVal === correct) {
      playBeep(760);
      roundScore++;
      if (window.confetti) window.confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
      if (fbEl) {
        fbEl.textContent = `🎉 Doğru! ${roundNum} en yakın ${roundMode === 'ten' ? 'onluk' : 'yüzlük'} olarak ${correct}'a yuvarlanır!`;
        fbEl.className = 'round-feedback success';
      }
      const scoreEl = document.getElementById('roundScoreVal');
      if (scoreEl) scoreEl.textContent = roundScore;
      setTimeout(newRoundQuestion, 1500);
    } else {
      playBeep(240);
      if (fbEl) {
        fbEl.textContent = `💡 İpucu: Sayı doğrusunda arabanın hangi durağa daha yakın olduğuna bak (${roundNum % step >= step / 2 ? 'ortayı geçtiği için sağa' : 'ortanın solunda kaldığı için sola'})!`;
        fbEl.className = 'round-feedback warn';
      }
    }
  }

  window.initGeometryPage = function () {
    if (!initialized) {
      initialized = true;
      // Default 3x4 rectangle
      for (let r = 2; r < 5; r++) {
        for (let c = 3; c < 7; c++) grid[r][c] = true;
      }
      renderGrid();
      newRoundQuestion();
    }
  };

  window.GEO = {
    switchTab(tab) {
      playBeep(500);
      document.querySelectorAll('#viewGeometry .geo-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#viewGeometry .geo-panel').forEach(p => p.classList.remove('active'));
      const b = document.getElementById('geoTab_' + tab);
      const p = document.getElementById('geoPanel_' + tab);
      if (b) b.classList.add('active');
      if (p) p.classList.add('active');
    },
    toggleCell(r, c) {
      grid[r][c] = !grid[r][c];
      playBeep(grid[r][c] ? 620 : 400);
      const prevDone = MISSIONS[missionIdx].check(...Object.values(calcAreaAndPerimeter()));
      renderGrid();
      const { area, perimeter } = calcAreaAndPerimeter();
      if (MISSIONS[missionIdx].check(area, perimeter) && window.confetti) {
        window.confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
      }
    },
    clearGrid() {
      playBeep(360);
      grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
      renderGrid();
    },
    nextMission() {
      playBeep(580);
      missionIdx = (missionIdx + 1) % MISSIONS.length;
      renderGrid();
    },
    setRoundMode(m) {
      playBeep(520);
      roundMode = m;
      document.querySelectorAll('#viewGeometry .round-mode-btn').forEach(b => b.classList.remove('active'));
      const b = document.getElementById('roundMode_' + m);
      if (b) b.classList.add('active');
      newRoundQuestion();
    },
    checkRounding,
    newRoundQuestion
  };
})();
