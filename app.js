/**
 * Portal Ana Yöneticisi (Tab Switcher & Sidebar Kontrolü)
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabBtnPlanner = document.getElementById('tabBtnPlanner');
  const tabBtnMath = document.getElementById('tabBtnMath');
  const tabBtnClock = document.getElementById('tabBtnClock');
  const tabBtnMultiplication = document.getElementById('tabBtnMultiplication');
  const tabBtnAreaMult = document.getElementById('tabBtnAreaMult');

  const viewPlanner = document.getElementById('viewPlanner');
  const viewMath = document.getElementById('viewMath');
  const viewClock = document.getElementById('viewClock');
  const viewMultiplication = document.getElementById('viewMultiplication');
  const viewAreaMultiplication = document.getElementById('viewAreaMultiplication');

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

    if (viewPlanner) viewPlanner.classList.remove('active');
    if (viewMath) viewMath.classList.remove('active');
    if (viewClock) viewClock.classList.remove('active');
    if (viewMultiplication) viewMultiplication.classList.remove('active');
    if (viewAreaMultiplication) viewAreaMultiplication.classList.remove('active');

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
