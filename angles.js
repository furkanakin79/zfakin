(function () {
  'use strict';

  let activeTab = 'lines'; // 'lines' | 'angles' | 'quiz'
  let selectedLineType = 'line'; // 'line' | 'segment' | 'ray'
  let angleDeg = 60;
  let quizScore = 0;
  let currentQuiz = null;
  let initialized = false;

  const LINE_INFO = {
    line: {
      title: 'Doğru (İki Ucu Sonsuz)',
      symbol: 'AB doğrusu',
      badge: 'İki ucu da ok ile gösterilir',
      desc: 'Doğru, her iki ucundan da sonsuza kadar uzayan düz çizgidir. Sonu olmadığı için cetvelle ölçülemez!',
      example: '🚆 Benzetme: İki ucu da ufka doğru uzayan dümdüz bir tren rayı!'
    },
    segment: {
      title: 'Doğru Parçası (İki Ucu Kapalı)',
      symbol: '[AB] doğru parçası',
      badge: 'İki ucu da nokta ile sınırlıdır',
      desc: 'Başlangıcı ve bitişi bellidir. İki ucu kapalı olduğu için uzunluğu cetvelle ölçülebilir!',
      example: '✏️ Benzetme: İki ucu belli olan bir kalem, cetvel veya masa kenarı!'
    },
    ray: {
      title: 'Işın (Bir Ucu Sabit, Diğer Ucu Sonsuz)',
      symbol: '[AB ışını',
      badge: 'Bir ucu nokta, diğer ucu ok',
      desc: 'Bir başlangıç noktası vardır ama diğer ucundan sonsuza kadar uzar!',
      example: '🔦 Benzetme: El fenerinden çıkan ışık! Fenerden başlar ve ileriye doğru uzar.'
    }
  };

  function playBeep(freq = 540) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.11, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch (e) {}
  }

  function buildLineSvg(type) {
    const arrowLeft = type === 'line'
      ? `<polygon points="34,70 54,58 54,82" fill="#ec4899" />`
      : `<circle cx="70" cy="70" r="8" fill="#7c3aed" stroke="#ffffff" stroke-width="2" />`;
    const arrowRight = (type === 'line' || type === 'ray')
      ? `<polygon points="386,70 366,58 366,82" fill="#ec4899" />`
      : `<circle cx="350" cy="70" r="8" fill="#7c3aed" stroke="#ffffff" stroke-width="2" />`;

    const x1 = type === 'line' ? 50 : 70;
    const x2 = (type === 'line' || type === 'ray') ? 370 : 350;

    return `
      <svg viewBox="0 0 420 130" class="ang-line-svg">
        <line x1="${x1}" y1="70" x2="${x2}" y2="70" stroke="#7c3aed" stroke-width="6" stroke-linecap="round" />
        ${arrowLeft}
        ${arrowRight}
        <circle cx="120" cy="70" r="5" fill="#ffffff" stroke="#7c3aed" stroke-width="2.5" />
        <text x="120" y="102" text-anchor="middle" font-weight="800" font-size="18" fill="#4c1d95">A</text>
        <circle cx="300" cy="70" r="5" fill="#ffffff" stroke="#7c3aed" stroke-width="2.5" />
        <text x="300" y="102" text-anchor="middle" font-weight="800" font-size="18" fill="#4c1d95">B</text>
      </svg>
    `;
  }

  function renderLines() {
    const info = LINE_INFO[selectedLineType];
    const svgEl = document.getElementById('angLineSvgStage');
    const infoEl = document.getElementById('angLineInfoBox');

    document.querySelectorAll('#viewAngles .ang-line-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('angLineBtn_' + selectedLineType);
    if (activeBtn) activeBtn.classList.add('active');

    if (svgEl) svgEl.innerHTML = buildLineSvg(selectedLineType);
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="ang-badge">${info.badge} · <b>${info.symbol}</b></div>
        <h3>${info.title}</h3>
        <p>${info.desc}</p>
        <div class="ang-example-note">${info.example}</div>
      `;
    }
  }

  function classifyAngle(deg) {
    if (deg === 0) return { name: 'Sıfır Açı (0°)', color: '#6b7280', desc: 'İki ışın üst üste duruyor, henüz açılmamış.' };
    if (deg < 90) return { name: 'Dar Açı (< 90°)', color: '#10b981', desc: '90° dik açıdan küçüktür! Yarı açık bir makas ağzı gibidir.' };
    if (deg === 90) return { name: 'Dik Açı (= 90°)', color: '#ec4899', desc: 'Tam 90 derecedir! Defter köşesi, kapı köşesi veya saat 03:00 gibidir.' };
    if (deg < 180) return { name: 'Geniş Açı (90° < açı < 180°)', color: '#f59e0b', desc: '90° dik açıdan büyük, 180° doğru açıdan küçüktür. Koltuk yaslanması gibi!' };
    return { name: 'Doğru Açı (= 180°)', color: '#8b5cf6', desc: 'Tam 180 derecedir! Dümdüz bir çizgi oluşturur (saat 06:00 gibi).' };
  }

  function buildAngleSvg(deg, size = 280) {
    const cx = 160;
    const cy = 185;
    const r = 120;
    const rad = (deg * Math.PI) / 180;
    const xEnd = cx + r * Math.cos(-rad);
    const yEnd = cy + r * Math.sin(-rad);

    // Protractor arc (0..180)
    let ticks = '';
    for (let d = 0; d <= 180; d += 15) {
      const tr = (d * Math.PI) / 180;
      const rIn = d % 30 === 0 ? 96 : 104;
      const x1 = cx + rIn * Math.cos(-tr);
      const y1 = cy + rIn * Math.sin(-tr);
      const x2 = cx + 112 * Math.cos(-tr);
      const y2 = cy + 112 * Math.sin(-tr);
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#c4b5fd" stroke-width="${d % 30 === 0 ? 2 : 1}" />`;
    }

    // Angle sector arc
    const arcR = 46;
    const ax = cx + arcR * Math.cos(-rad);
    const ay = cy + arcR * Math.sin(-rad);
    const sectorPath = deg === 0
      ? ''
      : deg === 90
        ? `<rect x="${cx}" y="${cy - 26}" width="26" height="26" fill="rgba(236,72,153,0.18)" stroke="#ec4899" stroke-width="2.5" />`
        : `<path d="M ${cx} ${cy} L ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 0 0 ${ax.toFixed(1)} ${ay.toFixed(1)} Z" fill="rgba(168,85,247,0.22)" stroke="#a855f7" stroke-width="2" />`;

    return `
      <svg viewBox="0 0 320 220" width="${size}" class="ang-protractor-svg">
        <path d="M ${cx - 115} ${cy} A 115 115 0 0 1 ${cx + 115} ${cy} Z" fill="rgba(245,243,255,0.85)" stroke="#d8b4fe" stroke-width="2" />
        ${ticks}
        ${sectorPath}
        <!-- Base Ray (0 deg) -->
        <line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#6b21a8" stroke-width="5" stroke-linecap="round" />
        <polygon points="${cx + r + 10},${cy} ${cx + r - 6},${cy - 8} ${cx + r - 6},${cy + 8}" fill="#6b21a8" />
        <!-- Rotating Ray -->
        <line x1="${cx}" y1="${cy}" x2="${xEnd.toFixed(1)}" y2="${yEnd.toFixed(1)}" stroke="#ec4899" stroke-width="5" stroke-linecap="round" />
        <circle cx="${cx}" cy="${cy}" r="7" fill="#ffffff" stroke="#6b21a8" stroke-width="3" />
        <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-weight="800" font-size="18" fill="#4c1d95">${deg}°</text>
      </svg>
    `;
  }

  function renderAngleExplorer() {
    const svgEl = document.getElementById('angProtractorStage');
    const degEl = document.getElementById('angDegDisplay');
    const sliderEl = document.getElementById('angDegSlider');
    const infoEl = document.getElementById('angTypeExplain');

    const cls = classifyAngle(angleDeg);
    if (svgEl) svgEl.innerHTML = buildAngleSvg(angleDeg, 310);
    if (degEl) degEl.textContent = `${angleDeg}°`;
    if (sliderEl && Number(sliderEl.value) !== angleDeg) sliderEl.value = angleDeg;
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="ang-type-pill" style="background:${cls.color};">${cls.name}</div>
        <p style="margin: 8px 0 0;">${cls.desc}</p>
      `;
    }
  }

  function buildQuizQuestion() {
    const r = Math.random();
    if (r < 0.45) {
      const types = ['line', 'segment', 'ray'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      const names = { line: 'Doğru', segment: 'Doğru Parçası', ray: 'Işın' };
      return {
        prompt: 'Aşağıdaki geometrik şekil hangisidir?',
        visual: buildLineSvg(chosen),
        options: ['Doğru', 'Doğru Parçası', 'Işın'],
        ans: names[chosen],
        hint: chosen === 'line'
          ? 'İki ucunda da ok var — yani iki yönden sonsuza gider!'
          : chosen === 'segment'
            ? 'İki ucu da nokta ile kapalı — uzunluğu ölçülebilir!'
            : 'Bir ucu nokta (başlangıç), diğer ucu ok (sonsuza gider)!'
      };
    }

    const anglePool = [
      { deg: 35, ans: 'Dar Açı' },
      { deg: 60, ans: 'Dar Açı' },
      { deg: 90, ans: 'Dik Açı' },
      { deg: 125, ans: 'Geniş Açı' },
      { deg: 150, ans: 'Geniş Açı' },
      { deg: 180, ans: 'Doğru Açı' }
    ];
    const pick = anglePool[Math.floor(Math.random() * anglePool.length)];
    return {
      prompt: `Ölçüsü ${pick.deg}° olan bu açı hangi tür açıdır?`,
      visual: buildAngleSvg(pick.deg, 250),
      options: ['Dar Açı', 'Dik Açı', 'Geniş Açı', 'Doğru Açı'],
      ans: pick.ans,
      hint: pick.deg < 90
        ? '90 dereceden küçük açılara Dar Açı denir!'
        : pick.deg === 90
          ? 'Tam 90 derece olan köşeli açı Dik Açıdır!'
          : pick.deg < 180
            ? '90 dereceden büyük, 180 dereceden küçük açılar Geniş Açıdır!'
            : 'Tam 180 derece dümdüz çizgi oluşturan açı Doğru Açıdır!'
    };
  }

  function newQuiz() {
    currentQuiz = buildQuizQuestion();
    const pEl = document.getElementById('angQuizPrompt');
    const vEl = document.getElementById('angQuizVisual');
    const oEl = document.getElementById('angQuizOptions');
    const fEl = document.getElementById('angQuizFeedback');
    const sEl = document.getElementById('angQuizScore');

    if (pEl) pEl.textContent = currentQuiz.prompt;
    if (vEl) vEl.innerHTML = currentQuiz.visual;
    if (sEl) sEl.textContent = quizScore;
    if (fEl) {
      fEl.textContent = 'Doğru cevabı seç!';
      fEl.className = 'ang-quiz-feedback';
    }
    if (oEl) {
      oEl.innerHTML = currentQuiz.options.map(opt => `
        <button class="meas-opt-btn" onclick="ANG.answerQuiz('${opt}')">${opt}</button>
      `).join('');
    }
  }

  window.initAnglesPage = function () {
    if (!initialized) {
      initialized = true;
      renderLines();
      renderAngleExplorer();
      newQuiz();
    }
  };

  window.ANG = {
    switchTab(tab) {
      playBeep(540);
      activeTab = tab;
      document.querySelectorAll('#viewAngles .ang-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#viewAngles .ang-panel').forEach(p => p.classList.remove('active'));
      const b = document.getElementById('angTab_' + tab);
      const p = document.getElementById('angPanel_' + tab);
      if (b) b.classList.add('active');
      if (p) p.classList.add('active');
    },
    setLineType(t) {
      playBeep(580);
      selectedLineType = t;
      renderLines();
    },
    setAngle(deg) {
      angleDeg = Math.max(0, Math.min(180, parseInt(deg, 10) || 0));
      renderAngleExplorer();
    },
    answerQuiz(chosen) {
      if (!currentQuiz) return;
      const fEl = document.getElementById('angQuizFeedback');
      const sEl = document.getElementById('angQuizScore');
      if (chosen === currentQuiz.ans) {
        playBeep(760);
        quizScore++;
        if (sEl) sEl.textContent = quizScore;
        if (window.confetti) window.confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
        if (fEl) {
          fEl.textContent = `🎉 Süper! Doğru cevap: ${currentQuiz.ans}!`;
          fEl.className = 'ang-quiz-feedback success';
        }
        setTimeout(newQuiz, 1400);
      } else {
        playBeep(240);
        if (fEl) {
          fEl.textContent = `💡 İpucu: ${currentQuiz.hint}`;
          fEl.className = 'ang-quiz-feedback warn';
        }
      }
    },
    newQuiz
  };
})();
