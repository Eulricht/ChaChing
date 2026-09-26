const homeButton = document.querySelector('[data-project-home]');

homeButton?.addEventListener('click', () => {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'project-home' }, window.location.origin);
  } else {
    window.location.assign('../../index.html');
  }
});
