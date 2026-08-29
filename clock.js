/**
 * Saat Çalışması & Kapsamlı Saat Öğrenme Kiti Motoru
 */

(function () {
  let canvas, ctx;
  const radius = 135;
  let currentTime = new Date();
  currentTime.setHours(0, 0, 0);

  let targetQuizTime = null;

  function initClock() {
    canvas = document.getElementById("clockCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    // Reset transform & translate to center (200, 200)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(200, 200);

    drawClock();
  }

  function drawClock() {
    if (!canvas || !ctx) {
      canvas = document.getElementById("clockCanvas");
      if (!canvas) return;
      ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(200, 200);
    }

    ctx.clearRect(-200, -200, 400, 400);

    drawFace(ctx, radius);
    drawNumbers(ctx, radius);
    drawTime(ctx, radius);

    updateDigitalText();
    updateSpelledTimeIfVisible();
  }

  function drawFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#7b1fa2';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Dış ince çember
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.98, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Merkez noktası
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.07, 0, 2 * Math.PI);
    ctx.fillStyle = '#4a148c';
    ctx.fill();
  }

  function drawNumbers(ctx, radius) {
    const chkAllHours = document.getElementById("chkAllHours")?.checked;
    const chkMinutes = document.getElementById("chkMinutes")?.checked;
    const chk24Hours = document.getElementById("chk24Hours")?.checked;

    let ang;

    ctx.font = "bold " + radius * 0.20 + "px 'Nunito', 'Bubblegum Sans', sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = '#e11d48';

    for (let num = 1; num <= 12; num++) {
      if (!chkAllHours && num % 3 !== 0) continue;

      ang = num * Math.PI / 6;
      ctx.rotate(ang);
      ctx.translate(0, -radius * 0.72);
      ctx.rotate(-ang);
      ctx.fillText(num.toString(), 0, 0);
      ctx.rotate(ang);
      ctx.translate(0, radius * 0.72);
      ctx.rotate(-ang);
    }

    if (chkMinutes) {
      ctx.font = "bold " + radius * 0.12 + "px 'Nunito', Arial, sans-serif";
      ctx.fillStyle = '#0284c7';
      for (let num = 1; num <= 60; num++) {
        if (num % 5 !== 0) continue;
        ang = num * Math.PI / 30;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.90);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.90);
        ctx.rotate(-ang);
      }
    }

    if (chk24Hours) {
      ctx.font = "bold " + radius * 0.13 + "px 'Nunito', sans-serif";
      ctx.fillStyle = '#7e22ce';
      for (let num = 13; num <= 24; num++) {
        let displayNum = num === 24 ? "00" : num.toString();
        ang = num * Math.PI / 6;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 1.20);
        ctx.rotate(-ang);
        ctx.fillText(displayNum, 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 1.20);
        ctx.rotate(-ang);
      }
    }
  }

  function drawTime(ctx, radius) {
    let hour = currentTime.getHours();
    let minute = currentTime.getMinutes();

    let hourPos = (hour % 12 * Math.PI / 6) + (minute * Math.PI / (6 * 60));
    drawHand(ctx, hourPos, radius * 0.55, 7, '#e11d48'); // Akrep (Kırmızı/Pembe)

    let minutePos = (minute * Math.PI / 30);
    drawHand(ctx, minutePos, radius * 0.85, 4, '#0284c7'); // Yelkovan (Mavi)
  }

  function drawHand(ctx, pos, length, width, color) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
  }

  function addMinutes(mins) {
    currentTime.setMinutes(currentTime.getMinutes() + mins);
    drawClock();
    updateQuestionInput();
  }

  function addHours(hrs) {
    currentTime.setHours(currentTime.getHours() + hrs);
    drawClock();
    updateQuestionInput();
  }

  function updateDigitalText() {
    let h = currentTime.getHours().toString().padStart(2, '0');
    let m = currentTime.getMinutes().toString().padStart(2, '0');
    const disp = document.getElementById('digitalDisplay');
    if (disp) disp.innerText = h + ":" + m;
  }

  function toggleDigital() {
    const display = document.getElementById('digitalDisplay');
    const btn = document.getElementById('btnToggleDigital');
    if (!display || !btn) return;

    if (display.style.visibility === 'visible') {
      display.style.visibility = 'hidden';
      btn.innerText = "Dijital Saati Göster";
      btn.style.backgroundColor = "#3cb371";
    } else {
      display.style.visibility = 'visible';
      btn.innerText = "Dijital Saati Gizle";
      btn.style.backgroundColor = "#ff1493";
    }
  }

  function applyQuestionTime() {
    const timeVal = document.getElementById('questionInput')?.value;
    if (timeVal) {
      const parts = timeVal.split(':');
      currentTime.setHours(parseInt(parts[0], 10));
      currentTime.setMinutes(parseInt(parts[1], 10));

      const digiDisp = document.getElementById('digitalDisplay');
      if (digiDisp) digiDisp.style.visibility = 'hidden';
      const btnDigi = document.getElementById('btnToggleDigital');
      if (btnDigi) {
        btnDigi.innerText = "Dijital Saati Göster";
        btnDigi.style.backgroundColor = "#3cb371";
      }

      const spellDisp = document.getElementById('spelledTimeDisplay');
      if (spellDisp) spellDisp.style.visibility = 'hidden';
      const btnSpell = document.getElementById('btnToggleSpelled');
      if (btnSpell) {
        btnSpell.innerText = "Okunuşu Göster";
        btnSpell.style.backgroundColor = "#3cb371";
      }

      drawClock();
    }
  }

  function updateQuestionInput() {
    let h = currentTime.getHours().toString().padStart(2, '0');
    let m = currentTime.getMinutes().toString().padStart(2, '0');
    const inp = document.getElementById('questionInput');
    if (inp) inp.value = h + ":" + m;
  }

  function toggleSpelledTime() {
    const display = document.getElementById('spelledTimeDisplay');
    const btn = document.getElementById('btnToggleSpelled');
    if (!display || !btn) return;

    if (display.style.visibility === 'visible') {
      display.style.visibility = 'hidden';
      btn.innerText = "Okunuşu Göster";
      btn.style.backgroundColor = "#3cb371";
    } else {
      display.style.visibility = 'visible';
      btn.innerText = "Okunuşu Gizle";
      btn.style.backgroundColor = "#ff1493";
      generateSpelledTimeText();
    }
  }

  function updateSpelledTimeIfVisible() {
    const display = document.getElementById('spelledTimeDisplay');
    if (display && display.style.visibility === 'visible') {
      generateSpelledTimeText();
    }
  }

  function generateSpelledTimeText() {
    let h = currentTime.getHours();
    let m = currentTime.getMinutes();
    let isPM = document.getElementById('chkPM')?.checked;

    let analogH = h % 12;
    let currentHour;
    let nextHour;

    if (isPM) {
      currentHour = analogH === 0 ? 0 : analogH + 12;
      if (currentHour === 23) nextHour = 0;
      else if (currentHour === 0) nextHour = 13;
      else nextHour = currentHour + 1;
    } else {
      currentHour = analogH === 0 ? 12 : analogH;
      if (currentHour === 12) nextHour = 1;
      else nextHour = currentHour + 1;
    }

    const varEkleri = ["'a", "'e", "'ye", "'e", "'e", "'e", "'ya", "'ye", "'e", "'a", "'a", "'e", "'ye", "'e", "'e", "'e", "'ya", "'ye", "'e", "'a", "'ye", "'e", "'ye", "'e"];
    const geciyorEkleri = ["'ı", "'i", "'yi", "'ü", "'ü", "'i", "'yı", "'yi", "'i", "'u", "'u", "'i", "'yi", "'ü", "'ü", "'i", "'yı", "'yi", "'i", "'u", "'yi", "'i", "'yi", "'ü"];

    let timeText = "";

    if (m === 0) {
      if (currentHour === 0) timeText = "Saat tam Gece Yarısı (00:00)";
      else timeText = "Saat tam " + currentHour;
    } else if (m === 30) {
      if (currentHour === 0) timeText = "Gece yarısı buçuk";
      else timeText = "Saat " + currentHour + " buçuk";
    } else if (m === 15) {
      if (currentHour === 0) timeText = "Gece yarısını çeyrek geçiyor";
      else timeText = currentHour + geciyorEkleri[currentHour] + " çeyrek geçiyor";
    } else if (m === 45) {
      if (nextHour === 0) timeText = "Gece yarısına çeyrek var";
      else timeText = nextHour + varEkleri[nextHour] + " çeyrek var";
    } else if (m < 30) {
      if (currentHour === 0) timeText = "Gece yarısını " + m + " geçiyor";
      else timeText = currentHour + geciyorEkleri[currentHour] + " " + m + " geçiyor";
    } else {
      if (nextHour === 0) timeText = "Gece yarısına " + (60 - m) + " var";
      else timeText = nextHour + varEkleri[nextHour] + " " + (60 - m) + " var";
    }

    const disp = document.getElementById('spelledTimeDisplay');
    if (disp) disp.innerText = timeText;
  }

  function generateQuiz() {
    let randomH = Math.floor(Math.random() * 24);
    let randomM = Math.floor(Math.random() * 60);

    targetQuizTime = { hours: randomH, minutes: randomM };

    let displayH = randomH.toString().padStart(2, '0');
    let displayM = randomM.toString().padStart(2, '0');

    const quizDisp = document.getElementById('quizDisplay');
    if (quizDisp) quizDisp.innerText = displayH + ":" + displayM;

    const feedback = document.getElementById('quizFeedback');
    if (feedback) {
      feedback.innerHTML = "Saati ayarla ve <br> <b>Kontrol Et</b>'e bas! ⏳";
      feedback.style.color = "#6b21a8";
    }
    const qInp = document.getElementById('questionInput');
    if (qInp) qInp.style.visibility = 'hidden';
  }

  function checkQuiz() {
    const feedback = document.getElementById('quizFeedback');
    if (!feedback) return;

    if (!targetQuizTime) {
      feedback.innerText = "Önce 'Soru Sor' butonuna basmalısın! 👆";
      feedback.style.color = "#ff8c00";
      return;
    }

    let currentH = currentTime.getHours();
    let currentM = currentTime.getMinutes();

    if (currentH === targetQuizTime.hours && currentM === targetQuizTime.minutes) {
      feedback.innerText = "🎉 TEBRİKLER! Harika iş çıkardın!";
      feedback.style.color = "#16a34a";
      const qInp = document.getElementById('questionInput');
      if (qInp) qInp.style.visibility = 'visible';

      if (window.MiniConfetti) {
        window.MiniConfetti.fire({ particleCount: 50 });
      }
    } else {
      feedback.innerText = "❌ Yanlış oldu. Yelkovan ve Akrebi tekrar kontrol et!";
      feedback.style.color = "#dc143c";
    }
  }

  function resetToZero() {
    currentTime.setHours(0, 0, 0);
    const qInp = document.getElementById('questionInput');
    if (qInp) {
      qInp.style.visibility = 'visible';
      qInp.value = "00:00";
    }

    if (document.getElementById("chkAllHours")) document.getElementById("chkAllHours").checked = false;
    if (document.getElementById("chkMinutes")) document.getElementById("chkMinutes").checked = false;
    if (document.getElementById("chk24Hours")) document.getElementById("chk24Hours").checked = false;
    if (document.getElementById("chkPM")) document.getElementById("chkPM").checked = false;

    const digiDisp = document.getElementById('digitalDisplay');
    if (digiDisp) digiDisp.style.visibility = 'hidden';
    const btnDigi = document.getElementById('btnToggleDigital');
    if (btnDigi) {
      btnDigi.innerText = "Dijital Saati Göster";
      btnDigi.style.backgroundColor = "#3cb371";
    }

    const spellDisp = document.getElementById('spelledTimeDisplay');
    if (spellDisp) spellDisp.style.visibility = 'hidden';
    const btnSpell = document.getElementById('btnToggleSpelled');
    if (btnSpell) {
      btnSpell.innerText = "Okunuşu Göster";
      btnSpell.style.backgroundColor = "#3cb371";
    }

    targetQuizTime = null;
    const quizDisp = document.getElementById('quizDisplay');
    if (quizDisp) quizDisp.innerText = "--:--";
    const feedback = document.getElementById('quizFeedback');
    if (feedback) {
      feedback.innerText = "Soru Sor butonuna basarak başla!";
      feedback.style.color = "#666";
    }

    drawClock();
  }

  // Global exports for inline HTML onclick attributes
  window.drawClock = drawClock;
  window.addMinutes = addMinutes;
  window.addHours = addHours;
  window.toggleDigital = toggleDigital;
  window.applyQuestionTime = applyQuestionTime;
  window.toggleSpelledTime = toggleSpelledTime;
  window.updateSpelledTimeIfVisible = updateSpelledTimeIfVisible;
  window.generateQuiz = generateQuiz;
  window.checkQuiz = checkQuiz;
  window.resetToZero = resetToZero;

  window.addEventListener("DOMContentLoaded", () => {
    initClock();
  });
})();
