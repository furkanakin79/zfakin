/**
 * Portal Ana Yöneticisi (Tab Switcher & Sidebar Kontrolü)
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabBtnPlanner = document.getElementById('tabBtnPlanner');
  const tabBtnMath = document.getElementById('tabBtnMath');
  const tabBtnClock = document.getElementById('tabBtnClock');
  const tabBtnMultiplication = document.getElementById('tabBtnMultiplication');
  const tabBtnAreaMult = document.getElementById('tabBtnAreaMult');
  const tabBtnSayiAvcilari = document.getElementById('tabBtnSayiAvcilari');
  const tabBtnFractions = document.getElementById('tabBtnFractions');
  const tabBtnBarModel = document.getElementById('tabBtnBarModel');
  const tabBtnGeometry = document.getElementById('tabBtnGeometry');

  const viewPlanner = document.getElementById('viewPlanner');
  const viewMath = document.getElementById('viewMath');
  const viewClock = document.getElementById('viewClock');
  const viewMultiplication = document.getElementById('viewMultiplication');
  const viewAreaMultiplication = document.getElementById('viewAreaMultiplication');
  const viewSayiAvcilari = document.getElementById('viewSayiAvcilari');
  const viewFractions = document.getElementById('viewFractions');
  const viewBarModel = document.getElementById('viewBarModel');
  const viewGeometry = document.getElementById('viewGeometry');

  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const portalSidebar = document.getElementById('portalSidebar');
  const mobilePortalTitle = document.getElementById('mobilePortalTitle');

  function switchTab(viewName) {
    // Reset all tabs
    if (tabBtnPlanner) tabBtnPlanner.classList.remove('active');
    if (tabBtnMath) tabBtnMath.classList.remove('active');
    if (tabBtnClock) tabBtnClock.classList.remove('active');
    if (tabBtnMultiplication) tabBtnMultiplication.classList.remove('active');
    if (tabBtnAreaMult) tabBtnAreaMult.classList.remove('active');
    if (tabBtnSayiAvcilari) tabBtnSayiAvcilari.classList.remove('active');
    if (tabBtnFractions) tabBtnFractions.classList.remove('active');
    if (tabBtnBarModel) tabBtnBarModel.classList.remove('active');
    if (tabBtnGeometry) tabBtnGeometry.classList.remove('active');

    if (viewPlanner) viewPlanner.classList.remove('active');
    if (viewMath) viewMath.classList.remove('active');
    if (viewClock) viewClock.classList.remove('active');
    if (viewMultiplication) viewMultiplication.classList.remove('active');
    if (viewAreaMultiplication) viewAreaMultiplication.classList.remove('active');
    if (viewSayiAvcilari) viewSayiAvcilari.classList.remove('active');
    if (viewFractions) viewFractions.classList.remove('active');
    if (viewBarModel) viewBarModel.classList.remove('active');
    if (viewGeometry) viewGeometry.classList.remove('active');

    if (viewName === 'planner') {
      if (tabBtnPlanner) tabBtnPlanner.classList.add('active');
      if (viewPlanner) viewPlanner.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '📅 Çalışma Planı';
      
      // Lucide ikonlarını yenile
      if (window.lucide) {
        window.lucide.createIcons();
      }
    } else if (viewName === 'math') {
      if (tabBtnMath) tabBtnMath.classList.add('active');
      if (viewMath) viewMath.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '🦄 Dört İşlem';
    } else if (viewName === 'clock') {
      if (tabBtnClock) tabBtnClock.classList.add('active');
      if (viewClock) viewClock.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '⏰ Saat Çalışması';

      // Saati yeniden çiz
      if (window.drawClock) {
        window.drawClock();
      }
    } else if (viewName === 'multiplication') {
      if (tabBtnMultiplication) tabBtnMultiplication.classList.add('active');
      if (viewMultiplication) viewMultiplication.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '🌟 Çarpım Tablosu';

      if (window.initMultiplicationPage) {
        window.initMultiplicationPage();
      }
    } else if (viewName === 'area-multiplication') {
      if (tabBtnAreaMult) tabBtnAreaMult.classList.add('active');
      if (viewAreaMultiplication) viewAreaMultiplication.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '🧩 Çarpma (Alan Modeli)';

      if (window.initAreaMultiplicationPage) {
        window.initAreaMultiplicationPage();
      }
    } else if (viewName === 'sayi-avcilari') {
      if (tabBtnSayiAvcilari) tabBtnSayiAvcilari.classList.add('active');
      if (viewSayiAvcilari) viewSayiAvcilari.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '⚡ Sayı Avcıları';

      if (window.initSayiAvcilariPage) {
        window.initSayiAvcilariPage();
      }
    } else if (viewName === 'fractions') {
      if (tabBtnFractions) tabBtnFractions.classList.add('active');
      if (viewFractions) viewFractions.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '🍕 Kesirler';

      if (window.initFractionsPage) {
        window.initFractionsPage();
      }
    } else if (viewName === 'bar-model') {
      if (tabBtnBarModel) tabBtnBarModel.classList.add('active');
      if (viewBarModel) viewBarModel.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '📖 Problem Barı';

      if (window.initBarModelPage) {
        window.initBarModelPage();
      }
    } else if (viewName === 'geometry') {
      if (tabBtnGeometry) tabBtnGeometry.classList.add('active');
      if (viewGeometry) viewGeometry.classList.add('active');
      if (mobilePortalTitle) mobilePortalTitle.textContent = '📏 Alan & Yuvarlama';

      if (window.initGeometryPage) {
        window.initGeometryPage();
      }
    }

    // Mobilde/Tablette tıklandıktan sonra sol menüyü kapat
    if (portalSidebar && portalSidebar.classList.contains('open')) {
      portalSidebar.classList.remove('open');
    }
  }

  if (tabBtnPlanner) {
    tabBtnPlanner.addEventListener('click', () => switchTab('planner'));
  }

  if (tabBtnMath) {
    tabBtnMath.addEventListener('click', () => switchTab('math'));
  }

  if (tabBtnClock) {
    tabBtnClock.addEventListener('click', () => switchTab('clock'));
  }

  if (tabBtnMultiplication) {
    tabBtnMultiplication.addEventListener('click', () => switchTab('multiplication'));
  }

  if (tabBtnAreaMult) {
    tabBtnAreaMult.addEventListener('click', () => switchTab('area-multiplication'));
  }

  if (tabBtnSayiAvcilari) {
    tabBtnSayiAvcilari.addEventListener('click', () => switchTab('sayi-avcilari'));
  }

  if (tabBtnFractions) {
    tabBtnFractions.addEventListener('click', () => switchTab('fractions'));
  }

  if (tabBtnBarModel) {
    tabBtnBarModel.addEventListener('click', () => switchTab('bar-model'));
  }

  if (tabBtnGeometry) {
    tabBtnGeometry.addEventListener('click', () => switchTab('geometry'));
  }

  if (sidebarToggleBtn && portalSidebar) {
    sidebarToggleBtn.addEventListener('click', () => {
      portalSidebar.classList.toggle('open');
    });
  }

  // Lucide ikonlarını ilk yüklemede oluştur
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
