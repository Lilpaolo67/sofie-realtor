/* ═══════════════════════════════════════════════════
   SOFIE SOLITARIO REALTY — Main JavaScript
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. NAVBAR: scroll + mobile slide-in menu ── */
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  // Always show dark navbar on mobile; add class on desktop scroll
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Toggle the full-screen slide-in menu
  function openMenu() {
    hamburger.classList.add('active');
    navLinks.classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent background scroll
    hamburger.setAttribute('aria-label', 'Close menu');
  }
  function closeMenu() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-label', 'Open menu');
  }

  hamburger.addEventListener('click', () => {
    navLinks.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close when any nav link is tapped
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
  });

  /* ── 2. HERO: Ken-Burns effect ── */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => hero.classList.add('loaded'));
  }

  /* ── 3. SCROLL ANIMATIONS (Intersection Observer) ── */
  const animateEls = document.querySelectorAll('.wow-fade, .specialty-card, .listing-card, .testimonial-card, .about-image-col, .about-content-col, .stat-item, .contact-method');

  const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add initial classes & observe
  document.querySelectorAll('.specialty-card').forEach((el, i) => {
    el.classList.add('wow-fade');
    el.style.transitionDelay = `${i * 0.07}s`;
    observer.observe(el);
  });

  document.querySelectorAll('.listing-card').forEach((el, i) => {
    el.classList.add('wow-fade');
    el.style.transitionDelay = `${i * 0.1}s`;
    observer.observe(el);
  });

  document.querySelectorAll('.stat-item').forEach((el, i) => {
    el.classList.add('wow-fade');
    el.style.transitionDelay = `${i * 0.1}s`;
    observer.observe(el);
  });

  document.querySelectorAll('.contact-method').forEach((el, i) => {
    el.classList.add('wow-fade');
    el.style.transitionDelay = `${i * 0.08}s`;
    observer.observe(el);
  });

  document.querySelectorAll('.about-image-col, .about-content-col').forEach((el, i) => {
    el.classList.add('wow-fade');
    el.style.transitionDelay = `${i * 0.15}s`;
    observer.observe(el);
  });

  // Observe pre-added wow-fade elements
  document.querySelectorAll('.wow-fade').forEach(el => observer.observe(el));

  /* ── 4. COUNTER ANIMATION ── */
  const counters = document.querySelectorAll('.stat-number[data-count]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  function animateCounter(el) {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start    = performance.now();

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    }
    requestAnimationFrame(update);
  }

  /* ── 5. TESTIMONIALS SLIDER ── */
  const track   = document.getElementById('testimonialsTrack');
  const cards   = track ? Array.from(track.querySelectorAll('.testimonial-card')) : [];
  const dotsEl  = document.getElementById('testimonialDots');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');

  if (track && cards.length) {
    let current   = 0;
    let autoTimer = null;

    function getPerView() {
      return window.innerWidth < 768 ? 1 : window.innerWidth < 1100 ? 2 : 3;
    }

    // Build dots
    function buildDots() {
      dotsEl.innerHTML = '';
      const perView    = getPerView();
      const totalSlides = Math.max(1, cards.length - perView + 1);
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'testimonial-dot' + (i === current ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => { goTo(i); resetAuto(); });
        dotsEl.appendChild(dot);
      }
    }

    function goTo(idx) {
      const perView  = getPerView();
      const maxSlide = Math.max(0, cards.length - perView);
      current = Math.max(0, Math.min(idx, maxSlide));

      // Measure width including margins
      const card      = cards[0];
      const style     = getComputedStyle(card);
      const cardW     = card.offsetWidth
                       + parseFloat(style.marginLeft)
                       + parseFloat(style.marginRight);
      track.style.transform = `translateX(-${current * cardW}px)`;

      cards.forEach((c, i) => c.classList.toggle('active', i === current));
      const dots = dotsEl.querySelectorAll('.testimonial-dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function next() {
      const perView  = getPerView();
      const maxSlide = Math.max(0, cards.length - perView);
      goTo(current >= maxSlide ? 0 : current + 1);
    }
    function prev() {
      const perView  = getPerView();
      const maxSlide = Math.max(0, cards.length - perView);
      goTo(current <= 0 ? maxSlide : current - 1);
    }

    function resetAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(next, 5000);
    }

    nextBtn.addEventListener('click', () => { next(); resetAuto(); });
    prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

    // Touch / swipe support
    let startX = 0, startY = 0;
    track.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = startX - e.changedTouches[0].clientX;
      const dy = Math.abs(startY - e.changedTouches[0].clientY);
      // Only register horizontal swipe (not scroll)
      if (Math.abs(dx) > 40 && dy < 60) {
        dx > 0 ? next() : prev();
        resetAuto();
      }
    });

    // Re-layout on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildDots();
        goTo(current);
      }, 200);
    });

    buildDots();
    resetAuto();
    goTo(0);
  }

  /* ── 6. CONTACT FORM (Web3Forms Live Email Delivery) ── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const name = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();

      if (!name || !email) {
        shakeField(!name ? 'fullName' : 'email');
        return;
      }

      const btn = form.querySelector('#form-submit');
      btn.textContent = 'Sending…';
      btn.disabled = true;

      const formData = new FormData(form);
      // Replace with your Web3Forms access key
      formData.append('access_key', '6d162ceb-a1bb-4cb3-a2c5-f335eda93c1f');

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          form.style.display = 'none';

          const success = document.createElement('div');
          success.className = 'form-success show';
          success.innerHTML = `
            <div class="success-icon">🎉</div>
            <p class="success-title">Inquiry Sent!</p>
            <p class="success-text">
              Thank you, <strong style="color:var(--gold)">${escapeHtml(name)}</strong>!<br />
              Your message was sent directly to Sofie. She will contact you shortly.
            </p>
          `;
          form.parentElement.appendChild(success);
        } else {
          btn.textContent = 'Send Inquiry';
          btn.disabled = false;
          alert('Something went wrong. Please try again or WhatsApp Sofie directly.');
        }
      })
      .catch(error => {
        btn.textContent = 'Send Inquiry';
        btn.disabled = false;
        alert('Network error. Please check your internet connection.');
      });
    });
  }

  function shakeField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '#e05252';
    el.style.animation = 'shake 0.4s ease';
    el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  }

  // Inject shake keyframe
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100%{ transform:translateX(0) }
      20%{ transform:translateX(-8px) }
      40%{ transform:translateX(8px) }
      60%{ transform:translateX(-6px) }
      80%{ transform:translateX(6px) }
    }
  `;
  document.head.appendChild(style);

  /* ── 7. SMOOTH SCROLL for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = navbar ? navbar.offsetHeight + 8 : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── 8. ACTIVE NAV LINK on scroll ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinkEls.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => sectionObserver.observe(s));

  /* ── 9. PARALLAX on hero ── */
  const heroBg = document.querySelector('.hero-img');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `scale(1) translateY(${scrolled * 0.25}px)`;
      }
    }, { passive: true });
  }

  /* ── 10. WhatsApp float tooltip ── */
  const waBtn = document.getElementById('wa-float-btn');
  if (waBtn) {
    const tip = document.createElement('span');
    tip.textContent = 'Chat with Sofie';
    tip.style.cssText = `
      position:absolute; right:68px; top:50%; transform:translateY(-50%);
      background:#25D366; color:#fff; font-size:0.72rem; font-weight:500;
      padding:6px 12px; border-radius:20px; white-space:nowrap;
      opacity:0; pointer-events:none; transition:opacity 0.25s ease;
      font-family:'Poppins',sans-serif; letter-spacing:0.04em;
    `;
    waBtn.style.position = 'fixed';
    waBtn.appendChild(tip);
    waBtn.addEventListener('mouseenter', () => tip.style.opacity = '1');
    waBtn.addEventListener('mouseleave', () => tip.style.opacity = '0');
  }

  /* ── 11. LIGHT/DARK THEME TOGGLE ── */
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      themeToggle.textContent = '🌙';
    }

    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      themeToggle.textContent = isLight ? '🌙' : '☀️';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  console.log('%c🏠 Sofie Realtor', 'color:#C8A84B;font-size:18px;font-family:Georgia,serif;font-weight:bold');
  console.log('%cPremium Real Estate · Cebu, Philippines', 'color:#888;font-size:11px');
});
