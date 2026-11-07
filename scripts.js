/* Honey Cake Bakery: mobile menu, header state, scroll reveal and active nav link. */
(function () {
  'use strict';

  var body = document.body;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasObserver = 'IntersectionObserver' in window;

  /* ---------- Mobile menu ---------- */

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a link
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });

    // Close when tapping outside the header
    document.addEventListener('click', function (event) {
      if (body.classList.contains('menu-open') && !header.contains(event.target)) setMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && body.classList.contains('menu-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Reset if the window grows to desktop size while the menu is open
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (event) {
      if (event.matches) setMenu(false);
    });
  }

  /* ---------- Header shadow after scrolling ---------- */

  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* ---------- Reveal sections as they scroll into view ---------- */

  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (!hasObserver || reduceMotion) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    // Stagger items that share a parent (cards in a grid, list items)
    revealItems.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (child) {
        return child.classList.contains('reveal');
      });
      el.style.setProperty('--reveal-delay', String(Math.min(siblings.indexOf(el), 4) * 90));
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Highlight the nav link for the section on screen ---------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var hero = document.getElementById('home');
  var watched = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);
  if (hero) watched.push(hero);

  if (hasObserver && watched.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    watched.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Gallery photo viewer ---------- */

  var lightbox = document.getElementById('lightbox');
  var galleryLinks = Array.prototype.slice.call(document.querySelectorAll('.gallery-link'));

  // Without <dialog> support the links simply open the full-size photo.
  if (lightbox && galleryLinks.length && typeof lightbox.showModal === 'function') {
    var lbImg = lightbox.querySelector('.lightbox-img');
    var lbTitle = lightbox.querySelector('.lightbox-title');
    var lbCount = lightbox.querySelector('.lightbox-count');
    var closeDelay = reduceMotion ? 0 : 300;
    var current = 0;
    var touchStartX = null;
    var touchStartY = null;

    var wrap = function (i) {
      return (i + galleryLinks.length) % galleryLinks.length;
    };

    var preload = function (i) {
      new Image().src = galleryLinks[wrap(i)].href;
    };

    var show = function (i) {
      current = wrap(i);
      var link = galleryLinks[current];
      var thumb = link.querySelector('img');
      var caption = link.parentElement.querySelector('figcaption');

      lbTitle.textContent = caption ? caption.textContent : '';
      lbCount.textContent = (current + 1) + ' / ' + galleryLinks.length;
      lbImg.classList.add('is-changing');

      // Swap in the new photo only once it has loaded, then fade it in
      var next = new Image();
      next.onload = next.onerror = function () {
        if (galleryLinks[current] !== link) return; // user already moved on
        lbImg.src = link.href;
        lbImg.alt = thumb ? thumb.alt : '';
        requestAnimationFrame(function () { lbImg.classList.remove('is-changing'); });
      };
      next.src = link.href;

      preload(current + 1);
      preload(current - 1);
    };

    var open = function (i) {
      show(i);
      lightbox.showModal();
      body.classList.add('lightbox-open');
      requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    };

    var cleanup = function () {
      body.classList.remove('lightbox-open');
      lightbox.classList.remove('is-open');
    };

    var close = function () {
      if (!lightbox.open) return;
      lightbox.classList.remove('is-open');
      setTimeout(function () {
        lightbox.close();
        cleanup();
        galleryLinks[current].focus({ preventScroll: true });
      }, closeDelay);
    };

    galleryLinks.forEach(function (link, i) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        open(i);
      });
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
    lightbox.querySelector('.lightbox-next').addEventListener('click', function () { show(current + 1); });

    // Click on the dark area around the photo closes the viewer
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox || event.target.classList.contains('lightbox-figure')) close();
    });

    lightbox.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') show(current + 1);
      else if (event.key === 'ArrowLeft') show(current - 1);
    });

    // Esc: fade out instead of closing instantly
    lightbox.addEventListener('cancel', function (event) {
      event.preventDefault();
      close();
    });

    // Also covers the browser closing the dialog on its own
    lightbox.addEventListener('close', cleanup);

    // Swipe left or right on phones
    lightbox.addEventListener('touchstart', function (event) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    lightbox.addEventListener('touchend', function (event) {
      if (touchStartX === null) return;
      var dx = event.changedTouches[0].clientX - touchStartX;
      var dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
      touchStartX = null;
    });
  }

  /* ---------- Footer year ---------- */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
