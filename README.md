# Project Hub

Static project collection hosted on GitHub Pages. Run `preview.cmd` for the
local preview; there is no build step.

## Shared UI

The homepage is a single-page shell. It loads each project in an isolated frame,
so switching projects does not change the browser URL. Shared navigation and
colors live in `dashboard.css` and `theme.css`; project-specific code stays in
its own folder under `projects/`.

## Projects

- `projects/tic-tac-toe/`: two-player game with isolated HTML, CSS, and JavaScript.
- `projects/typing/`: timed typing test with isolated HTML, CSS, and JavaScript.

Typing speed is correct characters divided by five, per elapsed minute.
Accuracy measures correct inserted characters out of all inserted characters,
so correcting a mistake does not erase the original error from accuracy.
Tests start on the first character and keep running when the tab is hidden.
