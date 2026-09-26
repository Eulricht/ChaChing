const dashboardView = document.getElementById('dashboard-view');
const projectView = document.getElementById('project-view');
const projectFrame = document.getElementById('project-frame');
const shellHome = document.getElementById('shell-home');
const shellMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const projects = {
  'tic-tac-toe': { path: 'projects/tic-tac-toe/index.html', title: 'Tic Tac Toe' },
  typing: { path: 'projects/typing/index.html', title: 'Typing Game' }
};
let changingView = false;

function waitForTransition() {
  return new Promise(resolve => window.setTimeout(resolve, shellMotion.matches ? 0 : 220));
}

function loadProject(path) {
  return new Promise(resolve => {
    projectFrame.addEventListener('load', resolve, { once: true });
    projectFrame.src = path;
  });
}

function enterView(view) {
  view.hidden = false;
  view.classList.remove('is-leaving');
  view.classList.add('is-entering');
  requestAnimationFrame(() => requestAnimationFrame(() => view.classList.remove('is-entering')));
}

async function openProject(projectName) {
  const project = projects[projectName];
  if (!project || changingView) return;
  changingView = true;
  await loadProject(project.path);
  dashboardView.classList.add('is-leaving');
  await waitForTransition();
  dashboardView.hidden = true;
  dashboardView.classList.remove('is-leaving');
  document.body.classList.add('project-open');
  shellHome.removeAttribute('aria-current');
  document.title = `${project.title} / Project Hub`;
  projectFrame.title = project.title;
  enterView(projectView);
  await waitForTransition();
  changingView = false;
}

async function showDashboard() {
  if (changingView || projectView.hidden) return;
  changingView = true;
  projectView.classList.add('is-leaving');
  await waitForTransition();
  projectView.hidden = true;
  projectView.classList.remove('is-leaving');
  document.body.classList.remove('project-open');
  shellHome.setAttribute('aria-current', 'page');
  document.title = 'Project Hub';
  enterView(dashboardView);
  await waitForTransition();
  projectFrame.src = 'about:blank';
  changingView = false;
}

document.querySelectorAll('[data-project]').forEach(button => {
  button.addEventListener('click', () => openProject(button.dataset.project));
});

shellHome.addEventListener('click', showDashboard);

window.addEventListener('message', event => {
  if (event.origin === window.location.origin && event.data?.type === 'project-home') showDashboard();
});
