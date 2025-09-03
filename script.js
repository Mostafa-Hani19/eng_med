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

// تحسين تجربة الفيديو
function setupVideoEnhancements() {
  const heroVideo = document.querySelector('.hero__video');
  if (!heroVideo) return;

  // إضافة تأثير التحميل
  heroVideo.addEventListener('loadeddata', () => {
    heroVideo.classList.add('loaded');
  });

  // تحسين التفاعل مع الفيديو: عند النقر شغّل بالصوت فوراً
  heroVideo.addEventListener('click', () => {
    if (heroVideo.paused) {
      heroVideo.muted = false;
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      heroVideo.pause();
    }
  });

  // إضافة تأثيرات عند التشغيل + تأكيد تشغيل الصوت عند بداية التشغيل
  heroVideo.addEventListener('play', () => {
    heroVideo.style.filter = 'brightness(1.1) contrast(1.15)';
    // حاول فك الكتم ثم إعادة التشغيل لضمان الصوت
    try {
      heroVideo.muted = false;
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
  });

  // عند أول إطار تشغيل، تأكد من فك الكتم
  const ensureAudibleOnce = () => {
    try {
      heroVideo.muted = false;
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
    heroVideo.removeEventListener('playing', ensureAudibleOnce);
  };
  heroVideo.addEventListener('playing', ensureAudibleOnce);

  heroVideo.addEventListener('pause', () => {
    heroVideo.style.filter = 'brightness(1.05) contrast(1.1)';
  });

  // إضافة تأثير عند التحميل
  heroVideo.addEventListener('canplay', () => {
    heroVideo.style.opacity = '1';
  });

  // محاولة تشغيل فورية قوية عند بدء الصفحة
  function forceAutoplayMuted() {
    try {
      heroVideo.muted = true;
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
  }
  forceAutoplayMuted();
  // إعادة المحاولة على أحداث تحميل وسائط مختلفة
  ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'].forEach((ev) => {
    heroVideo.addEventListener(ev, forceAutoplayMuted, { once: true });
  });

  // أدوات مساعدة لتشغيل الفيديو بالصوت
  function playWithSound() {
    try {
      heroVideo.muted = false;
      const maybePromise = heroVideo.play();
      if (maybePromise && typeof maybePromise.then === 'function') {
        return maybePromise.catch(() => {
          // إذا رفض المتصفح التشغيل التلقائي مع الصوت
          heroVideo.muted = true;
        });
      }
    } catch (_) {
      heroVideo.muted = true;
    }
  }

  function handleVisibility(isVisible) {
    if (isVisible) {
      // عند الظهور: فك الكتم وحاول تشغيله بالصوت
      playWithSound();
    } else {
      // خارج الظهور: استمر بالتشغيل لكن مع كتم الصوت للحفاظ على "تشغيل دائم"
      heroVideo.muted = true;
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }

  // مراقبة الظهور في الشاشة بقيمة تحفيز أقل ليعمل مبكراً
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => handleVisibility(entry.isIntersecting));
  }, { rootMargin: '0px 0px -20% 0px', threshold: 0.15 });
  observer.observe(heroVideo);

  // عند تحميل الصفحة: ابدأ التشغيل فوراً (مكتوم) ثم فعّل الصوت عند الظهور
  function checkInitialVisibility() {
    const rect = heroVideo.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.2;
    // تأكد من التشغيل دائماً
    heroVideo.muted = true;
    const p = heroVideo.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    if (inView) playWithSound();
  }
  if (document.readyState === 'complete') {
    checkInitialVisibility();
  } else {
    window.addEventListener('load', checkInitialVisibility, { once: true });
  }

  // في حال منع المتصفح التشغيل مع الصوت، أعد المحاولة عند أول تفاعل للمستخدم
  const retryEvents = ['click', 'touchstart', 'keydown'];
  const retryOnce = () => { playWithSound(); retryEvents.forEach((e)=>window.removeEventListener(e, retryOnce)); };
  retryEvents.forEach((e) => window.addEventListener(e, retryOnce, { passive: true, once: true }));

  // عند العودة للنافذة أو تبويب المتصفح
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // إذا كان الفيديو ظاهر حالياً حاول التشغيل بالصوت
      const rectNow = heroVideo.getBoundingClientRect();
      const visible = rectNow.top < window.innerHeight && rectNow.bottom > 0;
      if (visible) playWithSound();
    }
  });
}

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

// Services carousel functionality
(function servicesCarousel() {
  const carouselCards = document.querySelectorAll('.service-carousel-card');
  const serviceDetails = document.querySelectorAll('.service-detail');
  const prevBtn = document.querySelector('.services-carousel-btn--prev');
  const nextBtn = document.querySelector('.services-carousel-btn--next');
  const carouselList = document.querySelector('.services-carousel-list');
  
  if (!carouselCards.length) return;

  let currentIndex = 0;

  function showService(index) {
    // Update carousel cards
    carouselCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update service details
    serviceDetails.forEach((detail, i) => {
      detail.classList.toggle('active', i === index);
    });

    currentIndex = index;
  }

  // Add click events to carousel cards
  carouselCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      showService(index);
    });
  });

  // Navigation buttons
  prevBtn?.addEventListener('click', () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : carouselCards.length - 1;
    showService(newIndex);
  });

  nextBtn?.addEventListener('click', () => {
    const newIndex = currentIndex < carouselCards.length - 1 ? currentIndex + 1 : 0;
    showService(newIndex);
  });

  // Auto-scroll carousel
  function scrollCarousel() {
    const cardWidth = carouselCards[0].offsetWidth + 16; // card width + gap
    carouselList.scrollTo({
      left: currentIndex * cardWidth,
      behavior: 'smooth'
    });
  }

  // Update scroll position when service changes
  const originalShowService = showService;
  showService = function(index) {
    originalShowService(index);
    setTimeout(scrollCarousel, 100);
  };
})();

// Function to scroll to contact section
function scrollToContact() {
  const contactSection = document.querySelector('#contact');
  if (contactSection) {
    contactSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
}

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
    if (!first) return 436; // 420 card width + 16 gap
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
    // Enable both arrows whenever there is overflow; we support wrap-around
    const hasOverflow = m > 0;
    if (prev) prev.disabled = !hasOverflow;
    if (next) next.disabled = !hasOverflow;
  }
  update();

  // Flip behavior so left arrow (prev) goes visually left and right arrow (next) goes visually right
  prev?.addEventListener('click', () => {
    const step = getStep();
    const m = max();
    const nextPos = getLogical() + step;
    setLogical(nextPos > m ? 0 : nextPos);
    setTimeout(update, 350);
  });
  next?.addEventListener('click', () => {
    const step = getStep();
    const m = max();
    const nextPos = getLogical() - step;
    setLogical(nextPos < 0 ? m : nextPos);
    setTimeout(update, 350);
  });

  list.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => setTimeout(update, 100), { passive: true });
})();

// تشغيل تحسينات الفيديو
setupVideoEnhancements();


