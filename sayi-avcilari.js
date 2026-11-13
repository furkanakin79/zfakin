(function () {
  'use strict';

    /* --- SOUND ENGINE (Web Audio API - No external assets needed!) --- */
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      document.getElementById('soundBtn').textContent = soundEnabled ? '🔊' : '🔇';
      if (soundEnabled) playPop(440);
    }

    function playPop(freq = 400, type = 'sine', duration = 0.08) {
      if (!soundEnabled) return;
      initAudio();
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch(e) {}
    }

    function playSuccessChime() {
      if (!soundEnabled) return;
      initAudio();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
          } catch(e) {}
        }, idx * 75);
      });
    }

    function playMagicWhoosh() {
      if (!soundEnabled) return;
      initAudio();
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch(e) {}
    }

    function playWrongSound() {
      if (!soundEnabled) return;
      initAudio();
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch(e) {}
    }

    /* --- CONFETTI SYSTEM --- */
    const confettiCanvas = document.getElementById('saConfettiCanvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    let confettiParticles = [];

    function resizeConfetti() {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    function triggerConfetti() {
      const colors = ['#38bdf8', '#f43f5e', '#fbbf24', '#34d399', '#a855f7', '#fb7185'];
      for (let i = 0; i < 70; i++) {
        confettiParticles.push({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.7) * 18,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1
        });
      }
    }

    function updateConfetti() {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // gravity
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.014;

        if (p.opacity <= 0) {
          confettiParticles.splice(i, 1);
          continue;
        }

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.globalAlpha = p.opacity;
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        confettiCtx.restore();
      }
      requestAnimationFrame(updateConfetti);
    }
    updateConfetti();

    /* --- TAB SWITCHING --- */
    function switchTab(tabId) {
      initAudio();
      playPop(500);
      document.querySelectorAll('#viewSayiAvcilari .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#viewSayiAvcilari .view-section').forEach(s => s.classList.remove('active'));

      if (tabId === 'multiplication') {
        document.querySelectorAll('#viewSayiAvcilari .tab-btn')[0].classList.add('active');
        document.getElementById('multiplicationView').classList.add('active');
        renderLegoGrid();
      } else if (tabId === 'division') {
        document.querySelectorAll('#viewSayiAvcilari .tab-btn')[1].classList.add('active');
        document.getElementById('divisionView').classList.add('active');
        if (divMode === 'grid') {
          resizeDivGridCanvas();
          renderDivisionGrid();
        } else {
          renderChests();
        }
      } else if (tabId === 'stepDivision') {
        document.querySelectorAll('#viewSayiAvcilari .tab-btn')[2].classList.add('active');
        document.getElementById('stepDivisionView').classList.add('active');
        initStepDivision();
      } else if (tabId === 'speed') {
        document.querySelectorAll('#viewSayiAvcilari .tab-btn')[3].classList.add('active');
        document.getElementById('speedView').classList.add('active');
        generateQuizQuestion();
      }
    }

    /* =======================================================
       1. MULTIPLICATION 3D ISOMETRIC POP-UP ENGINE
       ======================================================= */
    let factorA = 7; // Grup Sayısı (Örn: 7 Tane)
    let factorB = 6; // Her Gruptaki Blok (Örn: 6'şar)
    let isSplitActive = false;
    let splitPoint = 5;

    // View Modes & Stacking Animation
    let multViewMode = 'groups'; // 'groups' (Yan Yana) | 'tower' (Üst Üste) | 'grid' (Izgara)
    let animVisibleGroups = null; // null = all visible, number when animating
    let isStackAnimating = false;
    let stackAnimInterval = null;

    // Palette for different groups/floors
    const groupPalettes = [
      { top: '#38bdf8', left: '#0284c7', right: '#0369a1', name: 'Mavi' },
      { top: '#34d399', left: '#059669', right: '#047857', name: 'Yeşil' },
      { top: '#fbbf24', left: '#d97706', right: '#b45309', name: 'Sarı' },
      { top: '#c084fc', left: '#9333ea', right: '#7e22ce', name: 'Mor' },
      { top: '#f43f5e', left: '#e11d48', right: '#be123c', name: 'Kırmızı' },
      { top: '#2dd4bf', left: '#0d9488', right: '#115e59', name: 'Turkuaz' },
      { top: '#fb923c', left: '#ea580c', right: '#c2410c', name: 'Turuncu' },
      { top: '#a3e635', left: '#65a30d', right: '#4d7c0f', name: 'Fıstık' },
      { top: '#e879f9', left: '#c026d3', right: '#a21caf', name: 'Pembe' },
      { top: '#60a5fa', left: '#2563eb', right: '#1d4ed8', name: 'Lacivert' },
      { top: '#4ade80', left: '#16a34a', right: '#15803d', name: 'Zümrüt' },
      { top: '#f87171', left: '#dc2626', right: '#b91c1c', name: 'Mercan' },
    ];

    // 3D Orbit / Drag & Hover Variables
    let rotAngle = 0;
    let tiltY = 0;
    let isDragging = false;
    let startX = 0, startY = 0;
    let hoveredBlock = null;
    let bounceBlock = null;
    let bounceOffset = 0;

    const legoCanvas = document.getElementById('legoCanvas');
    const legoCtx = legoCanvas.getContext('2d');

    function resizeLegoCanvas() {
      const rect = legoCanvas.parentElement.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      legoCanvas.width = rect.width * dpr;
      legoCanvas.height = rect.height * dpr;
      legoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderLegoGrid();
    }
    window.addEventListener('resize', resizeLegoCanvas);

    // MOUSE & TOUCH LISTENERS
    legoCanvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      legoCanvas.style.cursor = 'grabbing';
      initAudio();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        legoCanvas.style.cursor = 'grab';
      }
    });

    legoCanvas.addEventListener('mousemove', (e) => {
      const rect = legoCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        rotAngle += dx * 0.006;
        tiltY = Math.max(-60, Math.min(60, tiltY + dy * 0.4));
        startX = e.clientX;
        startY = e.clientY;
        renderLegoGrid();
      } else {
        detectHover(mouseX, mouseY);
      }
    });

    legoCanvas.addEventListener('click', (e) => {
      const rect = legoCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      detectHover(mouseX, mouseY);

      if (hoveredBlock) {
        playPop(520 + hoveredBlock.index * 12);
        bounceBlock = { ...hoveredBlock };
        animateBounce();
      }
    });

    legoCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initAudio();
      }
    }, { passive: true });

    legoCanvas.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        rotAngle += dx * 0.007;
        tiltY = Math.max(-60, Math.min(60, tiltY + dy * 0.4));
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        renderLegoGrid();
      }
    }, { passive: true });

    legoCanvas.addEventListener('touchend', () => {
      isDragging = false;
    });

    function animateBounce() {
      let step = 0;
      const interval = setInterval(() => {
        step++;
        bounceOffset = Math.sin(step * 0.4) * 12;
        renderLegoGrid();
        if (step > 8) {
          clearInterval(interval);
          bounceOffset = 0;
          bounceBlock = null;
          renderLegoGrid();
        }
      }, 25);
    }

    // MODE SELECTOR
    function setMultViewMode(mode) {
      initAudio();
      playPop(520);
      multViewMode = mode;
      document.getElementById('btnModeGroups').classList.toggle('active', mode === 'groups');
      document.getElementById('btnModeTower').classList.toggle('active', mode === 'tower');
      document.getElementById('btnModeGrid').classList.toggle('active', mode === 'grid');
      stopMultiplicationAnimation();
      updateMultiplicationUI();
    }

    // STACK ANIMATION (YIĞILMA / CANLANDIRMA)
    function animateMultiplicationStack() {
      initAudio();
      if (isStackAnimating) {
        stopMultiplicationAnimation();
        return;
      }

      isStackAnimating = true;
      animVisibleGroups = 0;
      playMagicWhoosh();

      const totalGroups = factorA;
      let currentGroup = 0;

      document.getElementById('btnAnimStack').innerHTML = '<span>⏸️</span> Durdur';

      stackAnimInterval = setInterval(() => {
        currentGroup++;
        animVisibleGroups = currentGroup;
        playPop(350 + currentGroup * 35);
        renderLegoGrid();
        updateRepeatedAdditionStrip(currentGroup);

        if (currentGroup >= totalGroups) {
          stopMultiplicationAnimation(false);
          triggerConfetti();
          playSuccessChime();
        }
      }, 550);
    }

    function stopMultiplicationAnimation(resetToFull = true) {
      isStackAnimating = false;
      if (stackAnimInterval) {
        clearInterval(stackAnimInterval);
        stackAnimInterval = null;
      }
      const btn = document.getElementById('btnAnimStack');
      if (btn) btn.innerHTML = '<span>🎬</span> Kat Kat Yığ / Canlandır!';
      if (resetToFull) {
        animVisibleGroups = null;
        renderLegoGrid();
        updateRepeatedAdditionStrip(factorA);
      }
    }

    function changeFactorA(delta) {
      initAudio();
      factorA = Math.max(1, Math.min(12, factorA + delta));
      document.getElementById('factorABox').textContent = factorA;
      playPop(350 + factorA * 25);
      stopMultiplicationAnimation();
      updateMultiplicationUI();
    }

    function changeFactorB(delta) {
      initAudio();
      factorB = Math.max(1, Math.min(12, factorB + delta));
      document.getElementById('factorBBox').textContent = factorB;
      playPop(400 + factorB * 25);
      stopMultiplicationAnimation();
      updateMultiplicationUI();
    }

    function toggleSplitStrategy() {
      initAudio();
      isSplitActive = !isSplitActive;
      playMagicWhoosh();
      document.getElementById('splitBtn').textContent = isSplitActive ? '🔄 Birleştir' : '🪄 Sihirli Parçala';
      document.getElementById('splitCard').classList.toggle('show', isSplitActive);
      renderLegoGrid();
    }

    function updateRepeatedAdditionStrip(activeCount) {
      const strip = document.getElementById('repeatedAdditionStrip');
      if (!strip) return;

      let html = `<span style="font-size:14px;color:var(--text-muted);font-weight:700;margin-right:6px;">Tekrarlı Toplama:</span>`;
      for (let i = 1; i <= factorA; i++) {
        const isLanded = i <= activeCount;
        html += `<div class="repeat-badge ${isLanded ? 'active-landed' : ''}">${factorB}</div>`;
        if (i < factorA) {
          html += `<span class="repeat-plus">+</span>`;
        }
      }
      const currentSum = Math.min(activeCount, factorA) * factorB;
      html += `<span class="repeat-plus">=</span>`;
      html += `<span class="repeat-total">${isMultResultRevealed ? currentSum : '?'} 🎯</span>`;

      strip.innerHTML = html;
    }

    let isMultResultRevealed = false;

    function toggleMultResultReveal() {
      isMultResultRevealed = !isMultResultRevealed;
      playPop(isMultResultRevealed ? 600 : 420, 'triangle', 0.08);
      updateMultiplicationUI(false);
    }

    function updateMultiplicationUI(resetReveal = true) {
      if (resetReveal) {
        isMultResultRevealed = false;
      }

      const boxA = document.getElementById('factorABox');
      const boxB = document.getElementById('factorBBox');
      if (boxA) boxA.textContent = factorA;
      if (boxB) boxB.textContent = factorB;

      const total = factorA * factorB;
      document.getElementById('totalResult').textContent = isMultResultRevealed ? total : '?';

      if (factorB > 5) {
        splitPoint = 5;
      } else if (factorB > 2) {
        splitPoint = Math.floor(factorB / 2);
      } else {
        splitPoint = 1;
      }

      const part1 = factorA * splitPoint;
      const part2 = factorA * (factorB - splitPoint);

      document.getElementById('strategyPrompt').innerHTML = 
        factorB > 5 
        ? `Bunu daha hızlı çarpmak ister misin? <b>${factorB}'yi ${splitPoint} + ${factorB - splitPoint}</b> olarak parçala!`
        : `Görsel strateji: <b>${factorA} × ${factorB}</b> alanını incele!`;

      const lblA = document.getElementById('splitLabelA');
      if (lblA) {
        lblA.textContent = splitPoint === 5 ? "1. Parça (Kolay 5'li Grup)" : `1. Parça (${splitPoint}'li Grup)`;
      }
      document.getElementById('splitMathA').textContent = `${factorA} × ${splitPoint} = ${part1}`;
      document.getElementById('splitMathB').textContent = `${factorA} × ${factorB - splitPoint} = ${part2}`;
      const lblTotal = document.getElementById('splitMathTotalLabel');
      if (lblTotal) lblTotal.textContent = `Sonuç (${part1} + ${part2})`;
      document.getElementById('splitMathTotal').textContent = isMultResultRevealed ? `${part1 + part2} 🎯` : '? 🎯';

      updateRepeatedAdditionStrip(animVisibleGroups !== null ? animVisibleGroups : factorA);
      renderLegoGrid();

      if (resetReveal) {
        const gIn = document.getElementById('saGuessInput');
        const gFb = document.getElementById('saGuessFeedback');
        if (gIn) gIn.value = '';
        if (gFb) {
          gFb.textContent = '';
          gFb.className = 'sa-guess-feedback';
        }
      }
    }

    function checkMultGuess() {
      const gIn = document.getElementById('saGuessInput');
      const gFb = document.getElementById('saGuessFeedback');
      if (!gIn || !gFb) return;
      const val = parseInt(gIn.value, 10);
      const target = factorA * factorB;
      if (isNaN(val)) {
        gFb.textContent = 'Önce bir tahmin sayısı yaz! ✏️';
        gFb.className = 'sa-guess-feedback warn';
        return;
      }
      if (val === target) {
        isMultResultRevealed = true;
        updateMultiplicationUI(false);
        gFb.textContent = `🎉 Harika tahmin! ${factorA} × ${factorB} = ${target}!`;
        gFb.className = 'sa-guess-feedback ok';
        playSuccessChime();
        spawnConfetti(14);
      } else {
        const diff = Math.abs(val - target);
        const hint = val < target ? 'biraz daha büyük' : 'biraz daha küçük';
        gFb.textContent = diff <= factorB
          ? `Çok yaklaştın! Cevap ${hint}. Blokları sayıp tekrar dene 💡`
          : `Yaklaştın! ${factorA} tane ${factorB}'li blok var, tekrar tahmin et 💪`;
        gFb.className = 'sa-guess-feedback hint';
        playPop(260, 'triangle', 0.1);
      }
    }

    let renderedBlocks = [];

    // Isometric 3D Cube Drawer
    function drawIsoCube(ctx, x, y, size, topColor, leftColor, rightColor, isHighlighted = false, isBouncing = false) {
      const h = size * 0.58;
      const curY = isBouncing ? y - bounceOffset : y;

      ctx.save();
      if (isHighlighted) {
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 18;
      }

      // Top face
      ctx.beginPath();
      ctx.moveTo(x, curY - h);
      ctx.lineTo(x + size, curY - h / 2);
      ctx.lineTo(x, curY);
      ctx.lineTo(x - size, curY - h / 2);
      ctx.closePath();
      ctx.fillStyle = isHighlighted ? '#fef08a' : topColor;
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? '#fff' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();

      // Lego Stud on top
      ctx.beginPath();
      ctx.ellipse(x, curY - h / 2, size * 0.35, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? '#fde047' : 'rgba(255,255,255,0.3)';
      ctx.fill();

      // Left face
      ctx.beginPath();
      ctx.moveTo(x - size, curY - h / 2);
      ctx.lineTo(x, curY);
      ctx.lineTo(x, curY + h);
      ctx.lineTo(x - size, curY + h / 2);
      ctx.closePath();
      ctx.fillStyle = isHighlighted ? '#eab308' : leftColor;
      ctx.fill();
      ctx.stroke();

      // Right face
      ctx.beginPath();
      ctx.moveTo(x, curY);
      ctx.lineTo(x + size, curY - h / 2);
      ctx.lineTo(x + size, curY + h / 2);
      ctx.lineTo(x, curY + h);
      ctx.closePath();
      ctx.fillStyle = isHighlighted ? '#ca8a04' : rightColor;
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function detectHover(mouseX, mouseY) {
      let found = null;
      for (let i = renderedBlocks.length - 1; i >= 0; i--) {
        const b = renderedBlocks[i];
        const dist = Math.hypot(mouseX - b.x, mouseY - b.y);
        if (dist < b.size * 1.1) {
          found = b;
          break;
        }
      }

      if (JSON.stringify(found) !== JSON.stringify(hoveredBlock)) {
        hoveredBlock = found;
        if (hoveredBlock) {
          playPop(480 + hoveredBlock.r * 20);
        }
        renderLegoGrid();
      }
    }

    function renderLegoGrid() {
      const rect = legoCanvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      legoCtx.clearRect(0, 0, width, height);
      renderedBlocks = [];

      const groupsToShow = animVisibleGroups !== null ? animVisibleGroups : factorA;
      if (groupsToShow === 0) return;

      const cosR = Math.cos(rotAngle);
      const sinR = Math.sin(rotAngle);

      let blockCount = 0;

      if (multViewMode === 'groups') {
        // ========================================================
        // 1. YAN YANA AYRI GRUPLAR (Örn: 7 Tane 6'lı Çubuk)
        // ========================================================
        const maxWSize = (width * 0.86) / (Math.max(1, factorA) * 2.75);
        const maxHSize = (height - 130) / (Math.max(1, factorB) * 1.05);
        const blockSize = Math.min(44, Math.max(16, Math.min(maxWSize, maxHSize)));
        const groupSpacing = blockSize * 2.75;
        const totalSpanX = (factorA - 1) * groupSpacing;
        const startX = width / 2 - totalSpanX / 2;
        const startY = height * 0.44 + tiltY;

        for (let g = 0; g < groupsToShow; g++) {
          const pal = groupPalettes[g % groupPalettes.length];
          const groupBaseX = startX + g * groupSpacing;

          for (let b = 0; b < factorB; b++) {
            blockCount++;
            // Lined up vertically along isometric axis
            const isoX = groupBaseX + (b - factorB / 2) * (blockSize * 0.6 * sinR);
            const isoY = startY + (b - factorB / 2) * (blockSize * 0.95);

            const isHovered = hoveredBlock && hoveredBlock.r === g && hoveredBlock.c === b;
            const isBouncing = bounceBlock && bounceBlock.r === g && bounceBlock.c === b;

            renderedBlocks.push({
              r: g,
              c: b,
              index: blockCount,
              x: isoX,
              y: isoY,
              size: blockSize
            });

            drawIsoCube(legoCtx, isoX, isoY, blockSize, pal.top, pal.left, pal.right, isHovered, isBouncing);
          }

          // Draw group label badge below each group
          legoCtx.save();
          legoCtx.font = 'bold 13px Fredoka, sans-serif';
          legoCtx.fillStyle = pal.left;
          legoCtx.textAlign = 'center';
          const labelY = startY + (factorB / 2) * (blockSize * 0.95) + 28;
          legoCtx.fillText(`${g + 1}. Grup`, groupBaseX, labelY);
          legoCtx.fillStyle = '#31105e';
          legoCtx.fillText(`(+${factorB} = ${(g + 1) * factorB})`, groupBaseX, labelY + 16);
          legoCtx.restore();
        }

      } else if (multViewMode === 'tower') {
        // ========================================================
        // 2. ÜST ÜSTE YIĞILAN KULE (Kat Kat 7 Katlı 6'lı Kule)
        // ========================================================
        const blockSize = Math.min(42, Math.max(18, Math.min((width * 0.62) / factorB, (height - 110) / (factorA * 1.05))));
        const centerX = width / 2;
        const baseGroundY = height * 0.7 + tiltY;
        const floorHeight = blockSize * 0.95;

        // Draw from bottom floor to top
        for (let f = 0; f < groupsToShow; f++) {
          const pal = groupPalettes[f % groupPalettes.length];
          const floorY = baseGroundY - (f * floorHeight);

          for (let b = 0; b < factorB; b++) {
            blockCount++;
            // Arrange blocks of this floor in an isometric horizontal slice
            const stepX = (b - factorB / 2) * (blockSize * 1.15 * cosR);
            const stepY = (b - factorB / 2) * (blockSize * 0.55 * sinR);

            const isoX = centerX + stepX;
            const isoY = floorY + stepY;

            const isHovered = hoveredBlock && hoveredBlock.r === f && hoveredBlock.c === b;
            const isBouncing = bounceBlock && bounceBlock.r === f && bounceBlock.c === b;

            renderedBlocks.push({
              r: f,
              c: b,
              index: blockCount,
              x: isoX,
              y: isoY,
              size: blockSize
            });

            drawIsoCube(legoCtx, isoX, isoY, blockSize, pal.top, pal.left, pal.right, isHovered, isBouncing);
          }

          // Layer floor tag on the right
          legoCtx.save();
          legoCtx.font = 'bold 13px Fredoka, sans-serif';
          legoCtx.fillStyle = pal.left;
          legoCtx.textAlign = 'left';
          const tagX = centerX + (factorB / 2) * blockSize + 28;
          legoCtx.fillText(`${f + 1}. Kat: ${(f + 1) * factorB} blok`, tagX, floorY + 4);
          legoCtx.restore();
        }

      } else {
        // ========================================================
        // 3. KLASİK ALAN / IZGARA MODELİ
        // ========================================================
        const maxDim = Math.max(factorA, factorB);
        const blockSize = Math.min(42, Math.max(18, (Math.min(width, height) * 0.66) / maxDim));
        const centerX = width / 2;
        const startY = height * 0.28 + tiltY;

        const baseStepX1 = blockSize * 1.05;
        const baseStepY1 = blockSize * 0.55;
        const baseStepX2 = -blockSize * 1.05;
        const baseStepY2 = blockSize * 0.55;

        for (let r = 0; r < groupsToShow; r++) {
          for (let c = 0; c < factorB; c++) {
            blockCount++;

            const gridCol = c - factorB / 2;
            const gridRow = r - factorA / 2;

            const rotCol = gridCol * cosR - gridRow * sinR;
            const rotRow = gridCol * sinR + gridRow * cosR;

            let isoX = centerX + rotCol * baseStepX1 + rotRow * baseStepX2;
            let isoY = startY + (c * baseStepY1) + (r * baseStepY2);

            let isPart1 = c < splitPoint;
            let topCol, leftCol, rightCol;

            if (!isSplitActive) {
              const pal = groupPalettes[r % groupPalettes.length];
              topCol = pal.top;
              leftCol = pal.left;
              rightCol = pal.right;
            } else {
              if (isPart1) {
                topCol = '#34d399';
                leftCol = '#059669';
                rightCol = '#047857';
                isoX -= 16 * cosR;
              } else {
                topCol = '#c084fc';
                leftCol = '#9333ea';
                rightCol = '#7e22ce';
                isoX += 16 * cosR;
              }
            }

            const isHovered = hoveredBlock && hoveredBlock.r === r && hoveredBlock.c === c;
            const isBouncing = bounceBlock && bounceBlock.r === r && bounceBlock.c === c;

            renderedBlocks.push({
              r,
              c,
              index: blockCount,
              x: isoX,
              y: isoY,
              size: blockSize,
              isPart1
            });

            drawIsoCube(legoCtx, isoX, isoY, blockSize, topCol, leftCol, rightCol, isHovered, isBouncing);
          }
        }
      }

      // Live HUD Info
      legoCtx.save();
      legoCtx.font = 'bold 15px Fredoka, sans-serif';
      legoCtx.fillStyle = '#31105e';
      legoCtx.textAlign = 'left';
      const modeLabel = multViewMode === 'groups' ? 'Yan Yana Gruplar' : (multViewMode === 'tower' ? 'Kat Kat Kule' : 'Izgara Alanı');
      legoCtx.fillText(`⚡ ${factorA} Tane ${factorB}'li Blok = ${factorA * factorB} (${modeLabel})`, 20, 30);

      // Hover Tooltip Display
      if (hoveredBlock) {
        const text = `🔍 Grup / Kat: ${hoveredBlock.r + 1}, Blok: ${hoveredBlock.c + 1} (Toplamın ${hoveredBlock.index}. Bloğu)`;
        const textWidth = legoCtx.measureText(text).width;
        
        legoCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        legoCtx.strokeStyle = '#fbbf24';
        legoCtx.lineWidth = 1.5;
        legoCtx.beginPath();
        legoCtx.roundRect(width / 2 - (textWidth + 24) / 2, 16, textWidth + 24, 32, 8);
        legoCtx.fill();
        legoCtx.stroke();

        legoCtx.fillStyle = '#fbbf24';
        legoCtx.fillText(text, width / 2 - textWidth / 2, 37);
      }
      legoCtx.restore();
    }

    /* =======================================================
       2. DIVISION & CHESTS SIMULATION
       ======================================================= */
    let dividend = 24;
    let divisor = 4;
    let divMode = 'chests'; // 'chests' | 'grid'
    let divAnimVisibleGroups = null;
    let isDivAnimating = false;
    let divAnimInterval = null;

    const divGridCanvas = document.getElementById('divGridCanvas');
    let divGridCtx = null;
    if (divGridCanvas) {
      divGridCtx = divGridCanvas.getContext('2d');
    }

    function resizeDivGridCanvas() {
      const rect = divGridCanvas.parentElement.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      divGridCanvas.width = rect.width * dpr;
      divGridCanvas.height = rect.height * dpr;
      divGridCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderDivisionGrid();
    }
    window.addEventListener('resize', resizeDivGridCanvas);

    function setDivMode(mode) {
      initAudio();
      playPop(500);
      divMode = mode;
      document.getElementById('btnDivChests').classList.toggle('active', mode === 'chests');
      document.getElementById('btnDivGrid').classList.toggle('active', mode === 'grid');

      document.getElementById('chestsStage').style.display = (mode === 'chests' ? 'flex' : 'none');
      document.getElementById('divGridStage').style.display = (mode === 'grid' ? 'flex' : 'none');

      document.getElementById('divActionLabel').textContent = (mode === 'chests' ? 'Eşit Paylaştır!' : 'Küp Izgarasını Canlandır!');

      stopDivGridAnimation();

      if (mode === 'grid') {
        resizeDivGridCanvas();
        renderDivisionGrid();
      } else {
        renderChests();
      }
    }

    function runDivisionAction() {
      if (divMode === 'chests') {
        distributeGems();
      } else {
        animateDivisionGrid();
      }
    }

    function setDividendDirect(val) {
      initAudio();
      dividend = Math.max(2, Math.min(100, val));
      document.getElementById('dividendBox').textContent = dividend;
      playPop(480);
      stopDivGridAnimation();
      if (divMode === 'grid') {
        renderDivisionGrid();
      } else {
        renderChests();
      }
    }

    function changeDividend(delta) {
      initAudio();
      dividend = Math.max(2, Math.min(100, dividend + delta));
      document.getElementById('dividendBox').textContent = dividend;
      playPop(300 + Math.min(600, dividend * 6));
      stopDivGridAnimation();
      if (divMode === 'grid') {
        renderDivisionGrid();
      } else {
        renderChests();
      }
    }

    function changeDivisor(delta) {
      initAudio();
      divisor = Math.max(1, Math.min(10, divisor + delta));
      document.getElementById('divisorBox').textContent = divisor;
      playPop(450 + divisor * 25);
      stopDivGridAnimation();
      if (divMode === 'grid') {
        renderDivisionGrid();
      } else {
        renderChests();
      }
    }

    // ========================================================
    // COLORFUL DIVISION CUBE GRID (HER GRUP AYRI RENK)
    // ========================================================
    function updateDivRepeatedStrip(activeCount) {
      const strip = document.getElementById('divRepeatedStrip');
      if (!strip) return;

      const fullGroups = Math.floor(dividend / divisor);
      const remainder = dividend % divisor;

      let html = `<span style="font-size:14px;color:var(--text-muted);font-weight:700;margin-right:6px;">Renk Grupları:</span>`;
      for (let i = 1; i <= fullGroups; i++) {
        const isLanded = i <= activeCount;
        html += `<div class="repeat-badge ${isLanded ? 'active-landed' : ''}">${divisor}</div>`;
        if (i < fullGroups) {
          html += `<span class="repeat-plus">+</span>`;
        }
      }

      if (remainder > 0 && activeCount >= fullGroups) {
        html += `<span class="repeat-plus">+</span>`;
        html += `<div class="repeat-badge" style="background:#ef4444;color:#fff;border-color:#ef4444;">${remainder} (Kalan)</div>`;
      }

      html += `<span class="repeat-plus">=</span>`;
      html += `<span class="repeat-total">${dividend} 🎯</span>`;

      strip.innerHTML = html;
    }

    function renderDivisionGrid() {
      if (!divGridCanvas || !divGridCtx) return;

      const dBox = document.getElementById('dividendBox');
      if (dBox) dBox.textContent = dividend;
      const divBox = document.getElementById('divisorBox');
      if (divBox) divBox.textContent = divisor;

      const rect = divGridCanvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      divGridCtx.clearRect(0, 0, width, height);

      const fullGroups = Math.floor(dividend / divisor);
      const remainder = dividend % divisor;
      const totalVisualRows = fullGroups + (remainder > 0 ? 1 : 0);

      const groupsToShow = divAnimVisibleGroups !== null ? divAnimVisibleGroups : fullGroups;
      updateDivRepeatedStrip(groupsToShow);

      if (totalVisualRows === 0) return;

      // Adaptive block sizing to fit canvas
      const maxDim = Math.max(divisor, totalVisualRows);
      const blockSize = Math.min(38, Math.max(14, (Math.min(width, height) * 0.62) / maxDim));

      const cosR = Math.cos(0.2);
      const sinR = Math.sin(0.2);

      const baseStepX1 = blockSize * 1.05;
      const baseStepY1 = blockSize * 0.55;
      const baseStepX2 = -blockSize * 1.05;
      const baseStepY2 = blockSize * 0.55;

      const centerX = width / 2;
      const startY = height * 0.22;

      let globalCubeCount = 0;

      // 1. Draw Each Full Division Group (Distinct Vibrant Color!)
      for (let g = 0; g < fullGroups; g++) {
        if (g >= groupsToShow) continue;

        const pal = groupPalettes[g % groupPalettes.length];

        for (let b = 0; b < divisor; b++) {
          globalCubeCount++;

          const gridCol = b - divisor / 2;
          const gridRow = g - totalVisualRows / 2;

          const rotCol = gridCol * cosR - gridRow * sinR;
          const rotRow = gridCol * sinR + gridRow * cosR;

          const isoX = centerX + rotCol * baseStepX1 + rotRow * baseStepX2;
          const isoY = startY + (b * baseStepY1) + (g * (baseStepY2 + blockSize * 0.35));

          drawIsoCube(divGridCtx, isoX, isoY, blockSize, pal.top, pal.left, pal.right, false, false);
        }

        // Draw Group label next to row
        divGridCtx.save();
        divGridCtx.font = 'bold 12px Fredoka, sans-serif';
        divGridCtx.fillStyle = pal.top;
        divGridCtx.textAlign = 'left';
        const labelX = centerX + (divisor / 2) * blockSize * 1.2 + 25;
        const labelY = startY + (g * (baseStepY2 + blockSize * 0.35)) + 10;
        divGridCtx.fillText(`${g + 1}. Renk Grubu (${divisor}'erli) ➜ Toplam ${(g + 1) * divisor}`, labelX, labelY);
        divGridCtx.restore();
      }

      // 2. Draw Remainder Group (Red Color Alert)
      if (remainder > 0 && groupsToShow >= fullGroups) {
        const g = fullGroups;
        for (let b = 0; b < remainder; b++) {
          globalCubeCount++;

          const gridCol = b - divisor / 2;
          const gridRow = g - totalVisualRows / 2;

          const rotCol = gridCol * cosR - gridRow * sinR;
          const rotRow = gridCol * sinR + gridRow * cosR;

          const isoX = centerX + rotCol * baseStepX1 + rotRow * baseStepX2;
          const isoY = startY + (b * baseStepY1) + (g * (baseStepY2 + blockSize * 0.35));

          drawIsoCube(divGridCtx, isoX, isoY, blockSize, '#ef4444', '#dc2626', '#b91c1c', true, false);
        }

        divGridCtx.save();
        divGridCtx.font = 'bold 12px Fredoka, sans-serif';
        divGridCtx.fillStyle = '#f87171';
        divGridCtx.textAlign = 'left';
        const labelX = centerX + (divisor / 2) * blockSize * 1.2 + 25;
        const labelY = startY + (g * (baseStepY2 + blockSize * 0.35)) + 10;
        divGridCtx.fillText(`⚠️ Kalan: ${remainder} Küp (${divisor}'e tamamlanamadı)`, labelX, labelY);
        divGridCtx.restore();
      }

      // Top Legend & Conclusion Banner
      divGridCtx.save();
      divGridCtx.font = 'bold 15px Fredoka, sans-serif';
      divGridCtx.fillStyle = '#31105e';
      divGridCtx.textAlign = 'left';
      divGridCtx.fillText(
        `🎯 ${dividend} Küp ÷ ${divisor}'erli Gruplar = ${fullGroups} Farklı Renk Grubu ${remainder > 0 ? '(Kalan: ' + remainder + ')' : '(Kalan: 0)'}`,
        20, 30
      );
      divGridCtx.restore();
    }

    function animateDivisionGrid() {
      initAudio();
      stopDivGridAnimation();
      isDivAnimating = true;
      playMagicWhoosh();

      const fullGroups = Math.floor(dividend / divisor);
      const remainder = dividend % divisor;
      const totalSteps = fullGroups + (remainder > 0 ? 1 : 0);

      divAnimVisibleGroups = 0;
      let currentStep = 0;

      document.getElementById('divActionLabel').textContent = 'Durdur';

      divAnimInterval = setInterval(() => {
        currentStep++;
        divAnimVisibleGroups = currentStep;
        playPop(360 + currentStep * 30);
        renderDivisionGrid();

        if (currentStep >= totalSteps) {
          stopDivGridAnimation(false);
          triggerConfetti();
          playSuccessChime();
        }
      }, 550);
    }

    function stopDivGridAnimation(resetToFull = true) {
      isDivAnimating = false;
      if (divAnimInterval) {
        clearInterval(divAnimInterval);
        divAnimInterval = null;
      }
      const label = document.getElementById('divActionLabel');
      if (label) {
        label.textContent = (divMode === 'chests' ? 'Eşit Paylaştır!' : 'Küp Izgarasını Canlandır!');
      }
      if (resetToFull) {
        divAnimVisibleGroups = null;
        renderDivisionGrid();
      }
    }

    function renderChests() {
      const dBox = document.getElementById('dividendBox');
      if (dBox) dBox.textContent = dividend;
      const divBox = document.getElementById('divisorBox');
      if (divBox) divBox.textContent = divisor;

      const chestsGrid = document.getElementById('chestsGrid');
      chestsGrid.innerHTML = '';
      
      const gemSourceArea = document.getElementById('gemSourceArea');
      let html = `
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="gem-badge" id="gemSourceBadge">🪙 Hazine Havuzu (${dividend} Elmas)</span>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Paylaştırılmayı bekliyor</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; width: 100%;">`;
      
      for (let i = 0; i < dividend; i++) {
        html += `<div class="coin-gem"></div>`;
      }
      html += `</div>`;
      gemSourceArea.innerHTML = html;

      // Create empty chests
      for (let i = 1; i <= divisor; i++) {
        const card = document.createElement('div');
        card.className = 'chest-card';
        card.id = `chest-${i}`;
        card.innerHTML = `
          <div class="chest-icon">📦</div>
          <div class="chest-gems-container" id="chest-gems-${i}"></div>
          <div class="chest-count-badge" id="chest-badge-${i}">Sandık ${i}: 0</div>
        `;
        chestsGrid.appendChild(card);
      }

      document.getElementById('remainderBox').classList.remove('show');
    }

    function distributeGems() {
      initAudio();
      playMagicWhoosh();

      const perChest = Math.floor(dividend / divisor);
      const remainder = dividend % divisor;

      // Clear source area
      const gemSourceArea = document.getElementById('gemSourceArea');
      gemSourceArea.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px;">
          <span class="gem-badge" style="background: #38bdf8; color: #0f172a;">⚡ Elmaslar sandıklara dağıtılıyor...</span>
        </div>`;

      // Animate filling chests
      for (let i = 1; i <= divisor; i++) {
        const chestCard = document.getElementById(`chest-${i}`);
        const gemsCont = document.getElementById(`chest-gems-${i}`);
        const badge = document.getElementById(`chest-badge-${i}`);
        
        gemsCont.innerHTML = '';
        chestCard.classList.remove('glow');

        setTimeout(() => {
          chestCard.classList.add('glow');
          playPop(400 + i * 50);

          for (let g = 0; g < perChest; g++) {
            const coin = document.createElement('div');
            coin.className = 'coin-gem';
            gemsCont.appendChild(coin);
          }
          badge.textContent = `${perChest} Elmas 💎`;
        }, i * 140);
      }

      // Handle Remainder
      setTimeout(() => {
        const remainderBox = document.getElementById('remainderBox');
        if (remainder > 0) {
          remainderBox.classList.remove('show');
          let remHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 8px; text-align: center; width: 100%;">
              <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; padding: 6px 18px; border-radius: 20px; font-family: var(--font-display); font-size: 15px; color: #f87171; font-weight: 700;">
                ⚠️ Kalan: ${remainder} Elmas (Eşit Bölünemedi)
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 4px;">`;
          for (let r = 0; r < remainder; r++) {
            remHtml += `<div class="coin-gem" style="transform: scale(1.2);"></div>`;
          }
          remHtml += `</div>
              <div style="font-size: 13px; color: #fca5a5; font-weight: 600;">
                Her sandığa ${perChest} elmas düştü, artan bu ${remainder} elmas sandıklara eşit bölünemediği için havuzda kaldı.
              </div>
            </div>`;
          gemSourceArea.innerHTML = remHtml;
        } else {
          remainderBox.classList.remove('show');
          gemSourceArea.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 10px; text-align: center;">
              <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; padding: 8px 20px; border-radius: 20px; font-family: var(--font-display); font-size: 16px; color: #34d399; font-weight: 700;">
                🎉 Harika! Tam Bölündü! (Kalan: 0)
              </div>
              <div style="font-size: 14px; color: #94a3b8; font-weight: 600;">
                Tüm ${dividend} elmas, ${divisor} sandığa eşit şekilde ${perChest}'şar olarak paylaştırıldı. Havuzda hiç artan kalmadı!
              </div>
            </div>`;
          triggerConfetti();
          playSuccessChime();
        }
      }, divisor * 140 + 200);
    }

    /* =======================================================
       3. SPEED & FLUENCY QUIZ ENGINE (+ ZORLANDIKLARIM)
       ======================================================= */
    const MISTAKES_KEY = 'sa_mistakes_v1';
    let currentQuizLevel = 'easy';
    let currentQuestion = null;
    let streak = 0;
    let score = 0;
    let totalAttempts = 0;
    let correctAttempts = 0;

    function loadMistakes() {
      try {
        return JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      } catch (e) { return []; }
    }

    function saveMistakes(list) {
      try { localStorage.setItem(MISTAKES_KEY, JSON.stringify(list)); } catch (e) {}
      updateMistakesBadge();
    }

    function updateMistakesBadge() {
      const btn = document.getElementById('saMistakesLevelBtn');
      if (!btn) return;
      const list = loadMistakes();
      btn.textContent = `📌 Zorlandıklarım (${list.length})`;
    }

    function recordMistake(q) {
      if (!q) return;
      const list = loadMistakes();
      const idx = list.findIndex(m => m.a === q.a && m.b === q.b && m.isDiv === q.isDiv);
      if (idx >= 0) {
        list[idx].hits = 0;
      } else {
        list.push({ a: q.a, b: q.b, isDiv: q.isDiv, correctAns: q.correctAns, hintText: q.hintText, hits: 0 });
      }
      saveMistakes(list);
    }

    function markMistakeHit(q) {
      if (!q) return;
      const list = loadMistakes();
      const idx = list.findIndex(m => m.a === q.a && m.b === q.b && m.isDiv === q.isDiv);
      if (idx >= 0) {
        list[idx].hits = (list[idx].hits || 0) + 1;
        if (list[idx].hits >= 2) {
          list.splice(idx, 1);
        }
        saveMistakes(list);
      }
    }

    function setQuizLevel(lvl) {
      initAudio();
      currentQuizLevel = lvl;
      document.querySelectorAll('#viewSayiAvcilari .level-pill').forEach(p => p.classList.remove('active'));
      if (typeof event !== 'undefined' && event && event.target) {
        event.target.classList.add('active');
      }
      playPop(500);
      generateQuizQuestion();
    }

    function generateQuizQuestion() {
      document.getElementById('quizHintBubble').classList.remove('show');
      updateMistakesBadge();

      let a, b, isDiv = false;

      if (currentQuizLevel === 'mistakes') {
        const list = loadMistakes();
        if (list.length > 0) {
          const picked = list[Math.floor(Math.random() * list.length)];
          a = picked.a; b = picked.b; isDiv = picked.isDiv;
        } else {
          currentQuizLevel = 'easy';
          const easyBtn = document.querySelector('#viewSayiAvcilari .level-pill');
          document.querySelectorAll('#viewSayiAvcilari .level-pill').forEach(p => p.classList.remove('active'));
          if (easyBtn) easyBtn.classList.add('active');
        }
      }

      if (currentQuizLevel === 'easy') {
        const bases = [2, 5, 10];
        a = bases[Math.floor(Math.random() * bases.length)];
        b = Math.floor(Math.random() * 9) + 2;
      } else if (currentQuizLevel === 'doubles') {
        const val = Math.floor(Math.random() * 6) + 4; // 4 to 9
        a = val;
        b = val;
      } else if (currentQuizLevel === 'hard') {
        const hards = [6, 7, 8, 9];
        a = hards[Math.floor(Math.random() * hards.length)];
        b = Math.floor(Math.random() * 5) + 5; // 5 to 9
      } else if (currentQuizLevel === 'div') {
        isDiv = true;
        const divisors = [3, 4, 5, 6, 7, 8, 9];
        b = divisors[Math.floor(Math.random() * divisors.length)];
        const ans = Math.floor(Math.random() * 7) + 3;
        a = b * ans; // Ensure clean division
      }

      let correctAns, questionText, hintText;

      if (!isDiv) {
        correctAns = a * b;
        questionText = `${a} × ${b} = ?`;

        if (b > 5) {
          hintText = `💡 <b>Hızlı Taktik:</b> ${b}'yi 5 + ${b - 5} diye ayır! (${a}×5 = ${a*5}) + (${a}×${b-5} = ${a*(b-5)}). Topla: <b>${correctAns}</b>`;
        } else if (a === b) {
          hintText = `💡 <b>İkiz Sayı Taktiği:</b> ${a} kere ${b} tam bir karedir: <b>${correctAns}</b>!`;
        } else {
          hintText = `💡 <b>Taktik:</b> ${a}'yı ${b} defa topla veya 10 ile çarpıp yarısını al!`;
        }
      } else {
        correctAns = a / b;
        questionText = `${a} ÷ ${b} = ?`;
        hintText = `💡 <b>Ters Düşün:</b> ${b} ile neyi çarparsan ${a} yapar? (Cevap: <b>${correctAns}</b>)`;
      }

      currentQuestion = { a, b, isDiv, correctAns, hintText };

      document.getElementById('quizQuestion').textContent = questionText;
      document.getElementById('quizHintBubble').innerHTML = hintText;

      // Generate 4 distinct options
      let options = [correctAns];
      while (options.length < 4) {
        let fake = correctAns + (Math.floor(Math.random() * 7) - 3) * (isDiv ? 1 : (Math.random() > 0.5 ? a : b));
        if (fake <= 0) fake = correctAns + Math.floor(Math.random() * 5) + 1;
        if (!options.includes(fake)) {
          options.push(fake);
        }
      }

      // Shuffle
      options.sort(() => Math.random() - 0.5);

      const optionsGrid = document.getElementById('quizOptions');
      optionsGrid.innerHTML = '';
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => handleQuizAnswer(opt, btn);
        optionsGrid.appendChild(btn);
      });
    }

    function toggleQuizHint() {
      initAudio();
      playPop(600);
      document.getElementById('quizHintBubble').classList.toggle('show');
    }

    function handleQuizAnswer(selectedVal, btnElem) {
      initAudio();
      totalAttempts++;

      if (selectedVal === currentQuestion.correctAns) {
        // CORRECT
        btnElem.classList.add('correct');
        playSuccessChime();
        streak++;
        score += 10 + streak * 2;
        correctAttempts++;
        markMistakeHit(currentQuestion);

        if (streak % 3 === 0) {
          triggerConfetti();
        }

        setTimeout(() => {
          generateQuizQuestion();
        }, 600);
      } else {
        // WRONG
        btnElem.classList.add('wrong');
        playWrongSound();
        streak = 0;
        recordMistake(currentQuestion);
        document.getElementById('quizHintBubble').classList.add('show');
      }

      // Update stats
      document.getElementById('saStatStreak').textContent = `${streak} 🔥`;
      document.getElementById('statScore').textContent = `${score} ⭐`;
      const acc = Math.round((correctAttempts / totalAttempts) * 100);
      document.getElementById('statAccuracy').textContent = `${acc}%`;
    }

    /* =======================================================
       4. STEP-BY-STEP LONG DIVISION ENGINE (4 BASAMAKLI UZUN BÖLME)
       ======================================================= */
    let stepDivDividend = 4872;
    let stepDivDivisor = 12;
    let stepDivisionSteps = [];
    let currentDivStepIndex = 0;
    let stepAutoTimer = null;
    let isStepAutoPlaying = false;
    let stepPracticeMode = false;

    function toggleStepPracticeMode(enabled) {
      initAudio();
      playPop(540);
      stepPracticeMode = enabled;
      stepDivStopAuto();
      const watchBtn = document.getElementById('btnStepModeWatch');
      const solveBtn = document.getElementById('btnStepModeSolve');
      if (watchBtn) watchBtn.classList.toggle('active', !enabled);
      if (solveBtn) solveBtn.classList.toggle('active', enabled);
      renderCurrentDivStep();
    }

    function submitStepDigit(digit) {
      const step = stepDivisionSteps[currentDivStepIndex];
      if (!step || !step.quotientActive) return;
      const expected = step.quotient.slice(-1);
      const fb = document.getElementById('stepPracticeFeedback');
      if (String(digit) === expected) {
        playSuccessChime();
        if (fb) {
          fb.textContent = `🎉 Harika! Bölüm rakamı ${expected} doğru!`;
          fb.className = 'sa-practice-fb success';
        }
        setTimeout(() => {
          if (currentDivStepIndex < stepDivisionSteps.length - 1) {
            currentDivStepIndex++;
            renderCurrentDivStep();
          }
        }, 650);
      } else {
        playWrongSound();
        if (fb) {
          fb.textContent = `💡 Tekrar dene: ${stepDivDivisor} ile ${digit}'i çarpınca uygun oluyor mu?`;
          fb.className = 'sa-practice-fb warn';
        }
      }
    }

    function initStepDivision() {
      loadCustomStepDivision();
    }

    function loadStepExample(dividend, divisor) {
      initAudio();
      playPop(550);
      document.getElementById('stepDividendInput').value = dividend;
      document.getElementById('stepDivisorInput').value = divisor;
      loadCustomStepDivision();
    }

    function loadCustomStepDivision() {
      initAudio();
      stepDivStopAuto();

      const dividendVal = parseInt(document.getElementById('stepDividendInput').value, 10);
      const divisorVal = parseInt(document.getElementById('stepDivisorInput').value, 10);

      if (isNaN(dividendVal) || isNaN(divisorVal) || dividendVal < 100 || divisorVal < 1) {
        alert("Lütfen geçerli bir 4 veya 3 basamaklı sayı ve bölen giriniz.");
        return;
      }

      stepDivDividend = dividendVal;
      stepDivDivisor = divisorVal;
      stepDivisionSteps = buildDivisionSteps(stepDivDividend, stepDivDivisor);
      currentDivStepIndex = 0;
      renderCurrentDivStep();
    }

    function buildDivisionSteps(dividend, divisor) {
      const divStr = String(dividend);
      const digits = divStr.split('');
      const steps = [];

      let quotient = "";
      let subHistory = [];

      // 1. Determine starting prefix
      let ptr = 0;
      let curValStr = digits[ptr];

      if (Number(curValStr) < divisor && digits.length > 1) {
        steps.push({
          activeDividendCols: [0],
          quotient,
          subHistory: JSON.parse(JSON.stringify(subHistory)),
          title: "Adım 1: En Büyük Basamağa Bak",
          body: `En büyük basamaktaki <b style="color:#38bdf8;font-size:20px;">${curValStr}</b> rakamına bakıyoruz.<br><b>${curValStr}</b>'in içinde ${divisor} var mı? <b>YOK!</b> Çünkü ${curValStr}, ${divisor}'den küçüktür.`,
          type: "normal",
          avatar: "🦉"
        });

        ptr++;
        curValStr += digits[ptr];
        steps.push({
          activeDividendCols: [0, 1],
          quotient,
          subHistory: JSON.parse(JSON.stringify(subHistory)),
          title: "Adım 2: Yanındaki Basamağı Kat",
          body: `Tek basamak yetmediği için yanındaki rakamı da dahil ediyoruz.<br>Sayımız <b style="color:#38bdf8;font-size:22px;">${curValStr}</b> oldu.<br>Şimdi soruyoruz: <b>${curValStr}</b>'in içinde <b>${divisor}</b> kaç defa var?`,
          type: "normal",
          avatar: "🔍"
        });
      } else {
        steps.push({
          activeDividendCols: [0],
          quotient,
          subHistory: JSON.parse(JSON.stringify(subHistory)),
          title: "Adım 1: İlk Basamağa Bak",
          body: `En büyük basamaktaki <b style="color:#38bdf8;font-size:20px;">${curValStr}</b> rakamına bakıyoruz.<br><b>${curValStr}</b>'in içinde <b>${divisor}</b> var mı? <b>Evet!</b> Kaç defa var?`,
          type: "normal",
          avatar: "🔍"
        });
      }

      // First quotient digit calculation
      let curNum = Number(curValStr);
      let qDigit = Math.floor(curNum / divisor);
      let product = qDigit * divisor;
      let remainder = curNum - product;

      quotient += String(qDigit);
      const activeCols = [];
      for (let i = 0; i < curValStr.length; i++) activeCols.push(i);

      steps.push({
        activeDividendCols: activeCols,
        quotient,
        subHistory: JSON.parse(JSON.stringify(subHistory)),
        title: `Bölüme ${qDigit} Ekliyoruz`,
        body: `<b>${curValStr}</b> içinde <b>${divisor}</b> tam <b style="color:#fbbf24;font-size:22px;">${qDigit} defa</b> var!<br>Bölüm çizgisine altın sarısı <b>${qDigit}</b> yazıyoruz.`,
        type: "normal",
        avatar: "✨",
        quotientActive: true
      });

      let currentSubRecord = {
        subColStart: 0,
        subLen: curValStr.length,
        subStr: String(product),
        diffStr: String(remainder),
        downDigits: []
      };
      subHistory.push(currentSubRecord);

      steps.push({
        activeDividendCols: [],
        quotient,
        subHistory: JSON.parse(JSON.stringify(subHistory)),
        title: "Çarpma ve Çıkarma",
        body: `Şimdi çarpıp kalanı bulalım:<br><b>${qDigit} × ${divisor} = ${product}</b><br><b>${curNum} - ${product} = ${remainder}</b> kaldı.`,
        type: "normal",
        avatar: "➖"
      });

      // Process each remaining digit from left to right
      for (let i = ptr + 1; i < digits.length; i++) {
        const downDigit = digits[i];
        currentSubRecord.downDigits.push({ digit: downDigit, col: i });

        const prevRemainder = remainder;
        curNum = prevRemainder * 10 + Number(downDigit);
        qDigit = Math.floor(curNum / divisor);
        product = qDigit * divisor;
        remainder = curNum - product;

        // Step: Digit drops down
        steps.push({
          activeDividendCols: [i],
          downCol: i,
          quotient,
          subHistory: JSON.parse(JSON.stringify(subHistory)),
          title: "Yukarıdan Rakam İndir ⬇️",
          body: `Yukarıdaki sıradaki basamak olan <b style="color:#34d399;font-size:22px;">${downDigit}</b> aşağıya indi!<br>Oluşan yeni sayımız: <b style="color:#34d399;font-size:22px;">${curNum}</b> oldu.`,
          type: "normal",
          avatar: "⬇️"
        });

        if (qDigit === 0) {
          // ZERO TRAP: Dividend digit brought down, but cannot be divided
          quotient += "0";
          steps.push({
            activeDividendCols: [],
            quotient,
            subHistory: JSON.parse(JSON.stringify(subHistory)),
            title: "⚠️ DİKKAT: Sıfır Tuzağı!",
            body: `Yukarıdan <b>${downDigit}</b> indi ama oluşan <b style="color:#f59e0b;font-size:20px;">${curNum}</b> sayısı içinde <b>${divisor} YOKTUR (0 defa var)</b>!<br><br><span style="color:#fbbf24;font-weight:800;">Altın 4. Sınıf Kuralı:</span> Yukarıdan sayı indirdiğinde bölen içinde yoksa, bölüme mutlaka <b>0 (SIFIR)</b> eklenir!`,
            type: "trap",
            avatar: "⚠️",
            quotientActive: true
          });
          // remainder is unchanged (still curNum)
        } else {
          // Non-zero quotient digit
          quotient += String(qDigit);
          steps.push({
            activeDividendCols: [],
            quotient,
            subHistory: JSON.parse(JSON.stringify(subHistory)),
            title: `Bölüme ${qDigit} Ekliyoruz`,
            body: `<b>${curNum}</b> içinde <b>${divisor}</b> tam <b style="color:#fbbf24;font-size:22px;">${qDigit} defa</b> var!<br>Bölüm çizgisine <b>${qDigit}</b> yazıyoruz.`,
            type: "normal",
            avatar: "✨",
            quotientActive: true
          });

          // Create new subtraction line
          const curNumLen = String(curNum).length;
          currentSubRecord = {
            subColStart: i - curNumLen + 1,
            subLen: curNumLen,
            subStr: String(product),
            diffStr: String(remainder),
            downDigits: []
          };
          subHistory.push(currentSubRecord);

          steps.push({
            activeDividendCols: [],
            quotient,
            subHistory: JSON.parse(JSON.stringify(subHistory)),
            title: "Çarpma ve Çıkarma",
            body: `<b>${qDigit} × ${divisor} = ${product}</b><br><b>${curNum} - ${product} = ${remainder}</b> kaldı.`,
            type: "normal",
            avatar: "➖"
          });
        }
      }

      // Final Step: Celebration / Finish
      const finalRemainder = dividend % divisor;
      const isExact = finalRemainder === 0;

      steps.push({
        activeDividendCols: [],
        quotient,
        subHistory: JSON.parse(JSON.stringify(subHistory)),
        title: isExact ? "🎉 Tebrikler! Tam Bölündü!" : "✨ İşlem Tamamlandı (Kalanlı)",
        body: `Yukarıda indirilecek başka rakam kalmadı!<br><br>` +
              `🎯 <b>BÖLÜM: <span style="color:#fbbf24;font-size:26px;">${quotient}</span></b><br>` +
              (isExact 
                ? `💎 <b>KALAN: 0</b> (Tüm sayılar kalansız paylaşıldı)` 
                : `⚠️ <b>KALAN: ${finalRemainder}</b> (Artan sayı)`),
        type: "success",
        avatar: "🏆"
      });

      return steps;
    }

    function renderCurrentDivStep() {
      const step = stepDivisionSteps[currentDivStepIndex];
      if (!step) return;

      const divStr = String(stepDivDividend);
      const totalCols = divStr.length;

      // Update Coach Guidance Panel
      const coachBubble = document.getElementById('coachBubble');
      const coachAvatar = document.getElementById('coachAvatar');
      const coachTitle = document.getElementById('coachTitle');
      const coachBadge = document.getElementById('coachStepBadge');

      coachTitle.textContent = step.title;
      coachBadge.textContent = `Adım ${currentDivStepIndex + 1} / ${stepDivisionSteps.length}`;
      coachBubble.innerHTML = step.body;
      coachAvatar.textContent = step.avatar;

      coachBubble.className = 'coach-bubble';
      if (step.type === 'trap') {
        coachBubble.classList.add('trap-alert');
        playWrongSound();
      } else if (step.type === 'success') {
        coachBubble.classList.add('finish-success');
        triggerConfetti();
        playSuccessChime();
      } else if (step.quotientActive) {
        playPop(620);
      } else {
        playPop(450);
      }

      // Update Button States
      document.getElementById('btnStepPrev').disabled = (currentDivStepIndex === 0);
      document.getElementById('btnStepNext').disabled = (currentDivStepIndex === stepDivisionSteps.length - 1);

      // BUILD NOTEBOOK BOARD HTML
      const container = document.getElementById('divisionLayoutContainer');
      let html = `<div class="div-left-column">`;

      // 1. Dividend Row
      html += `<div style="display:flex;">`;
      for (let i = 0; i < totalCols; i++) {
        let cls = 'digit-cell';
        if (step.activeDividendCols && step.activeDividendCols.includes(i)) {
          cls += ' highlight-active';
        } else if (step.downCol === i) {
          cls += ' highlight-down';
        }
        html += `<div class="${cls}">${divStr[i]}</div>`;
      }
      html += `</div>`;

      // 2. Subtraction History Rows
      step.subHistory.forEach((item, sIdx) => {
        // Product Row (with '-' sign)
        html += `<div class="subtraction-row">`;
        html += `<div class="sub-sign">-</div>`;
        html += `<div style="display:flex;">`;

        const subFormatted = item.subStr.padStart(item.subLen, ' ');
        for (let col = 0; col < totalCols; col++) {
          if (col >= item.subColStart && col < item.subColStart + item.subLen) {
            const char = subFormatted[col - item.subColStart];
            html += `<div class="digit-cell">${char === ' ' ? '' : char}</div>`;
          } else {
            html += `<div class="digit-cell empty"></div>`;
          }
        }
        html += `</div></div>`;

        // Horizontal Line
        html += `<div class="sub-line"></div>`;

        // Difference + Brought Down Digits Row
        html += `<div class="subtraction-row">`;
        html += `<div class="sub-sign" style="visibility:hidden;">-</div>`;
        html += `<div style="display:flex;">`;

        const diffFormatted = item.diffStr.padStart(item.subLen, ' ');
        for (let col = 0; col < totalCols; col++) {
          let char = '';
          let cls = 'digit-cell';

          // Is it in diff range?
          if (col >= item.subColStart && col < item.subColStart + item.subLen) {
            char = diffFormatted[col - item.subColStart];
            if (char === ' ') char = '';
          }

          // Is there a brought down digit at this column?
          const matchedDown = item.downDigits.find(d => d.col === col);
          if (matchedDown) {
            char = matchedDown.digit;
            cls += ' highlight-down';
          }

          html += `<div class="${cls}">${char}</div>`;
        }
        html += `</div></div>`;
      });

      html += `</div>`; // Close left column

      // 3. Right Column (Divisor & Quotient)
      html += `<div class="div-right-column">`;
      // Divisor
      html += `<div class="div-divisor-box">`;
      String(stepDivDivisor).split('').forEach(d => {
        html += `<div class="digit-cell" style="color:#38bdf8;">${d}</div>`;
      });
      html += `</div>`;

      // Quotient
      html += `<div class="div-quotient-box">`;
      const qDigits = step.quotient.split('');
      const hideLastForPractice = stepPracticeMode && step.quotientActive;
      qDigits.forEach((d, idx) => {
        let cls = 'digit-cell';
        let shown = d;
        if (step.quotientActive && idx === qDigits.length - 1) {
          cls += ' quotient-active';
          if (hideLastForPractice) shown = '?';
        }
        html += `<div class="${cls}" style="color:${hideLastForPractice && idx === qDigits.length - 1 ? '#ec4899' : '#d97706'};">${shown}</div>`;
      });
      html += `</div>`;

      html += `</div>`; // Close right column

      container.innerHTML = html;

      // Sıra Sende (Ben Çözeyim) Rakam Tuş Takımı
      const padBox = document.getElementById('stepPracticePad');
      if (padBox) {
        if (hideLastForPractice) {
          padBox.style.display = 'block';
          const fb = document.getElementById('stepPracticeFeedback');
          if (fb) {
            fb.textContent = 'Sence bölüm kısmına hangi rakam gelmeli? Seç!';
            fb.className = 'sa-practice-fb';
          }
        } else {
          padBox.style.display = 'none';
        }
      }
    }

    function stepDivNext() {
      if (currentDivStepIndex < stepDivisionSteps.length - 1) {
        currentDivStepIndex++;
        renderCurrentDivStep();
      } else {
        stepDivStopAuto();
      }
    }

    function stepDivPrev() {
      if (currentDivStepIndex > 0) {
        currentDivStepIndex--;
        renderCurrentDivStep();
      }
    }

    function stepDivReset() {
      initAudio();
      playPop(400);
      stepDivStopAuto();
      currentDivStepIndex = 0;
      renderCurrentDivStep();
    }

    function stepDivToggleAuto() {
      initAudio();
      if (isStepAutoPlaying) {
        stepDivStopAuto();
      } else {
        stepDivStartAuto();
      }
    }

    function stepDivStartAuto() {
      isStepAutoPlaying = true;
      document.getElementById('btnStepAuto').innerHTML = '<span>⏸️</span> Duraklat';
      playPop(550);

      if (currentDivStepIndex >= stepDivisionSteps.length - 1) {
        currentDivStepIndex = 0;
        renderCurrentDivStep();
      }

      stepAutoTimer = setInterval(() => {
        if (currentDivStepIndex < stepDivisionSteps.length - 1) {
          stepDivNext();
        } else {
          stepDivStopAuto();
        }
      }, 2200);
    }

    function stepDivStopAuto() {
      isStepAutoPlaying = false;
      if (stepAutoTimer) {
        clearInterval(stepAutoTimer);
        stepAutoTimer = null;
      }
      const btn = document.getElementById('btnStepAuto');
      if (btn) btn.innerHTML = '<span>▶️</span> Otomatik Oynat';
    }

    // RASTGELE YENİ SORU FONKSİYONLARI
    function randomMultiplication() {
      initAudio();
      stopMultiplicationAnimation(false);
      let nextA, nextB;
      do {
        nextA = Math.floor(Math.random() * 10) + 2; // 2..11
        nextB = Math.floor(Math.random() * 10) + 2; // 2..11
      } while (nextA === factorA && nextB === factorB);
      factorA = nextA;
      factorB = nextB;
      playPop(580, 'triangle', 0.09);
      updateMultiplicationUI();
    }

    function randomDivision() {
      initAudio();
      stopDivGridAnimation(false);
      let nextDivisor = Math.floor(Math.random() * 8) + 2; // 2..9
      const maxMult = Math.max(2, Math.floor(96 / nextDivisor));
      const mult = Math.floor(Math.random() * (maxMult - 1)) + 2;
      const rem = Math.random() < 0.35 ? Math.floor(Math.random() * (nextDivisor - 1)) + 1 : 0;
      let nextDividend = Math.min(100, nextDivisor * mult + rem);
      if (nextDividend === dividend && nextDivisor === divisor) {
        nextDividend = Math.min(100, nextDividend + 1);
      }
      divisor = nextDivisor;
      dividend = nextDividend;
      playPop(540, 'triangle', 0.09);
      document.getElementById('dividendBox').textContent = dividend;
      document.getElementById('divisorBox').textContent = divisor;
      if (divMode === 'grid') {
        renderDivisionGrid();
      } else {
        renderChests();
      }
    }

    function randomStepDivision() {
      initAudio();
      const nextDivisor = Math.floor(Math.random() * 22) + 3; // 3..24
      const minQ = Math.ceil(1000 / nextDivisor);
      const maxQ = Math.floor(9999 / nextDivisor);
      const q = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
      const rem = Math.random() < 0.4 ? Math.floor(Math.random() * (nextDivisor - 1)) + 1 : 0;
      const nextDividend = Math.min(9999, q * nextDivisor + rem);
      playPop(520, 'triangle', 0.09);
      loadStepExample(nextDividend, nextDivisor);
    }

    // PORTAL ENTEGRASYON BAŞLATICISI
    let saInitialized = false;
    window.initSayiAvcilariPage = function () {
      if (!saInitialized) {
        saInitialized = true;
        updateMultiplicationUI();
        renderChests();
        initStepDivision();
        generateQuizQuestion();
        updateMistakesBadge();
      }
      resizeConfetti();
      setTimeout(() => {
        resizeLegoCanvas();
        if (divMode === 'grid') {
          resizeDivGridCanvas();
        }
      }, 20);
    };

    window.SA = {
      switchTab,
      toggleSound,
      changeFactorA,
      changeFactorB,
      toggleSplitStrategy,
      setMultViewMode,
      animateMultiplicationStack,
      randomMultiplication,
      changeDividend,
      changeDivisor,
      setDividendDirect,
      setDivMode,
      runDivisionAction,
      randomDivision,
      loadCustomStepDivision,
      loadStepExample,
      randomStepDivision,
      stepDivPrev,
      stepDivNext,
      stepDivToggleAuto,
      stepDivReset,
      setQuizLevel,
      toggleQuizHint,
      handleQuizAnswer,
      checkMultGuess,
      toggleMultResultReveal,
      toggleStepPracticeMode,
      submitStepDigit
    };
})();
