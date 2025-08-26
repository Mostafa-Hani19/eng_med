// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Smooth scroll for same-page links
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target instanceof HTMLAnchorElement && target.getAttribute('href')?.startsWith('#')) {
    const id = target.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
      if (mainNav && mainNav.classList.contains('open')) {
        mainNav.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded', 'false');
      }
    }
  }
});

// Lazy loading fallback for older browsers
if (!('loading' in HTMLImageElement.prototype)) {
  const images = document.querySelectorAll('img[loading="lazy"]');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src') || img.getAttribute('src');
        if (src) img.setAttribute('src', src);
        obs.unobserve(img);
      }
    });
  }, { rootMargin: '100px' });
  images.forEach((img) => observer.observe(img));
}

// Set current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Scroll reveal animations
function setupReveal() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  revealEls.forEach((el) => io.observe(el));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupReveal);
} else {
  setupReveal();
}


// Hero: animated lines + dots navigation + autoplay
(function setupHero() {
  const hero = document.querySelector('.hero--showcase');
  if (!hero) return;

  // Split title into lines wrapped in spans for animation
  const title = hero.querySelector('.hero__title');
  if (title && !title.dataset.split) {
    const lines = title.innerHTML.split('<br>');
    title.innerHTML = lines
      .map((line) => `<span>${line}</span>`)
      .join('<br>');
    title.dataset.split = 'true';
  }

  // Trigger line-up animation when hero enters viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        hero.classList.add('hero--animate');
        // Smooth fade-in for subtitle and CTA after lines animate
        setTimeout(() => hero.classList.add('hero--typed'), 1000);
        io.disconnect();
      }
    });
  }, { threshold: 0.3 });
  io.observe(hero);

  // Dots navigation (decorative auto-play scroll positions)
  const dotsContainer = hero.querySelector('.hero__dots');
  if (!dotsContainer) return;

  const sections = ['hero', 'services', 'features', 'about', 'success', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const dots = sections.map((section, idx) => {
    const dot = document.createElement('button');
    dot.className = 'hero__dot' + (idx === 0 ? ' is-active' : '');
    dot.type = 'button';
    dot.addEventListener('click', () => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  // Update active state on scroll
  const activeIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = sections.indexOf(entry.target);
        dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0.01 });
  sections.forEach((s) => activeIo.observe(s));

  // Autoplay between sections
  let current = 0;
  const autoplayMs = 4500;
  function next() {
    current = (current + 1) % sections.length;
    sections[current].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  let timer = setInterval(next, autoplayMs);

  // Pause on user interaction
  ['wheel', 'touchstart', 'keydown', 'mousemove'].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (timer) { clearInterval(timer); timer = null; }
    }, { once: true, passive: true });
  });
  
  // Typing animation for first line of the title
  const firstLineSpan = title?.querySelector('span');
  if (firstLineSpan) {
    const original = firstLineSpan.textContent || '';
    firstLineSpan.textContent = '';
    firstLineSpan.classList.add('hero__title--typing');
    const typingContainer = document.createElement('span');
    typingContainer.className = 'hero__typing-line';
    firstLineSpan.appendChild(typingContainer);
    let i = 0;
    function typeNext() {
      if (i <= original.length) {
        typingContainer.textContent = original.slice(0, i);
        i++;
        requestAnimationFrame(() => setTimeout(typeNext, 45));
      } else {
        // remove caret effect and reveal rest
        firstLineSpan.textContent = original;
        hero.classList.add('hero--typed');
      }
    }
    // Start typing once hero is in view
    const typeIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          typeNext();
          typeIo.disconnect();
        }
      });
    }, { threshold: 0.5 });
    typeIo.observe(hero);
  }
})();

// Services buttons control (prev/next) with RTL-aware logic
(function servicesButtons() {
  const wrapper = document.querySelector('.services-scroller');
  const list = document.querySelector('.services-list');
  if (!wrapper || !list) return;
  const prev = wrapper.querySelector('.services-btn--prev');
  const next = wrapper.querySelector('.services-btn--next');
  const isRTL = (document.documentElement.dir || document.body.dir || 'rtl').toLowerCase() === 'rtl';

  // Compute dynamic step based on card width + gap
  function getStep() {
    const first = list.querySelector(':scope > *');
    if (!first) return 320;
    const rect = first.getBoundingClientRect();
    // Add grid gap (approx 16)
    return Math.round(rect.width + 16);
  }

  function max() { return Math.max(0, list.scrollWidth - list.clientWidth); }
  function clamp(x, min, mx) { return Math.max(min, Math.min(mx, x)); }

  // Cross‑browser logical scrollLeft for RTL
  function getLogicalScrollLeft() {
    const m = max();
    const raw = list.scrollLeft;
    if (!isRTL) return raw;
    if (raw < 0) return -raw; // Chrome/WebKit
    return m - raw; // Firefox
  }
  function setLogicalScrollLeft(value) {
    const m = max();
    const v = clamp(value, 0, m);
    if (!isRTL) { list.scrollTo({ left: v, behavior: 'smooth' }); return; }
    const raw = list.scrollLeft;
    const native = raw < 0 ? -v : m - v;
    list.scrollTo({ left: native, behavior: 'smooth' });
  }

  function update() {
    const m = max();
    const pos = clamp(getLogicalScrollLeft(), 0, m);
    if (prev) prev.disabled = pos <= 0;
    if (next) next.disabled = pos >= m - 1;
  }
  update();

  prev?.addEventListener('click', () => {
    // prev: move backward in logical space
    const step = getStep();
    setLogicalScrollLeft(getLogicalScrollLeft() - step);
    setTimeout(update, 350);
  });
  next?.addEventListener('click', () => {
    // next: move forward in logical space
    const step = getStep();
    setLogicalScrollLeft(getLogicalScrollLeft() + step);
    setTimeout(update, 350);
  });

  list.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => setTimeout(update, 100), { passive: true });
})();

// Contact form is now handled by FormSubmit directly

// Success stories slider controls (RTL aware)
(function storiesButtons() {
  const wrap = document.querySelector('.stories-scroller');
  const list = document.querySelector('.stories-list');
  if (!wrap || !list) return;
  const prev = wrap.querySelector('.stories-btn--prev');
  const next = wrap.querySelector('.stories-btn--next');
  const isRTL = (document.documentElement.dir || document.body.dir || 'rtl').toLowerCase() === 'rtl';

  function getStep() {
    const first = list.querySelector(':scope > *');
    if (!first) return 320;
    const rect = first.getBoundingClientRect();
    return Math.round(rect.width + 16);
  }
  function max() { return Math.max(0, list.scrollWidth - list.clientWidth); }
  function clamp(x, min, mx) { return Math.max(min, Math.min(mx, x)); }
  function getLogical() {
    const m = max();
    const raw = list.scrollLeft;
    if (!isRTL) return raw;
    if (raw < 0) return -raw; // Chrome
    return m - raw; // Firefox
  }
  function setLogical(v) {
    const m = max();
    const val = clamp(v, 0, m);
    if (!isRTL) { list.scrollTo({ left: val, behavior: 'smooth' }); return; }
    const raw = list.scrollLeft;
    const native = raw < 0 ? -val : m - val;
    list.scrollTo({ left: native, behavior: 'smooth' });
  }
  function update() {
    const m = max();
    const pos = clamp(getLogical(), 0, m);
    if (prev) prev.disabled = pos <= 0;
    if (next) next.disabled = pos >= m - 1;
  }
  update();

  prev?.addEventListener('click', () => {
    const step = getStep();
    const m = max();
    const nextPos = getLogical() - step;
    setLogical(nextPos < 0 ? m : nextPos);
    setTimeout(update, 350);
  });
  next?.addEventListener('click', () => {
    const step = getStep();
    const m = max();
    const nextPos = getLogical() + step;
    setLogical(nextPos > m ? 0 : nextPos);
    setTimeout(update, 350);
  });

  list.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => setTimeout(update, 100), { passive: true });
})();


