(function () {
  'use strict';

  let mode = 'explore'; // 'explore' | 'compare' | 'quiz'
  let num = 3;
  let den = 4;
  let visualType = 'pizza'; // 'pizza' | 'bar'

  // Compare state
  let c1Num = 1, c1Den = 2;
  let c2Num = 2, c2Den = 4;

  // Quiz state
  let quizTargetNum = 3, quizTargetDen = 4;
  let quizSelectedSlices = new Set();
  let quizScore = 0;

  let initialized = false;

  function playPop(freq = 520) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {}
  }

  function buildPizzaSvg(n, d, size = 210, interactive = false, selectedSet = null) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;

    if (d === 1) {
      const filled = interactive ? (selectedSet && selectedSet.has(0)) : n >= 1;
      const fillCol = filled ? '#ec4899' : '#f3e8ff';
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="frac-svg">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillCol}" stroke="#6b21a8" stroke-width="3"
            ${interactive ? 'style="cursor:pointer" onclick="FRAC.toggleQuizSlice(0)"' : ''} />
        </svg>
      `;
    }

    let paths = '';
    for (let i = 0; i < d; i++) {
      const startAngle = (i * 2 * Math.PI) / d - Math.PI / 2;
      const endAngle = ((i + 1) * 2 * Math.PI) / d - Math.PI / 2;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = (2 * Math.PI) / d > Math.PI ? 1 : 0;

      const isFilled = interactive ? (selectedSet && selectedSet.has(i)) : i < n;
      const fillCol = isFilled ? (i % 2 === 0 ? '#ec4899' : '#a855f7') : '#faf5ff';

      paths += `
        <path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z"
              fill="${fillCol}" stroke="#6b21a8" stroke-width="2.5"
              ${interactive ? `style="cursor:pointer; transition: fill 0.15s;" onclick="FRAC.toggleQuizSlice(${i})"` : ''} />
      `;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="frac-svg">${paths}</svg>`;
  }

  function buildBarHtml(n, d, interactive = false, selectedSet = null) {
    let cells = '';
    for (let i = 0; i < d; i++) {
      const isFilled = interactive ? (selectedSet && selectedSet.has(i)) : i < n;
      cells += `
        <div class="frac-bar-cell ${isFilled ? 'filled' : ''}"
             ${interactive ? `onclick="FRAC.toggleQuizSlice(${i})"` : ''}>
          <span>1/${d}</span>
        </div>
      `;
    }
    return `<div class="frac-bar-strip">${cells}</div>`;
  }

  function renderExplore() {
    const stage = document.getElementById('fracExploreStage');
    const numEl = document.getElementById('fracNumVal');
    const denEl = document.getElementById('fracDenVal');
    const descEl = document.getElementById('fracExplainBox');
    if (!stage) return;

    if (numEl) numEl.textContent = num;
    if (denEl) denEl.textContent = den;

    const wholeCount = Math.floor(num / den);
    const rem = num % den;
    let typeText = 'Basit Kesir (Bütünden küçük)';
    if (num === den) typeText = 'Bütün Kesir (Tam 1 bütün!)';
    else if (num > den) typeText = `Bileşik Kesir (${wholeCount} tam ${rem > 0 ? `+ ${rem}/${den}` : ''})`;

    if (descEl) {
      descEl.innerHTML = `
        <div class="frac-badge-type">${typeText}</div>
        <p>Bir bütünü <b>${den}</b> eşit parçaya böldük ve <b>${num}</b> parçasını boyadık. Okunuşu: <b>"${den}'de ${num}"</b> (veya "${num} bölü ${den}").</p>
      `;
    }

    // Support >1 whole when bileşik kesir
    const wholesNeeded = Math.max(1, Math.ceil(num / den));
    let visuals = '';
    for (let w = 0; w < wholesNeeded; w++) {
      const filledInThis = Math.max(0, Math.min(den, num - w * den));
      visuals += visualType === 'pizza'
        ? `<div class="frac-visual-item">${buildPizzaSvg(filledInThis, den, 200)}</div>`
        : `<div class="frac-visual-item" style="width:100%;">${buildBarHtml(filledInThis, den)}</div>`;
    }

    stage.innerHTML = visuals;
  }

  function renderCompare() {
    const s1 = document.getElementById('fracComp1Visual');
    const s2 = document.getElementById('fracComp2Visual');
    const res = document.getElementById('fracCompResult');
    if (!s1 || !s2 || !res) return;

    document.getElementById('fracC1Num').textContent = c1Num;
    document.getElementById('fracC1Den').textContent = c1Den;
    document.getElementById('fracC2Num').textContent = c2Num;
    document.getElementById('fracC2Den').textContent = c2Den;

    s1.innerHTML = buildPizzaSvg(c1Num, c1Den, 170) + buildBarHtml(c1Num, c1Den);
    s2.innerHTML = buildPizzaSvg(c2Num, c2Den, 170) + buildBarHtml(c2Num, c2Den);

    const v1 = c1Num / c1Den;
    const v2 = c2Num / c2Den;
    if (Math.abs(v1 - v2) < 0.0001) {
      res.innerHTML = `<span class="comp-eq">🤝 ${c1Num}/${c1Den} = ${c2Num}/${c2Den} — Bunlar <b>Denk Kesirler!</b> Boyalı alanları birebir aynı!</span>`;
    } else if (v1 > v2) {
      res.innerHTML = `<span class="comp-gt">👉 ${c1Num}/${c1Den} &gt; ${c2Num}/${c2Den} — Sol taraftaki parça daha büyük!</span>`;
    } else {
      res.innerHTML = `<span class="comp-lt">👈 ${c1Num}/${c1Den} &lt; ${c2Num}/${c2Den} — Sağ taraftaki parça daha büyük!</span>`;
    }
  }

  function newQuiz() {
    const dens = [2, 3, 4, 5, 6, 8];
    quizTargetDen = dens[Math.floor(Math.random() * dens.length)];
    quizTargetNum = Math.floor(Math.random() * (quizTargetDen - 1)) + 1;
    quizSelectedSlices = new Set();

    const qPrompt = document.getElementById('fracQuizPrompt');
    const qFeedback = document.getElementById('fracQuizFeedback');
    if (qPrompt) {
      qPrompt.innerHTML = `Pizzanın <span class="frac-target-pill">${quizTargetNum} / ${quizTargetDen}</span> kadarını boya!`;
    }
    if (qFeedback) {
      qFeedback.textContent = 'Dilimlere dokunarak veya tıklayarak boya, sonra Kontrol Et butonuna bas.';
      qFeedback.className = 'frac-quiz-feedback';
    }
    renderQuizVisual();
  }

  function renderQuizVisual() {
    const wrap = document.getElementById('fracQuizVisual');
    const scoreEl = document.getElementById('fracQuizScore');
    if (scoreEl) scoreEl.textContent = quizScore;
    if (!wrap) return;
    wrap.innerHTML = buildPizzaSvg(0, quizTargetDen, 230, true, quizSelectedSlices) +
                     buildBarHtml(0, quizTargetDen, true, quizSelectedSlices);
  }

  function toggleQuizSlice(idx) {
    playPop(580);
    if (quizSelectedSlices.has(idx)) quizSelectedSlices.delete(idx);
    else quizSelectedSlices.add(idx);
    renderQuizVisual();
  }

  function checkQuiz() {
    const fb = document.getElementById('fracQuizFeedback');
    if (quizSelectedSlices.size === quizTargetNum) {
      playPop(760);
      quizScore++;
      if (window.confetti) window.confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
      if (fb) {
        fb.textContent = `🎉 Harika! ${quizTargetDen} eşit parçadan ${quizTargetNum} tanesini doğru boyadın!`;
        fb.className = 'frac-quiz-feedback success';
      }
      setTimeout(newQuiz, 1600);
    } else {
      playPop(240);
      if (fb) {
        fb.textContent = `💡 Şu an ${quizSelectedSlices.size} parça boyadın. Hedefimiz ${quizTargetDen} parçadan ${quizTargetNum} tanesini boyamak!`;
        fb.className = 'frac-quiz-feedback warn';
      }
    }
  }

  function setMode(m) {
    playPop(500);
    mode = m;
    document.querySelectorAll('#viewFractions .frac-mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#viewFractions .frac-panel').forEach(p => p.classList.remove('active'));

    const btn = document.getElementById('fracBtn_' + m);
    const panel = document.getElementById('fracPanel_' + m);
    if (btn) btn.classList.add('active');
    if (panel) panel.classList.add('active');

    if (m === 'explore') renderExplore();
    else if (m === 'compare') renderCompare();
    else if (m === 'quiz') newQuiz();
  }

  window.initFractionsPage = function () {
    if (!initialized) {
      initialized = true;
      renderExplore();
      renderCompare();
      newQuiz();
    }
  };

  window.FRAC = {
    setMode,
    setVisualType(t) {
      playPop(520);
      visualType = t;
      document.querySelectorAll('#viewFractions .frac-vis-btn').forEach(b => b.classList.remove('active'));
      const b = document.getElementById('fracVis_' + t);
      if (b) b.classList.add('active');
      renderExplore();
    },
    changeNum(d) {
      playPop(540);
      num = Math.max(1, Math.min(16, num + d));
      renderExplore();
    },
    changeDen(d) {
      playPop(500);
      den = Math.max(1, Math.min(12, den + d));
      renderExplore();
    },
    changeComp(which, part, d) {
      playPop(520);
      if (which === 1) {
        if (part === 'num') c1Num = Math.max(1, Math.min(c1Den, c1Num + d));
        else { c1Den = Math.max(2, Math.min(12, c1Den + d)); c1Num = Math.min(c1Num, c1Den); }
      } else {
        if (part === 'num') c2Num = Math.max(1, Math.min(c2Den, c2Num + d));
        else { c2Den = Math.max(2, Math.min(12, c2Den + d)); c2Num = Math.min(c2Num, c2Den); }
      }
      renderCompare();
    },
    loadEquivalentExample(n1, d1, n2, d2) {
      playPop(620);
      c1Num = n1; c1Den = d1; c2Num = n2; c2Den = d2;
      renderCompare();
    },
    toggleQuizSlice,
    checkQuiz,
    newQuiz
  };
})();
