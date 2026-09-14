(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.header-inner').forEach(headerInner => {
      const toggle = headerInner.querySelector('.hamburger');
      const nav = headerInner.querySelector('.mainnav');
      if (!toggle || !nav) return;

      const closeNav = () => {
        nav.classList.remove('mobile-open');
        toggle.setAttribute('aria-expanded', 'false');
      };

      toggle.addEventListener('click', event => {
        event.stopPropagation();
        const open = nav.classList.toggle('mobile-open');
        toggle.setAttribute('aria-expanded', String(open));
      });

      nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

      document.addEventListener('click', event => {
        if (nav.classList.contains('mobile-open') && !nav.contains(event.target) && event.target !== toggle) {
          closeNav();
        }
      });

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeNav();
      });
    });
  });
})();
