# renrenmimi.github.io

**▶ [weiren feng — portfolio](https://renrenmimi.github.io/)**

My personal site: what I build, where I have worked, and how to reach me.

Plain HTML, CSS and vanilla JavaScript — no build step and no dependencies. Open `index.html`
in a browser and that is the whole development setup.

| File | Role |
|---|---|
| `index.html` | The whole page, including inline SVG icons and two short inline scripts |
| `styles.css` | Design tokens, layout, dark and light themes |
| `assets/favicon.svg` | Favicon |
| `assets/kova.jpg` | Screenshot on the KOVA Flooring card |

## Sections

- **Work** — PetNote, ToneDown, GreenLane, KOVA Flooring, iCanDoIt
- **Experience** — WeShipItNow, a multi-carrier shipping platform, plus a teaching assistant role
- **Teaching** — the course sites: DataData, AlgoAlgo, APIer, TSer, RedisVisual, DrillLab, AgentLab, SwiftLab
- **Lab** — browser experiments, games, canvas and motion pieces, cognitive drills
- **Skills** and **About**

## Notes

- Dark theme by default with a light toggle; the choice persists to `localStorage`
- The theme is applied by an inline script in `<head>`, before first paint, so there is no flash
- Scroll-reveal animations respect `prefers-reduced-motion`
- No horizontal overflow from 375 px up; the layout collapses to one column on mobile

GitHub Pages serves the default branch, so a push deploys.

---

© 2026 Weiren Feng. All rights reserved. Published for reading and portfolio purposes; not
licensed for reuse, modification, or redistribution.
