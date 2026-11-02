// SAARTI website. Source: _build/src/main.js, copied to assets/js/main.js by build-site.js.
// Pages work without this script: menus fall back to the footer links, every tab panel and
// FAQ answer is in the HTML.
(() => {
  // ── Mobile menu ──────────────────────────────────────────────────────────────
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.burger');
  if (nav && burger) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    burger.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.querySelectorAll('.links a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => { if (!e.target.closest('.nav')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); burger.focus(); }
    });
    matchMedia('(min-width:981px)').addEventListener('change', () => setOpen(false));
  }

  // ── Features carousel arrows ────────────────────────────────────────────────
  const rail = document.getElementById('rail');
  if (rail) {
    const arrows = [...document.querySelectorAll('.arrow')];
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      arrows.forEach((b) => { b.disabled = Number(b.dataset.dir) < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max; });
    };
    arrows.forEach((b) => b.addEventListener('click', () => {
      const card = rail.querySelector('.svc');
      const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      rail.scrollBy({ left: (card.offsetWidth + gap) * Number(b.dataset.dir), behavior: 'smooth' });
    }));
    rail.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // ── Tabs (CIBIL steps, FAQ categories): buttons with role="tab" and aria-controls ──
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t, false));
      t.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
    select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0], false);
  });

  // ── FAQ page: category filter, and open the question named in the address (#...) ──
  const filter = document.querySelector('[data-faq-filter]');
  if (filter) {
    const buttons = [...filter.querySelectorAll('button')];
    const items = [...document.querySelectorAll('.faq-list details')];
    const show = (cat) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
      items.forEach((d) => { d.hidden = cat !== 'all' && d.dataset.cat !== cat; });
    };
    buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.cat)));
    const openFromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = id && document.getElementById(id);
      if (!target || target.tagName !== 'DETAILS') return;
      show('all');
      target.open = true;
      target.scrollIntoView({ block: 'start' });
      target.querySelector('summary').focus({ preventScroll: true });
    };
    show('all');
    openFromHash();
    addEventListener('hashchange', openFromHash);
  }

  // ── Legal pages: highlight the current heading in "On this page" ──────────────
  const tocLinks = [...document.querySelectorAll('.toc a')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.remove('on'));
        byId.get(e.target.id)?.classList.add('on');
      });
    }, { rootMargin: '-90px 0px -70% 0px' });
    byId.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }
})();
