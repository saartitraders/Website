const menu = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav-links');
function closeMenu() { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); }
if (menu && nav) {
 menu.addEventListener('click', () => { const opened = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(opened)); });
 nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
 document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
 document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
 matchMedia('(min-width:901px)').addEventListener('change', closeMenu);
}
const dialog = document.querySelector('.screen-dialog');
if (dialog) {
 let opener;
 document.querySelectorAll('.screen-button').forEach(button => button.addEventListener('click', () => {
  opener = button;
  const device = button.querySelector('.device').cloneNode(true);
  device.querySelector('img').loading = 'eager';
  dialog.querySelector('.dialog-screen').replaceChildren(device);
  dialog.showModal(); document.body.style.overflow = 'hidden';
 }));
 dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => { if (event.target === dialog) { const b = dialog.getBoundingClientRect(); if(event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close(); } });
 dialog.addEventListener('close', () => { document.body.style.overflow = ''; opener?.focus(); });
}
document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });
