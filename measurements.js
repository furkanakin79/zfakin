(function () {
  'use strict';

  let category = 'length'; // 'length' | 'weight' | 'liquid'
  let exploreVal = 2;
  let exploreUnit = 'm';
  let weightPieceMode = 500; // 250, 500, 1000
  let liquidPieceMode = 500; // 250, 500, 1000 (mL)
  let lengthPieceMode = 50;  // 25, 50, 100 (cm or m depending on unit)
  let score = 0;
  let currentQ = null;
  let initialized = false;

  const UNIT_META = {
    length: {
      title: 'Uzunluk Ölçüleri',
      units: [
        { id: 'km', name: 'Kilometre (km)', desc: 'Şehirler arası uzun yolları ölçerken kullanırız. (1 km = 1000 m)' },
        { id: 'hm', name: 'Hektometre (hm)', desc: '100 metreye eşittir. Uzunluk merdiveninde km ile dam arasındadır.' },
        { id: 'dam', name: 'Dekametre (dam)', desc: '10 metreye eşittir. Merdivende hm ile m arasındadır.' },
        { id: 'm', name: 'Metre (m)', desc: 'Temel uzunluk birimidir. Odanın boyu, boyumuz için kullanırız.' },
        { id: 'dm', name: 'Desimetre (dm)', desc: '1 metrenin onda biridir (1 m = 10 dm, 1 dm = 10 cm). Bir karış kadardır!' },
        { id: 'cm', name: 'Santimetre (cm)', desc: 'Kalem, defter, silgi gibi nesneleri cetvelle ölçerken kullanırız.' },
        { id: 'mm', name: 'Milimetre (mm)', desc: 'Karınca, iğne ucu veya kağıt kalınlığı gibi çok küçük şeyleri ölçer.' }
      ],
      presets: [
        { label: '🏫 Okul Yolu (2 km)', val: 2, unit: 'km' },
        { label: '🚪 Kapı Boyu (2 m)', val: 2, unit: 'm' },
        { label: '🖐️ Bir Karış (2 dm)', val: 2, unit: 'dm' },
        { label: '✏️ Kalem (15 cm)', val: 15, unit: 'cm' },
        { label: '🐜 Karınca (8 mm)', val: 8, unit: 'mm' }
      ],
      ladder: [
        { u: 'km', mult: '× 10 → hm' },
        { u: 'hm', mult: '× 10 → dam' },
        { u: 'dam', mult: '× 10 → m' },
        { u: 'm', mult: '× 10 → dm' },
        { u: 'dm', mult: '× 10 → cm' },
        { u: 'cm', mult: '× 10 → mm' },
        { u: 'mm', mult: 'En alt basamak' }
      ]
    },
    weight: {
      title: 'Kütle (Ağırlık) Ölçüleri',
      units: [
        { id: 't', name: 'Ton (t)', desc: 'Kamyon, fil veya kömür gibi çok ağır yükleri ölçer. (1 t = 1000 kg)' },
        { id: 'kg', name: 'Kilogram (kg)', desc: 'Karpuz, un çuvalı veya kendi kütlemizi ölçmek için temel birimdir.' },
        { id: 'hg', name: 'Hektogram (hg)', desc: '100 grama eşittir (1 kg = 10 hg).' },
        { id: 'dag', name: 'Dekagram (dag)', desc: '10 grama eşittir (1 hg = 10 dag).' },
        { id: 'g', name: 'Gram (g)', desc: 'Elma, kurabiye, yüzük gibi hafif nesneleri ölçer.' },
        { id: 'dg', name: 'Desigram (dg)', desc: 'Gramın onda biridir (1 g = 10 dg).' },
        { id: 'cg', name: 'Santigram (cg)', desc: 'Gramın yüzde biridir (1 dg = 10 cg).' },
        { id: 'mg', name: 'Miligram (mg)', desc: 'İlaç tabletleri veya tüy gibi çok hafif şeyleri ölçer.' }
      ],
      presets: [
        { label: '🚚 Kamyonet (2 t)', val: 2, unit: 't' },
        { label: '🍉 Karpuz (4 kg)', val: 4, unit: 'kg' },
        { label: '🍎 Yarım kg (500 g)', val: 500, unit: 'g' },
        { label: '🧀 20 dag (200 g)', val: 20, unit: 'dag' },
        { label: '🍫 Çeyrek kg (250 g)', val: 250, unit: 'g' }
      ],
      ladder: [
        { u: 't → kg', mult: '× 1000' },
        { u: 'kg', mult: '× 10 → hg' },
        { u: 'hg', mult: '× 10 → dag' },
        { u: 'dag', mult: '× 10 → g' },
        { u: 'g', mult: '× 10 → dg' },
        { u: 'dg', mult: '× 10 → cg' },
        { u: 'cg → mg', mult: '× 10' }
      ]
    },
    liquid: {
      title: 'Sıvı Ölçüleri',
      units: [
        { id: 'kL', name: 'Kilolitre (kL)', desc: 'Havuz veya büyük su depolarını ölçer (1 kL = 1000 L).' },
        { id: 'hL', name: 'Hektolitre (hL)', desc: '100 litreye eşittir (1 kL = 10 hL).' },
        { id: 'daL', name: 'Dekalitre (daL)', desc: '10 litreye eşittir (1 hL = 10 daL).' },
        { id: 'L', name: 'Litre (L)', desc: 'Büyük su şişesi, süt kutusu veya kova gibi sıvıları ölçer.' },
        { id: 'dL', name: 'Desilitre (dL)', desc: 'Litrenin onda biridir (1 L = 10 dL).' },
        { id: 'cL', name: 'Santilitre (cL)', desc: 'Kutu içeceklerin üzerinde sıkça görürüz (1 L = 100 cL, 33 cL = 330 mL).' },
        { id: 'mL', name: 'Mililitre (mL)', desc: 'Kaşık, şurup veya küçük meyve suyu kutularını ölçer.' }
      ],
      presets: [
        { label: '🚰 Büyük Sürahi (2 L)', val: 2, unit: 'L' },
        { label: '🥛 Yarım Litre (500 mL)', val: 500, unit: 'mL' },
        { label: '🥤 Kutu İçecek (33 cL)', val: 33, unit: 'cL' },
        { label: '🧃 Çeyrek L (250 mL)', val: 250, unit: 'mL' }
      ],
      ladder: [
        { u: 'kL', mult: '× 10 → hL' },
        { u: 'hL', mult: '× 10 → daL' },
        { u: 'daL', mult: '× 10 → L' },
        { u: 'L', mult: '× 10 → dL' },
        { u: 'dL', mult: '× 10 → cL' },
        { u: 'cL', mult: '× 10 → mL' },
        { u: 'mL', mult: 'En küçük basamak' }
      ]
    }
  };

  function playTone(freq = 540) {
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

  function formatNum(n) {
    return Number.isInteger(n) ? n.toLocaleString('tr-TR') : Number(n.toFixed(3)).toLocaleString('tr-TR');
  }

  function computeConversions() {
    const v = Math.max(0, Number(exploreVal) || 0);
    if (category === 'length') {
      // Base in mm
      const factorToMm = {
        km: 1000000,
        hm: 100000,
        dam: 10000,
        m: 1000,
        dm: 100,
        cm: 10,
        mm: 1
      }[exploreUnit] || 1;
      const mm = v * factorToMm;
      return [
        { label: 'Kilometre (km)', value: formatNum(mm / 1000000), active: exploreUnit === 'km' },
        { label: 'Hektometre (hm)', value: formatNum(mm / 100000), active: exploreUnit === 'hm' },
        { label: 'Dekametre (dam)', value: formatNum(mm / 10000), active: exploreUnit === 'dam' },
        { label: 'Metre (m)', value: formatNum(mm / 1000), active: exploreUnit === 'm' },
        { label: 'Desimetre (dm)', value: formatNum(mm / 100), active: exploreUnit === 'dm' },
        { label: 'Santimetre (cm)', value: formatNum(mm / 10), active: exploreUnit === 'cm' },
        { label: 'Milimetre (mm)', value: formatNum(mm), active: exploreUnit === 'mm' }
      ];
    }
    if (category === 'weight') {
      const factorToMg = {
        t: 1000000000,
        kg: 1000000,
        hg: 100000,
        dag: 10000,
        g: 1000,
        dg: 100,
        cg: 10,
        mg: 1
      }[exploreUnit] || 1;
      const mg = v * factorToMg;
      return [
        { label: 'Ton (t)', value: formatNum(mg / 1000000000), active: exploreUnit === 't' },
        { label: 'Kilogram (kg)', value: formatNum(mg / 1000000), active: exploreUnit === 'kg' },
        { label: 'Hektogram (hg)', value: formatNum(mg / 100000), active: exploreUnit === 'hg' },
        { label: 'Dekagram (dag)', value: formatNum(mg / 10000), active: exploreUnit === 'dag' },
        { label: 'Gram (g)', value: formatNum(mg / 1000), active: exploreUnit === 'g' },
        { label: 'Desigram (dg)', value: formatNum(mg / 100), active: exploreUnit === 'dg' },
        { label: 'Santigram (cg)', value: formatNum(mg / 10), active: exploreUnit === 'cg' },
        { label: 'Miligram (mg)', value: formatNum(mg), active: exploreUnit === 'mg' }
      ];
    }
    // liquid
    const factorToMl = {
      kL: 1000000,
      hL: 100000,
      daL: 10000,
      L: 1000,
      dL: 100,
      cL: 10,
      mL: 1
    }[exploreUnit] || 1;
    const mL = v * factorToMl;
    return [
      { label: 'Kilolitre (kL)', value: formatNum(mL / 1000000), active: exploreUnit === 'kL' },
      { label: 'Hektolitre (hL)', value: formatNum(mL / 100000), active: exploreUnit === 'hL' },
      { label: 'Dekalitre (daL)', value: formatNum(mL / 10000), active: exploreUnit === 'daL' },
      { label: 'Litre (L)', value: formatNum(mL / 1000), active: exploreUnit === 'L' },
      { label: 'Desilitre (dL)', value: formatNum(mL / 100), active: exploreUnit === 'dL' },
      { label: 'Santilitre (cL)', value: formatNum(mL / 10), active: exploreUnit === 'cL' },
      { label: 'Mililitre (mL)', value: formatNum(mL), active: exploreUnit === 'mL' }
    ];
  }

  function buildVisualStageHtml() {
    const v = Math.max(0, Number(exploreVal) || 0);
    if (category === 'length') {
      const mmFactor = { km: 1000000, hm: 100000, dam: 10000, m: 1000, dm: 100, cm: 10, mm: 1 }[exploreUnit] || 1;
      const totalMm = v * mmFactor;

      // Determine target sub-unit for visual segments
      let subUnit = 'cm';
      let totalInSub = totalMm / 10; // default in cm
      let choices = [
        { val: 25, label: 'Çeyrek m (25 cm)' },
        { val: 50, label: 'Yarım m (50 cm)' },
        { val: 100, label: 'Tam m (100 cm)' }
      ];

      if (exploreUnit === 'km') {
        subUnit = 'm';
        totalInSub = totalMm / 1000; // in m
        choices = [
          { val: 250, label: 'Çeyrek km (250 m)' },
          { val: 500, label: 'Yarım km (500 m)' },
          { val: 1000, label: 'Tam km (1000 m)' }
        ];
      } else if (exploreUnit === 'cm' || exploreUnit === 'mm' || exploreUnit === 'dm') {
        subUnit = 'mm';
        totalInSub = totalMm; // in mm
        choices = [
          { val: 5, label: 'Yarım cm (5 mm)' },
          { val: 10, label: '1 cm (10 mm)' },
          { val: 100, label: '1 dm (100 mm)' }
        ];
      }

      if (!choices.some(c => c.val === lengthPieceMode)) {
        lengthPieceMode = choices[1].val;
      }

      const pieceVal = lengthPieceMode;
      const pieceLabel = `${pieceVal} ${subUnit}`;
      const wholeCount = Math.floor(totalInSub / pieceVal);
      const remainder = Number((totalInSub - wholeCount * pieceVal).toFixed(2));
      const maxShown = Math.min(wholeCount, 12);

      let segsHtml = '';
      for (let i = 0; i < maxShown; i++) {
        segsHtml += `<div class="meas-ruler-seg"><span>${pieceLabel}</span></div>`;
      }
      if (wholeCount > 12) {
        segsHtml += `<div class="meas-weight-more">+${wholeCount - 12} parça daha</div>`;
      }
      if (remainder > 0) {
        segsHtml += `<div class="meas-ruler-seg rem"><span>+${formatNum(remainder)} ${subUnit}</span></div>`;
      }
      if (wholeCount === 0 && remainder === 0) {
        segsHtml = `<span class="meas-empty-pan">0 ${subUnit}</span>`;
      }

      const summaryFormula = wholeCount > 0
        ? `${wholeCount} tane <b>${pieceLabel}</b>${remainder > 0 ? ` + ${formatNum(remainder)} ${subUnit}` : ''} = <b>${formatNum(totalInSub)} ${subUnit}</b>`
        : `<b>${formatNum(totalInSub)} ${subUnit}</b>`;

      return `
        <div class="meas-vis-card">
          <div class="meas-scale-header">
            <div class="meas-vis-title" style="margin-bottom:0;">📏 Eşdeğer Uzunluk Şeridi &amp; Parçaları</div>
            <div class="meas-piece-selector">
              <span>Cetvel Parçaları:</span>
              ${choices.map(c => `
                <button class="btn-preset-chip ${lengthPieceMode === c.val ? 'active-chip' : ''}" onclick="MEAS.setLengthPiece(${c.val})">${c.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="meas-length-compare">
            <div class="meas-length-main-bar">
              <span>Toplam Uzunluk: <b>${formatNum(v)} ${exploreUnit}</b> (${formatNum(totalInSub)} ${subUnit})</span>
            </div>
            <div class="meas-length-segs-wrap">
              ${segsHtml}
            </div>
          </div>

          <div class="meas-vis-note" style="margin-top: 12px;">
            🎯 <b>${formatNum(v)} ${exploreUnit}</b> uzunluğu uç uca eklenen ${summaryFormula} eder!
          </div>
        </div>
      `;
    }

    if (category === 'weight') {
      const gFactor = { t: 1000000, kg: 1000, hg: 100, dag: 10, g: 1, dg: 0.1, cg: 0.01, mg: 0.001 }[exploreUnit] || 1;
      const totalGrams = v * gFactor;

      let pieceVal = weightPieceMode; // 250, 500, 1000
      let pieceLabel = `${pieceVal} g`;
      let totalInPieceUnit = totalGrams;

      if (exploreUnit === 't') {
        pieceLabel = `${pieceVal} kg`;
        totalInPieceUnit = v * 1000;
      } else if (totalGrams < 250 && totalGrams > 0) {
        pieceVal = totalGrams >= 100 ? 50 : totalGrams >= 10 ? 10 : 1;
        pieceLabel = `${pieceVal} g`;
      }

      const exactCount = pieceVal > 0 ? totalInPieceUnit / pieceVal : 0;
      const wholeCount = Math.floor(exactCount);
      const remainder = Number((totalInPieceUnit - wholeCount * pieceVal).toFixed(2));
      const maxShown = Math.min(wholeCount, 12);

      let blocksHtml = '';
      for (let i = 0; i < maxShown; i++) {
        blocksHtml += `
          <div class="meas-weight-stone small">
            <div class="stone-knob"></div>
            <span>${pieceLabel}</span>
          </div>
        `;
      }
      if (wholeCount > 12) {
        blocksHtml += `<div class="meas-weight-more">+${wholeCount - 12} adet daha</div>`;
      }
      if (remainder > 0) {
        const remUnit = exploreUnit === 't' ? 'kg' : 'g';
        blocksHtml += `
          <div class="meas-weight-stone rem">
            <div class="stone-knob"></div>
            <span>+${formatNum(remainder)} ${remUnit}</span>
          </div>
        `;
      }
      if (wholeCount === 0 && remainder === 0) {
        blocksHtml = `<span class="meas-empty-pan">0 g</span>`;
      }

      const unitNameRight = exploreUnit === 't' ? 'kg' : 'g';
      const summaryFormula = wholeCount > 0
        ? `${wholeCount} tane <b>${pieceLabel}</b>${remainder > 0 ? ` + ${formatNum(remainder)} ${unitNameRight}` : ''} = <b>${formatNum(totalInPieceUnit)} ${unitNameRight}</b>`
        : `<b>${formatNum(totalInPieceUnit)} ${unitNameRight}</b>`;

      return `
        <div class="meas-vis-card">
          <div class="meas-scale-header">
            <div class="meas-vis-title" style="margin-bottom:0;">⚖️ Eşit Kollu Denge Terazisi</div>
            <div class="meas-piece-selector">
              <span>Sağ Kefe Taşları:</span>
              <button class="btn-preset-chip ${weightPieceMode === 250 ? 'active-chip' : ''}" onclick="MEAS.setWeightPiece(250)">Çeyrek (${exploreUnit === 't' ? '250 kg' : '250 g'})</button>
              <button class="btn-preset-chip ${weightPieceMode === 500 ? 'active-chip' : ''}" onclick="MEAS.setWeightPiece(500)">Yarım (${exploreUnit === 't' ? '500 kg' : '500 g'})</button>
              <button class="btn-preset-chip ${weightPieceMode === 1000 ? 'active-chip' : ''}" onclick="MEAS.setWeightPiece(1000)">Tam (${exploreUnit === 't' ? '1000 kg' : '1000 g'})</button>
            </div>
          </div>

          <div class="meas-balance-stage">
            <div class="meas-balance-pans">
              <!-- SOL KEFE -->
              <div class="meas-pan-col">
                <div class="meas-pan-title">Sol Kefe (Seçilen Yük)</div>
                <div class="meas-pan-weights">
                  <div class="meas-weight-stone big">
                    <div class="stone-knob"></div>
                    <span>${formatNum(v)} ${exploreUnit}</span>
                  </div>
                </div>
                <div class="meas-pan-plate"></div>
                <div class="meas-pan-stem"></div>
              </div>

              <!-- ORTA DENGE İBRESİ -->
              <div class="meas-fulcrum-col">
                <div class="meas-eq-badge">=</div>
                <div class="meas-fulcrum-triangle">▲</div>
                <div class="meas-fulcrum-label">DENGEDE</div>
              </div>

              <!-- SAĞ KEFE -->
              <div class="meas-pan-col">
                <div class="meas-pan-title">Sağ Kefe (Eşdeğer Ağırlıklar)</div>
                <div class="meas-pan-weights">
                  ${blocksHtml}
                </div>
                <div class="meas-pan-plate"></div>
                <div class="meas-pan-stem"></div>
              </div>
            </div>
            <div class="meas-balance-beam-bar"></div>
            <div class="meas-balance-base"></div>
          </div>

          <div class="meas-vis-note" style="margin-top: 12px;">
            🎯 Sol kefedeki <b>${formatNum(v)} ${exploreUnit}</b> yükü dengelemek için sağ kefeye ${summaryFormula} koyduk!
          </div>
        </div>
      `;
    }

    // liquid
    const mlFactor = { kL: 1000000, hL: 100000, daL: 10000, L: 1000, dL: 100, cL: 10, mL: 1 }[exploreUnit] || 1;
    const mL = v * mlFactor;
    const pct = Math.min(100, Math.max(8, (mL / 2000) * 100));

    const pieceVal = liquidPieceMode; // 250, 500, 1000 mL
    const pieceLabel = `${pieceVal} mL`;
    const wholeCount = Math.floor(mL / pieceVal);
    const remainder = Number((mL - wholeCount * pieceVal).toFixed(2));
    const maxShown = Math.min(wholeCount, 12);

    let cupsHtml = '';
    for (let i = 0; i < maxShown; i++) {
      cupsHtml += `
        <div class="meas-cup-block">
          <div class="meas-cup-water"></div>
          <span>${pieceLabel}</span>
        </div>
      `;
    }
    if (wholeCount > 12) {
      cupsHtml += `<div class="meas-weight-more">+${wholeCount - 12} kap daha</div>`;
    }
    if (remainder > 0) {
      cupsHtml += `
        <div class="meas-cup-block rem">
          <div class="meas-cup-water"></div>
          <span>+${formatNum(remainder)} mL</span>
        </div>
      `;
    }
    if (wholeCount === 0 && remainder === 0) {
      cupsHtml = `<span class="meas-empty-pan">0 mL</span>`;
    }

    const summaryLiquid = wholeCount > 0
      ? `${wholeCount} tane <b>${pieceLabel}</b>${remainder > 0 ? ` + ${formatNum(remainder)} mL` : ''} = <b>${formatNum(mL)} mL</b>`
      : `<b>${formatNum(mL)} mL</b>`;

    return `
      <div class="meas-vis-card">
        <div class="meas-scale-header">
          <div class="meas-vis-title" style="margin-bottom:0;">🫗 Dereceli Sürahi &amp; Eşdeğer Kaplar</div>
          <div class="meas-piece-selector">
            <span>Ölçek Kapları:</span>
            <button class="btn-preset-chip ${liquidPieceMode === 250 ? 'active-chip' : ''}" onclick="MEAS.setLiquidPiece(250)">Çeyrek L (250 mL)</button>
            <button class="btn-preset-chip ${liquidPieceMode === 500 ? 'active-chip' : ''}" onclick="MEAS.setLiquidPiece(500)">Yarım L (500 mL)</button>
            <button class="btn-preset-chip ${liquidPieceMode === 1000 ? 'active-chip' : ''}" onclick="MEAS.setLiquidPiece(1000)">Tam L (1000 mL)</button>
          </div>
        </div>

        <div class="meas-jug-layout">
          <div class="meas-pan-col">
            <div class="meas-pan-title">Seçilen Toplam Sıvı (${formatNum(v)} ${exploreUnit})</div>
            <div class="meas-jug">
              <div class="meas-jug-liquid" style="height:${pct.toFixed(1)}%;"></div>
              <div class="meas-jug-marks">
                <span>2 L</span><span>1,5 L</span><span>1 L</span><span>500 mL</span>
              </div>
            </div>
          </div>

          <div class="meas-eq-badge">=</div>

          <div class="meas-pan-col" style="flex: 1; max-width: 420px;">
            <div class="meas-pan-title">Eşdeğer Ölçek Kapları (${pieceLabel})</div>
            <div class="meas-pan-weights">
              ${cupsHtml}
            </div>
          </div>
        </div>

        <div class="meas-vis-note" style="margin-top: 12px;">
          🎯 <b>${formatNum(v)} ${exploreUnit}</b> sıvı, tam olarak ${summaryLiquid} doldurur!
        </div>
      </div>
    `;
  }

  function renderExplore() {
    const meta = UNIT_META[category];
    const presetRow = document.getElementById('measPresetRow');
    const unitSel = document.getElementById('measUnitSelect');
    const valInput = document.getElementById('measValInput');
    const ladderEl = document.getElementById('measLadderBox');
    const convGrid = document.getElementById('measConvGrid');
    const visStage = document.getElementById('measVisualStage');
    const unitCards = document.getElementById('measUnitCards');

    if (presetRow) {
      presetRow.innerHTML = meta.presets.map((p, idx) =>
        `<button class="btn-preset-chip" onclick="MEAS.applyPreset(${idx})">${p.label}</button>`
      ).join('');
    }

    if (unitSel) {
      unitSel.innerHTML = meta.units.map(u =>
        `<option value="${u.id}" ${u.id === exploreUnit ? 'selected' : ''}>${u.name}</option>`
      ).join('');
    }

    if (valInput && Number(valInput.value) !== exploreVal) {
      valInput.value = exploreVal;
    }

    if (ladderEl) {
      ladderEl.innerHTML = meta.ladder.map((step, i) => `
        <div class="meas-ladder-step">
          <span class="meas-ladder-unit">${step.u}</span>
          <span class="meas-ladder-mult">${step.mult}</span>
        </div>
      `).join('');
    }

    if (convGrid) {
      const rows = computeConversions();
      convGrid.innerHTML = rows.map(r => `
        <div class="meas-conv-card ${r.active ? 'active' : ''}">
          <div class="meas-conv-label">${r.label}</div>
          <div class="meas-conv-val">${r.value}</div>
        </div>
      `).join('');
    }

    if (visStage) {
      visStage.innerHTML = buildVisualStageHtml();
    }

    if (unitCards) {
      unitCards.innerHTML = meta.units.map(u => `
        <div class="meas-info-chip">
          <strong>${u.name}</strong>
          <span>${u.desc}</span>
        </div>
      `).join('');
    }
  }

  function buildQuestion() {
    const rInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    if (category === 'length') {
      const kind = rInt(0, 4);
      if (kind === 0) {
        const m = rInt(2, 12);
        const ans = m * 100;
        return {
          prompt: `${m} metre (m) kaç santimetre (cm) eder?`,
          options: shuffleOptions(ans, [m * 10, m * 1000, ans + 50]),
          ans: String(ans),
          hint: '1 metre = 100 santimetre! Merdivende 2 basamak aşağı in (× 100).'
        };
      }
      if (kind === 1) {
        const dm = rInt(2, 15);
        const ans = dm * 10;
        return {
          prompt: `${dm} desimetre (dm) kaç santimetre (cm) eder?`,
          options: shuffleOptions(ans, [dm * 100, dm + 10, ans + 5]),
          ans: String(ans),
          hint: '1 desimetre (dm) = 10 santimetre (cm)! Merdivende 1 basamak aşağı in (× 10).'
        };
      }
      if (kind === 2) {
        const m = rInt(1, 6);
        const cm = rInt(15, 85);
        const ans = m * 100 + cm;
        return {
          prompt: `${m} m ${cm} cm toplam kaç santimetre (cm) eder?`,
          options: shuffleOptions(ans, [m * 10 + cm, ans + 100, m * 1000 + cm]),
          ans: String(ans),
          hint: `Önce ${m} m = ${m * 100} cm yap, sonra ${cm} cm ekle!`
        };
      }
      if (kind === 3) {
        const km = rInt(2, 9);
        const ans = km * 1000;
        return {
          prompt: `${km} kilometre (km) kaç metre (m) eder?`,
          options: shuffleOptions(ans, [km * 100, km * 10, ans + 500]),
          ans: String(ans),
          hint: '1 kilometre = 1000 metredir (km → hm → dam → m: 3 basamak × 10)!'
        };
      }
      const cm = rInt(3, 18);
      const ans = cm * 10;
      return {
        prompt: `${cm} santimetre (cm) kaç milimetre (mm) eder?`,
        options: shuffleOptions(ans, [cm * 100, cm + 10, ans + 5]),
        ans: String(ans),
        hint: '1 cm = 10 mm! Sayıyı 10 ile çarp.'
      };
    }

    if (category === 'weight') {
      const kind = rInt(0, 3);
      if (kind === 0) {
        const kg = rInt(2, 9);
        const ans = kg * 1000;
        return {
          prompt: `${kg} kilogram (kg) kaç gram (g) eder?`,
          options: shuffleOptions(ans, [kg * 100, kg * 10, ans + 500]),
          ans: String(ans),
          hint: '1 kilogram = 1000 gram! 3 sıfır ekle (× 1000).'
        };
      }
      if (kind === 1) {
        const kg = rInt(1, 5);
        const g = [250, 500, 750, 300][rInt(0, 3)];
        const ans = kg * 1000 + g;
        return {
          prompt: `${kg} kg ${g} g toplam kaç gram (g) eder?`,
          options: shuffleOptions(ans, [kg * 100 + g, ans + 1000, ans - 200]),
          ans: String(ans),
          hint: `${kg} kg = ${kg * 1000} g olur. Üzerine ${g} g ekle!`
        };
      }
      if (kind === 2) {
        const t = rInt(2, 7);
        const ans = t * 1000;
        return {
          prompt: `${t} ton (t) kaç kilogram (kg) eder?`,
          options: shuffleOptions(ans, [t * 100, t * 500, ans + 1000]),
          ans: String(ans),
          hint: '1 ton = 1000 kilogramdır!'
        };
      }
      return {
        prompt: 'Yarım kilogram + Çeyrek kilogram toplam kaç gram eder?',
        options: shuffleOptions(750, [500, 250, 1000]),
        ans: '750',
        hint: 'Yarım kg = 500 g, Çeyrek kg = 250 g. İkisini topla!'
      };
    }

    // liquid
    const kind = rInt(0, 3);
    if (kind === 0) {
      const l = rInt(2, 8);
      const ans = l * 1000;
      return {
        prompt: `${l} litre (L) kaç mililitre (mL) eder?`,
        options: shuffleOptions(ans, [l * 100, l * 500, ans + 500]),
        ans: String(ans),
        hint: '1 Litre = 1000 mililitredir!'
      };
    }
    if (kind === 1) {
      const l = rInt(1, 4);
      const ml = [250, 500, 750][rInt(0, 2)];
      const ans = l * 1000 + ml;
      return {
        prompt: `${l} L ${ml} mL toplam kaç mililitre (mL) eder?`,
        options: shuffleOptions(ans, [l * 100 + ml, ans + 500, ans - 250]),
        ans: String(ans),
        hint: `${l} L = ${l * 1000} mL eder, buna ${ml} mL ekle!`
      };
    }
    if (kind === 2) {
      const l = rInt(1, 3);
      const ans = l * 4;
      return {
        prompt: `${l} litre süt, çeyrek litrelik (250 mL) kaç bardağa doldurulabilir?`,
        options: shuffleOptions(ans, [l * 2, l * 5, ans + 2]),
        ans: String(ans),
        hint: '1 litrede 4 tane çeyrek litre vardır (4 × 250 mL = 1000 mL).'
      };
    }
    const l = rInt(2, 6);
    const ans = l * 2;
    return {
      prompt: `${l} litre su, yarım litrelik (500 mL) kaç şişeyi doldurur?`,
      options: shuffleOptions(ans, [l * 4, l + 2, ans + 1]),
      ans: String(ans),
      hint: '1 litrede 2 tane yarım litre vardır (500 + 500 = 1000 mL).'
    };
  }

  function shuffleOptions(correct, distractors) {
    const set = new Set([String(correct)]);
    for (const d of distractors) {
      if (d > 0 && set.size < 4) set.add(String(d));
    }
    while (set.size < 4) {
      set.add(String(correct + set.size * 50));
    }
    return Array.from(set).sort(() => Math.random() - 0.5);
  }

  function newQuestion() {
    currentQ = buildQuestion();
    const qEl = document.getElementById('measQuizPrompt');
    const optEl = document.getElementById('measQuizOptions');
    const fbEl = document.getElementById('measQuizFeedback');
    const hintEl = document.getElementById('measQuizHint');
    const scoreEl = document.getElementById('measScoreVal');

    if (qEl) qEl.textContent = currentQ.prompt;
    if (scoreEl) scoreEl.textContent = score;
    if (hintEl) {
      hintEl.textContent = `💡 ${currentQ.hint}`;
      hintEl.style.display = 'none';
    }
    if (fbEl) {
      fbEl.textContent = 'Doğru seçeneğe tıkla!';
      fbEl.className = 'meas-quiz-feedback';
    }
    if (optEl) {
      optEl.innerHTML = currentQ.options.map(opt => `
        <button class="meas-opt-btn" onclick="MEAS.answer('${opt}')">${Number(opt).toLocaleString('tr-TR')}</button>
      `).join('');
    }
  }

  window.initMeasurementsPage = function () {
    if (!initialized) {
      initialized = true;
      renderExplore();
      newQuestion();
    }
  };

  window.MEAS = {
    setCategory(cat) {
      playTone(540);
      category = cat;
      exploreUnit = cat === 'length' ? 'm' : cat === 'weight' ? 'kg' : 'L';
      exploreVal = 2;

      document.querySelectorAll('#viewMeasurements .meas-cat-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('measCat_' + cat);
      if (activeBtn) activeBtn.classList.add('active');

      renderExplore();
      newQuestion();
    },
    setWeightPiece(val) {
      playTone(560);
      weightPieceMode = val;
      renderExplore();
    },
    setLiquidPiece(val) {
      playTone(560);
      liquidPieceMode = val;
      renderExplore();
    },
    setLengthPiece(val) {
      playTone(560);
      lengthPieceMode = val;
      renderExplore();
    },
    applyPreset(idx) {
      playTone(580);
      const p = UNIT_META[category].presets[idx];
      if (!p) return;
      exploreVal = p.val;
      exploreUnit = p.unit;
      const valInput = document.getElementById('measValInput');
      if (valInput) valInput.value = exploreVal;
      renderExplore();
    },
    onInputChange() {
      const valInput = document.getElementById('measValInput');
      const unitSel = document.getElementById('measUnitSelect');
      if (valInput) exploreVal = Math.max(0, parseFloat(valInput.value) || 0);
      if (unitSel) exploreUnit = unitSel.value;
      renderExplore();
    },
    toggleHint() {
      playTone(500);
      const hintEl = document.getElementById('measQuizHint');
      if (hintEl) {
        hintEl.style.display = hintEl.style.display === 'none' ? 'block' : 'none';
      }
    },
    answer(chosen) {
      if (!currentQ) return;
      const fbEl = document.getElementById('measQuizFeedback');
      const scoreEl = document.getElementById('measScoreVal');
      if (chosen === currentQ.ans) {
        playTone(760);
        score++;
        if (scoreEl) scoreEl.textContent = score;
        if (window.confetti) window.confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
        if (fbEl) {
          fbEl.textContent = `🎉 Harika! Doğru cevap: ${Number(currentQ.ans).toLocaleString('tr-TR')}!`;
          fbEl.className = 'meas-quiz-feedback success';
        }
        setTimeout(newQuestion, 1400);
      } else {
        playTone(250);
        if (fbEl) {
          fbEl.textContent = `🤔 Tam değil, ipucunu açıp tekrar dene!`;
          fbEl.className = 'meas-quiz-feedback warn';
        }
        const hintEl = document.getElementById('measQuizHint');
        if (hintEl) hintEl.style.display = 'block';
      }
    },
    newQuestion
  };
})();
