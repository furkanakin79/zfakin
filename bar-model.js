(function () {
  'use strict';

  const PROBLEMS = [
    {
      title: 'Kat & Fazlası Problemi',
      text: 'Elif\'in 18 tane yıldız çıkartması var. Zeynep\'in çıkartmaları ise Elif\'in 3 katından 6 fazladır. Zeynep\'in kaç çıkartması vardır?',
      bars: [
        { label: 'Elif', color: '#8b5cf6', units: [{ text: '18', flex: 1 }] },
        { label: 'Zeynep', color: '#ec4899', units: [{ text: '18', flex: 1 }, { text: '18', flex: 1 }, { text: '18', flex: 1 }, { text: '+6', flex: 0.55, extra: true }] }
      ],
      hint: 'Zeynep\'in çubuğunda 3 tane 18 ve bir de +6 var. Önce 3 × 18 = 54 bul, sonra 6 ekle!',
      steps: ['3 × 18 = 54', '54 + 6 = 60'],
      answer: 60,
      unit: 'çıkartma'
    },
    {
      title: 'Toplam & Paylaşım',
      text: 'Bir kutuda toplam 84 kalem vardır. Kırmızı kalemler, mavi kalemlerin 3 katıdır. Kutuda kaç tane mavi kalem vardır?',
      bars: [
        { label: 'Mavi Kalem', color: '#3b82f6', units: [{ text: '?', flex: 1 }] },
        { label: 'Kırmızı (3 katı)', color: '#ec4899', units: [{ text: '?', flex: 1 }, { text: '?', flex: 1 }, { text: '?', flex: 1 }] }
      ],
      totalLabel: 'Hepsinin Toplamı = 84 kalem (4 eşit parça)',
      hint: 'Toplam 1 + 3 = 4 eşit kutu var ve hepsi 84 ediyor. 1 kutuyu bulmak için 84 ÷ 4 yap!',
      steps: ['1 + 3 = 4 eşit kutu', '84 ÷ 4 = 21'],
      answer: 21,
      unit: 'mavi kalem'
    },
    {
      title: 'Eksiği Problemi',
      text: 'Bir hikaye kitabının 145 sayfasını okuyan Defne\'nin, okuduğu sayfaların 2 katından 30 eksik sayfası kalmıştır. Defne\'nin kaç sayfası kalmıştır?',
      bars: [
        { label: 'Okunan', color: '#10b981', units: [{ text: '145', flex: 1 }] },
        { label: 'Kalan (2 katı - 30)', color: '#f59e0b', units: [{ text: '145', flex: 1 }, { text: '145', flex: 1 }, { text: '-30', flex: 0.6, extra: true }] }
      ],
      hint: 'Önce 145\'in 2 katını bul (145 × 2 = 290), sonra 30 çıkar!',
      steps: ['145 × 2 = 290', '290 - 30 = 260'],
      answer: 260,
      unit: 'sayfa'
    },
    {
      title: 'Fark & Paylaşım',
      text: 'İki kardeşin paraları toplamı 120 TL\'dir. Ablasının parası kardeşinin parasının 2 katından 15 TL fazladır. Kardeşin kaç TL\'si vardır?',
      bars: [
        { label: 'Kardeş', color: '#8b5cf6', units: [{ text: '?', flex: 1 }] },
        { label: 'Abla', color: '#ec4899', units: [{ text: '?', flex: 1 }, { text: '?', flex: 1 }, { text: '+15', flex: 0.6, extra: true }] }
      ],
      totalLabel: 'Toplam = 120 TL',
      hint: 'Önce fazlalık olan 15 TL\'yi toplamdan çıkar: 120 - 15 = 105 TL. Kalan 3 eşit kutuyu 3\'e böl!',
      steps: ['120 - 15 = 105', '105 ÷ 3 = 35'],
      answer: 35,
      unit: 'TL'
    },
    {
      title: 'Eşit Dağıtım & Kalan',
      text: 'Fırından alınan 95 kurabiye 6 tabağa eşit olarak paylaştırılıyor. Her tabakta kaç kurabiye olur ve kaç kurabiye artar? (Sadece 1 tabaktaki kurabiyeyi yaz)',
      bars: [
        { label: '6 Tabak', color: '#f59e0b', units: [{ text: '?', flex: 1 }, { text: '?', flex: 1 }, { text: '?', flex: 1 }, { text: '?', flex: 1 }, { text: '?', flex: 1 }, { text: '?', flex: 1 }] }
      ],
      totalLabel: 'Toplam = 95 kurabiye',
      hint: '95\'i 6\'ya böl: 95 ÷ 6 = 15 (Kalan 5 kurabiye).',
      steps: ['95 ÷ 6 = 15', 'Kalan = 5 kurabiye'],
      answer: 15,
      unit: 'kurabiye'
    },
    {
      title: 'Kat & Toplam',
      text: 'Bir bahçede 24 elma ağacı, elma ağaçlarının 4 katı kadar da kiraz ağacı vardır. Bahçede TOPLAM kaç ağaç vardır?',
      bars: [
        { label: 'Elma', color: '#10b981', units: [{ text: '24', flex: 1 }] },
        { label: 'Kiraz (4 katı)', color: '#ec4899', units: [{ text: '24', flex: 1 }, { text: '24', flex: 1 }, { text: '24', flex: 1 }, { text: '24', flex: 1 }] }
      ],
      totalLabel: 'Toplam 5 tane 24\'lük kutu!',
      hint: '1 kutu elma + 4 kutu kiraz = 5 kutu! Yani 5 × 24 işlemini yapabilirsin.',
      steps: ['1 + 4 = 5 kutu', '5 × 24 = 120'],
      answer: 120,
      unit: 'ağaç'
    }
  ];

  let currentIndex = 0;
  let currentProblem = PROBLEMS[0];
  let isRandomMode = false;
  let solvedCount = 0;
  let revealBars = true;
  let initialized = false;

  const NAMES_PAIR = [
    ['Elif', 'Zeynep'],
    ['Defne', 'Merve'],
    ['Ece', 'Ada'],
    ['Kerem', 'Emir'],
    ['Deniz', 'Beren'],
    ['Asya', 'Lina']
  ];

  const ITEM_SETS = [
    { item: 'bilye', unit: 'bilye' },
    { item: 'çıkartma', unit: 'çıkartma' },
    { item: 'sayfa', unit: 'sayfa' },
    { item: 'fındık', unit: 'fındık' },
    { item: 'kalem', unit: 'kalem' },
    { item: 'çiçek', unit: 'çiçek' }
  ];

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateRandomProblem() {
    const [n1, n2] = pick(NAMES_PAIR);
    const { item, unit } = pick(ITEM_SETS);
    const type = randInt(0, 5);

    if (type === 0) {
      // Kat & Fazlası
      const base = randInt(12, 36);
      const mult = randInt(2, 4);
      const extra = randInt(4, 18);
      const ans = base * mult + extra;
      const units = Array.from({ length: mult }, () => ({ text: String(base), flex: 1 }));
      units.push({ text: `+${extra}`, flex: 0.55, extra: true });
      return {
        title: 'Kat & Fazlası Problemi',
        text: `${n1}'in ${base} tane ${item}si var. ${n2}'in ${item}leri ise ${n1}'in ${mult} katından ${extra} fazladır. ${n2}'in kaç ${item}si vardır?`,
        bars: [
          { label: n1, color: '#8b5cf6', units: [{ text: String(base), flex: 1 }] },
          { label: `${n2} (${mult} katı + ${extra})`, color: '#ec4899', units }
        ],
        hint: `${n2}'in çubuğunda ${mult} tane ${base} ve bir de +${extra} var. Önce ${mult} × ${base} = ${base * mult} bul, sonra ${extra} ekle!`,
        steps: [`${mult} × ${base} = ${base * mult}`, `${base * mult} + ${extra} = ${ans}`],
        answer: ans,
        unit
      };
    }

    if (type === 1) {
      // Toplam & Paylaşım
      const small = randInt(12, 34);
      const mult = randInt(2, 4);
      const totalParts = mult + 1;
      const total = small * totalParts;
      const secondUnits = Array.from({ length: mult }, () => ({ text: '?', flex: 1 }));
      return {
        title: 'Toplam & Paylaşım',
        text: `Bir kutuda toplam ${total} kalem vardır. Kırmızı kalemler, mavi kalemlerin ${mult} katıdır. Kutuda kaç tane mavi kalem vardır?`,
        bars: [
          { label: 'Mavi Kalem', color: '#3b82f6', units: [{ text: '?', flex: 1 }] },
          { label: `Kırmızı (${mult} katı)`, color: '#ec4899', units: secondUnits }
        ],
        totalLabel: `Hepsinin Toplamı = ${total} kalem (${totalParts} eşit parça)`,
        hint: `Toplam 1 + ${mult} = ${totalParts} eşit kutu var ve hepsi ${total} ediyor. 1 kutuyu bulmak için ${total} ÷ ${totalParts} yap!`,
        steps: [`1 + ${mult} = ${totalParts} eşit kutu`, `${total} ÷ ${totalParts} = ${small}`],
        answer: small,
        unit: 'mavi kalem'
      };
    }

    if (type === 2) {
      // Eksiği Problemi
      const base = randInt(25, 140);
      const mult = randInt(2, 3);
      const minus = randInt(10, 35);
      const prod = base * mult;
      const ans = prod - minus;
      const units = Array.from({ length: mult }, () => ({ text: String(base), flex: 1 }));
      units.push({ text: `-${minus}`, flex: 0.6, extra: true });
      return {
        title: 'Kat & Eksiği Problemi',
        text: `Bir hikaye kitabının ${base} sayfasını okuyan ${n1}'in, okuduğu sayfaların ${mult} katından ${minus} eksik sayfası kalmıştır. ${n1}'in kaç sayfası kalmıştır?`,
        bars: [
          { label: 'Okunan', color: '#10b981', units: [{ text: String(base), flex: 1 }] },
          { label: `Kalan (${mult} katı - ${minus})`, color: '#f59e0b', units }
        ],
        hint: `Önce ${base}'in ${mult} katını bul (${base} × ${mult} = ${prod}), sonra ${minus} çıkar!`,
        steps: [`${base} × ${mult} = ${prod}`, `${prod} - ${minus} = ${ans}`],
        answer: ans,
        unit: 'sayfa'
      };
    }

    if (type === 3) {
      // Fark & Paylaşım (Toplam + Fazlalık)
      const small = randInt(15, 45);
      const mult = randInt(2, 3);
      const extra = randInt(8, 25);
      const totalParts = mult + 1;
      const total = small * totalParts + extra;
      const ablaUnits = Array.from({ length: mult }, () => ({ text: '?', flex: 1 }));
      ablaUnits.push({ text: `+${extra}`, flex: 0.6, extra: true });
      return {
        title: 'Fazlalık & Paylaşım',
        text: `İki kardeşin paraları toplamı ${total} TL'dir. ${n2}'in parası ${n1}'in parasının ${mult} katından ${extra} TL fazladır. ${n1}'in kaç TL'si vardır?`,
        bars: [
          { label: n1, color: '#8b5cf6', units: [{ text: '?', flex: 1 }] },
          { label: n2, color: '#ec4899', units: ablaUnits }
        ],
        totalLabel: `Toplam = ${total} TL`,
        hint: `Önce fazlalık olan ${extra} TL'yi toplamdan çıkar: ${total} - ${extra} = ${total - extra} TL. Kalan ${totalParts} eşit kutuyu ${totalParts}'e böl!`,
        steps: [`${total} - ${extra} = ${total - extra}`, `${total - extra} ÷ ${totalParts} = ${small}`],
        answer: small,
        unit: 'TL'
      };
    }

    if (type === 4) {
      // Eşit Dağıtım & Kalan
      const groups = randInt(4, 7);
      const each = randInt(11, 24);
      const rem = randInt(1, groups - 1);
      const total = groups * each + rem;
      const units = Array.from({ length: groups }, () => ({ text: '?', flex: 1 }));
      return {
        title: 'Eşit Dağıtım & Kalan',
        text: `Fırından alınan ${total} kurabiye ${groups} tabağa eşit olarak paylaştırılıyor. Her tabakta kaç kurabiye olur? (Kalan kurabiyeleri ayır)`,
        bars: [
          { label: `${groups} Tabak`, color: '#f59e0b', units }
        ],
        totalLabel: `Toplam = ${total} kurabiye`,
        hint: `${total}'i ${groups}'e böl: ${total} ÷ ${groups} = ${each} (Kalan ${rem} kurabiye).`,
        steps: [`${total} ÷ ${groups} = ${each}`, `Kalan = ${rem} kurabiye`],
        answer: each,
        unit: 'kurabiye'
      };
    }

    // type === 5: Kat & Toplam
    const base = randInt(14, 35);
    const mult = randInt(2, 4);
    const totalParts = mult + 1;
    const ans = base * totalParts;
    const cherryUnits = Array.from({ length: mult }, () => ({ text: String(base), flex: 1 }));
    return {
      title: 'Kat & Toplam',
      text: `Bir bahçede ${base} elma ağacı, elma ağaçlarının ${mult} katı kadar da kiraz ağacı vardır. Bahçede TOPLAM kaç ağaç vardır?`,
      bars: [
        { label: 'Elma', color: '#10b981', units: [{ text: String(base), flex: 1 }] },
        { label: `Kiraz (${mult} katı)`, color: '#ec4899', units: cherryUnits }
      ],
      totalLabel: `Toplam ${totalParts} tane ${base}'lük kutu!`,
      hint: `1 kutu elma + ${mult} kutu kiraz = ${totalParts} kutu! Yani ${totalParts} × ${base} işlemini yapabilirsin.`,
      steps: [`1 + ${mult} = ${totalParts} kutu`, `${totalParts} × ${base} = ${ans}`],
      answer: ans,
      unit: 'ağaç'
    };
  }

  function playSound(freq = 540) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  function renderProblem() {
    const p = currentProblem;
    const titleEl = document.getElementById('bmTitle');
    const textEl = document.getElementById('bmProblemText');
    const stageEl = document.getElementById('bmVisualStage');
    const hintEl = document.getElementById('bmHintBox');
    const fbEl = document.getElementById('bmFeedback');
    const inputEl = document.getElementById('bmAnswerInput');
    const unitEl = document.getElementById('bmUnitLabel');
    const countEl = document.getElementById('bmSolvedCount');

    if (titleEl) {
      titleEl.textContent = isRandomMode
        ? `🎲 Rastgele Soru: ${p.title}`
        : `Örnek ${currentIndex + 1} / ${PROBLEMS.length}: ${p.title}`;
    }
    if (textEl) textEl.textContent = p.text;
    if (unitEl) unitEl.textContent = p.unit;
    if (countEl) countEl.textContent = solvedCount;
    if (inputEl) { inputEl.value = ''; inputEl.focus(); }
    if (hintEl) { hintEl.style.display = 'none'; hintEl.textContent = `💡 ${p.hint}`; }
    if (fbEl) { fbEl.textContent = ''; fbEl.className = 'bm-feedback'; }

    if (stageEl) {
      if (!revealBars) {
        stageEl.innerHTML = `<div class="bm-hidden-msg">Çubuk modelini görmek için "📊 Çubukları Göster" butonuna bas!</div>`;
      } else {
        let html = '';
        const maxFlex = Math.max(
          ...p.bars.map(b => b.units.reduce((sum, u) => sum + u.flex, 0))
        );
        const maxCount = Math.max(...p.bars.map(b => b.units.length));
        const totalGapPx = Math.max(0, maxCount - 1) * 6;
        p.bars.forEach(bar => {
          const unitsHtml = bar.units.map(u => {
            const ratio = u.flex / maxFlex;
            const widthExpr = `calc((100% - ${totalGapPx}px) * ${ratio.toFixed(6)})`;
            return `
            <div class="bm-unit ${u.extra ? 'extra' : ''}" style="flex:0 0 ${widthExpr}; width:${widthExpr}; background:${u.extra ? '#fef3c7' : bar.color}; color:${u.extra ? '#92400e' : '#ffffff'}; border-color:${u.extra ? '#f59e0b' : 'transparent'};">
              ${u.text}
            </div>
          `;
          }).join('');
          html += `
            <div class="bm-row">
              <div class="bm-row-label">${bar.label}</div>
              <div class="bm-row-units">${unitsHtml}</div>
            </div>
          `;
        });
        if (p.totalLabel) {
          html += `<div class="bm-total-bracket">${p.totalLabel}</div>`;
        }
        stageEl.innerHTML = html;
      }
    }
  }

  function checkAnswer() {
    const p = currentProblem;
    const inputEl = document.getElementById('bmAnswerInput');
    const fbEl = document.getElementById('bmFeedback');
    if (!inputEl || !fbEl) return;

    const val = parseInt(inputEl.value, 10);
    if (isNaN(val)) {
      fbEl.textContent = 'Lütfen bir sayı yaz!';
      fbEl.className = 'bm-feedback warn';
      return;
    }

    if (val === p.answer) {
      playSound(760);
      solvedCount++;
      if (window.confetti) window.confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });
      fbEl.innerHTML = `🎉 <b>Harika!</b> Doğru cevap: <b>${p.answer} ${p.unit}</b> (${p.steps.join(' → ')})`;
      fbEl.className = 'bm-feedback success';
      const countEl = document.getElementById('bmSolvedCount');
      if (countEl) countEl.textContent = solvedCount;
    } else {
      playSound(240);
      fbEl.innerHTML = `🤔 Tam olmadı. İstersen <b>💡 İpucu Al</b> butonuna tıklayıp çubukları incele!`;
      fbEl.className = 'bm-feedback warn';
    }
  }

  window.initBarModelPage = function () {
    if (!initialized) {
      initialized = true;
      renderProblem();
    }
  };

  window.BM = {
    nextProblem() {
      playSound(520);
      isRandomMode = false;
      currentIndex = (currentIndex + 1) % PROBLEMS.length;
      currentProblem = PROBLEMS[currentIndex];
      renderProblem();
    },
    prevProblem() {
      playSound(480);
      isRandomMode = false;
      currentIndex = (currentIndex - 1 + PROBLEMS.length) % PROBLEMS.length;
      currentProblem = PROBLEMS[currentIndex];
      renderProblem();
    },
    randomProblem() {
      playSound(600);
      isRandomMode = true;
      currentProblem = generateRandomProblem();
      renderProblem();
    },
    toggleHint() {
      playSound(600);
      const hintEl = document.getElementById('bmHintBox');
      if (hintEl) {
        hintEl.style.display = hintEl.style.display === 'none' ? 'block' : 'none';
      }
    },
    toggleBars() {
      playSound(540);
      revealBars = !revealBars;
      renderProblem();
    },
    checkAnswer
  };
})();
