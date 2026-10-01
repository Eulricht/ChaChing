const homeButton = document.querySelector('[data-project-home]');

// Embedded projects ask the parent shell to navigate without changing the URL.
if (window.parent !== window) document.body.classList.add('is-embedded');

homeButton?.addEventListener('click', () => {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'project-home' }, window.location.origin);
  } else {
    window.location.assign('../../index.html');
  }
});
