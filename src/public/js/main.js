// src/public/js/main.js — RRE International Premium Interactive JS
document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. HERO BACKGROUND SLIDESHOW — .hero-bg-slide + .js-slide-dot
  // ============================================================
  const bgSlides = document.querySelectorAll('.hero-bg-slide');
  const slideDots = document.querySelectorAll('.js-slide-dot');
  let currentBgSlide = 0;
  let bgSlideInterval;

  function showBgSlide(index) {
    if (bgSlides.length === 0) return;
    if (index >= bgSlides.length) index = 0;
    if (index < 0) index = bgSlides.length - 1;
    currentBgSlide = index;

    bgSlides.forEach((s, i) => s.classList.toggle('active', i === currentBgSlide));
    slideDots.forEach((d, i) => d.classList.toggle('active', i === currentBgSlide));
  }

  function nextBgSlide() { showBgSlide(currentBgSlide + 1); }

  if (bgSlides.length > 0) {
    bgSlideInterval = setInterval(nextBgSlide, 5500);

    slideDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        clearInterval(bgSlideInterval);
        showBgSlide(i);
        bgSlideInterval = setInterval(nextBgSlide, 5500);
      });
    });
  }

  // ============================================================
  // 2. LIVE AUTOCOMPLETE SEARCH — .js-search-input
  // ============================================================
  const searchInputs = document.querySelectorAll('.js-search-input');

  searchInputs.forEach(input => {
    const wrapper = input.closest('.search-form-wrapper') || input.closest('.hero-search-card') || input.parentElement;

    let dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.cssText = 'display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 28px rgba(0,0,0,0.12);z-index:999;max-height:380px;overflow-y:auto;margin-top:4px;';
    const heroCard = input.closest('.hero-search-card');
    if (heroCard) {
      heroCard.style.position = 'relative';
      heroCard.appendChild(dropdown);
    } else {
      wrapper.style.position = 'relative';
      wrapper.appendChild(dropdown);
    }

    let debounceTimer;

    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          const suggestions = data.suggestions || [];

          if (suggestions.length === 0) {
            dropdown.innerHTML = `
              <div style="padding:1rem;color:#64748b;font-size:0.9rem;text-align:center;">
                No exact match found for <strong>"${query}"</strong>.
                <a href="/rfq?part=${encodeURIComponent(query)}" style="color:#d97706;font-weight:700;display:block;margin-top:0.5rem;">
                  📋 Submit RFQ for this part number &rarr;
                </a>
              </div>
            `;
            dropdown.style.display = 'block';
            return;
          }

          dropdown.innerHTML = suggestions.map(item => `
            <a href="${item.url}" style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;border-bottom:1px solid #f1f5f9;color:#0f172a;text-decoration:none;transition:background 0.15s;">
              <div>
                <strong style="font-family:monospace;font-size:0.9rem;">${item.partNumber || item.title}</strong>
                <div style="font-size:0.78rem;color:#64748b;margin-top:2px;">${item.name || item.type}</div>
              </div>
              <span style="background:#0f172a;color:#fff;font-size:0.65rem;font-weight:800;padding:0.2rem 0.5rem;border-radius:4px;text-transform:uppercase;flex-shrink:0;">${(item.type||'').toUpperCase()}</span>
            </a>
          `).join('');

          dropdown.style.display = 'block';
        } catch (err) {
          console.error('Autocomplete fetch failed', err);
        }
      }, 160);
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) dropdown.style.display = 'none';
    });
  });

  // ============================================================
  // 3. CATEGORY FILTER TABS — .js-cat-tab + .js-prod-card
  // ============================================================
  const catTabs = document.querySelectorAll('.js-cat-tab');
  const prodCards = document.querySelectorAll('.js-prod-card');

  if (catTabs.length > 0 && prodCards.length > 0) {
    catTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        catTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const cat = tab.getAttribute('data-cat');

        prodCards.forEach(card => {
          if (cat === 'all' || card.getAttribute('data-cat') === cat) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // Also support old selectors for backwards compatibility
  const oldTabBtns = document.querySelectorAll('.js-filter-tab');
  const oldCards = document.querySelectorAll('.js-product-card');
  if (oldTabBtns.length > 0 && oldCards.length > 0) {
    oldTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        oldTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.getAttribute('data-category');
        oldCards.forEach(card => {
          if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ============================================================
  // 4. MOBILE NAVIGATION DRAWER
  // ============================================================
  const mobileToggle = document.querySelector('.js-mobile-menu-toggle');
  const mobileDrawer = document.querySelector('.js-mobile-nav-drawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.style.display !== 'none';
      mobileDrawer.style.display = isOpen ? 'none' : 'block';
      mobileToggle.textContent = isOpen ? '☰' : '✕';
    });
  }

  // ============================================================
  // 5. SCROLL REVEAL ANIMATION — [data-animate]
  // ============================================================
  const animatedElements = document.querySelectorAll('[data-animate]');

  if ('IntersectionObserver' in window && animatedElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.getAttribute('data-delay') || 0;
          const animation = el.getAttribute('data-animate') || 'fadeInUp';

          setTimeout(() => {
            el.style.animation = `${animation} 0.65s ease both`;
          }, parseInt(delay));

          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    animatedElements.forEach(el => {
      el.style.opacity = '0';
      revealObserver.observe(el);
    });
  }

  // ============================================================
  // 6. ANIMATED STAT COUNTERS — .stat-big-num
  // ============================================================
  const statNums = document.querySelectorAll('.stat-big-num');

  if ('IntersectionObserver' in window && statNums.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const raw = el.textContent.trim();
          const hasPlus = raw.includes('+');
          const numStr = raw.replace(/[^0-9]/g, '');
          const target = parseInt(numStr, 10);

          if (isNaN(target)) return;

          let start = 0;
          const duration = 1800;
          const stepTime = 16;
          const steps = Math.floor(duration / stepTime);
          let current = 0;

          const counter = setInterval(() => {
            current++;
            const progress = current / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(eased * target);
            el.textContent = value.toLocaleString() + (hasPlus ? '+' : '');

            if (current >= steps) {
              el.textContent = target.toLocaleString() + (hasPlus ? '+' : '');
              clearInterval(counter);
            }
          }, stepTime);

          statsObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    statNums.forEach(el => statsObserver.observe(el));
  }

  // ============================================================
  // 7. STICKY MOBILE CTA BAR — whatsapp + rfq
  // ============================================================
  const mobileBar = document.getElementById('mobile-sticky-bar');
  if (mobileBar) {
    window.addEventListener('scroll', () => {
      mobileBar.style.display = window.scrollY > 300 ? 'flex' : 'none';
    }, { passive: true });
  }

  // ============================================================
  // 8. PRODUCT IMAGE ERROR FALLBACK
  // ============================================================
  document.querySelectorAll('img').forEach(img => {
    if (img.hasAttribute('data-fallback')) return;
    img.setAttribute('data-fallback', '1');
    img.addEventListener('error', function() {
      const fallbacks = [
        '/images/products/hydraulic-pump.jpg',
        '/images/products/hydraulic-seal-kit.jpg',
        '/images/products/placeholder.jpg'
      ];
      const nextFallback = fallbacks[0];
      if (this.src !== window.location.origin + nextFallback) {
        this.src = nextFallback;
      }
    });
  });

});

// ── Global Certificate Lightbox Functions ──
function openCertLightbox(imgSrc, title) {
  const modal = document.getElementById('certLightboxModal');
  const img = document.getElementById('certLightboxImg');
  const titleEl = document.getElementById('certLightboxTitle');
  if (!modal || !img) return;

  img.src = imgSrc;
  if (titleEl) titleEl.textContent = title || 'Certificate Viewer';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCertLightbox() {
  const modal = document.getElementById('certLightboxModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCertLightbox();
});

