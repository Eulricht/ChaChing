# Project Hub

Static project collection hosted on GitHub Pages. Open `index.html` locally;
there is no build step.

## Shared UI

Every project uses `dashboard.css` for the navigation and `theme.css` for shared
colors, surfaces, and focus states. Load `theme.css` after the layout styles.
Use the `project-page` body class and the same `site-nav` home link as
`typing.html`. Project-specific styles should use the `--hub-*` variables
instead of adding another palette. Keep links relative for GitHub Pages.

## Projects

- `tic-tac-toe.html`: two-player game; `styles.css` and `script.js`.
- `typing.html`: timed typing tests; `typing.css` and `typing.js`.

Typing speed is correct characters divided by five, per elapsed minute.
Accuracy measures correct inserted characters out of all inserted characters,
so correcting a mistake does not erase the original error from accuracy.
Tests start on the first character and keep running when the tab is hidden.
