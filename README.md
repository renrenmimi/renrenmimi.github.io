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

- **Work** — PetNote, AgentTape, ToneDown, KOVA Flooring, GreenLane, Repo Time Machine, TaxLot, iCanDoIt
- **Experience** — WeShipItNow, a multi-carrier shipping platform, plus a teaching assistant role
- **Learning Tools** — BoxArrow, DataData, AlgoAlgo, APIer, TSer, RedisVisual, DrillLab, AgentLab, and Bug Museum; SwiftLab is linked from iCanDoIt
- **Lab** — browser experiments, games, canvas and motion pieces, cognitive drills
- **Skills** and **About**

## Notes

- Dark theme by default with a light toggle; the choice persists to `localStorage`
- The theme is applied by an inline script in `<head>`, before first paint, so there is no flash
- Learning Tools uses a three-by-three desktop grid, with beginner-friendly course descriptions, live links and the deployed sites' theme colors
- Each original course animation and full description is preserved; animations respect `prefers-reduced-motion`
- No horizontal overflow from 375 px up; the layout collapses to one column on mobile

GitHub Pages serves the default branch, so a push deploys.

---

© 2026 Weiren Feng. All rights reserved. Published for reading and portfolio purposes; not
licensed for reuse, modification, or redistribution.
