/**
 * Portal Ana Yöneticisi (Tab Switcher & Sidebar Kontrolü)
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabBtnPlanner = document.getElementById('tabBtnPlanner');
  const tabBtnMath = document.getElementById('tabBtnMath');
  const tabBtnClock = document.getElementById('tabBtnClock');

  const viewPlanner = document.getElementById('viewPlanner');
  const viewMath = document.getElementById('viewMath');
  const viewClock = document.getElementById('viewClock');

  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const portalSidebar = document.getElementById('portalSidebar');
  const mobilePortalTitle = document.getElementById('mobilePortalTitle');

  function switchTab(viewName) {
    // Reset all tabs
    if (tabBtnPlanner) tabBtnPlanner.classList.remove('active');
    if (tabBtnMath) tabBtnMath.classList.remove('active');
    if (tabBtnClock) tabBtnClock.classList.remove('active');

    if (viewPlanner) viewPlanner.classList.remove('active');
    if (viewMath) viewMath.classList.remove('active');
    if (viewClock) viewClock.classList.remove('active');

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
