const page = document.body;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function showPage() {
  page.classList.remove('is-leaving');
  requestAnimationFrame(() => page.classList.add('is-ready'));
}

showPage();
window.addEventListener('pageshow', showPage);

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || link.target || link.hasAttribute('download')) return;
  if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash === window.location.hash) return;
  if (reducedMotion.matches) return;

  event.preventDefault();
  page.classList.remove('is-ready');
  page.classList.add('is-leaving');
  window.setTimeout(() => window.location.assign(destination.href), 240);
});
