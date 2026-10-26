# Weiren Feng — portfolio

[renrenmimi.github.io](https://renrenmimi.github.io/)

Personal portfolio built with HTML, CSS and vanilla JavaScript. No build step.
Renren is my nickname; my dog is Jelly.

## Files

- `index.html`: projects, nine Learning Tools, about, experience and experiments.
- `open-form.css`: base layout and typography.
- `course-motion.css`: the eight original course animations.
- `learning-tools.css`, `learning-tools.js`: the Learning Tools panel. Nine courses on a dark
  panel with BoxArrow in the middle, running a small live system; pointing at a course lights
  the part of that system it teaches. All nine fit one laptop screen at 100% zoom.
- `open-form-motion.css`: interactive previews and motion.
- `open-form-refined.css`: final palette, responsive layout and project/tool browser.
- `open-form.js`: particle canvas, preview controls, dialog and motion preferences.
- `previews.css`, `previews.js`: the PetNote and AgentTape previews play on their own until a
  visitor clicks one; the AgentTape window shows the messages array growing and the context
  each step uses.
- `assets/favicon.svg`: the tab icon, a lowercase w and its blue full stop. `favicon.ico` and
  `assets/apple-touch-icon.png` are the same mark for older browsers and phone home screens.
- `assets/`: also Jelly’s photos, the PetNote paw and the KOVA image.

Run `python3 -m http.server 8000` and open http://localhost:8000.
GitHub Pages serves the default branch; pushing deploys the site.
Animations respect reduced motion and can be paused with the footer control.

© 2026 Weiren Feng. All rights reserved. Published for reading and portfolio purposes; not licensed for reuse, modification, or redistribution.
