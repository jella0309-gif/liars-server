# Liar's Bar — Character UI refresh

## Artwork

The two original PNG files in `eg/` are preserved. Runtime copies live in `client/public/art/`:

- `character-lineup.png`: six original tall portraits, retained for the reusable portrait component.
- `character-states.png`: six characters × four expressions used in the lobby preview, seats, roulette, and winner screen.

`client/src/components/CharacterPortrait.tsx` contains the character metadata and SVG viewports. The viewports isolate each portrait directly from the supplied sheets, without modifying or regenerating the artwork. The lineup is normalized to a 2048 × 683 SVG coordinate space; the expression sheet uses 1536 × 1024.

| Game situation                                            | Expression |
| --------------------------------------------------------- | ---------- |
| Waiting, another player's turn, folded, survived roulette | Idle       |
| Current player's decision, cylinder loading/spinning      | Thinking   |
| Round winner, final match winner                          | Win        |
| Eliminated, after the roulette result is revealed         | Dead       |

Avatar identifiers remain compatible with the socket protocol. The old cowboy avatar maps to Monkey, and the old wolf avatar maps to Bear. New bots use distinct characters available in the supplied designs.

## Interface

- Full lobby with six selectable portraits, expression previews, nickname, bot/create/join modes, room size, connection and inline error states.
- Private cards remain hidden. The local player always sits at the center of the near edge. With four players, the opposite player sits at the center of the far edge while the other two sit evenly along the outer left and right edges; three players form a triangle; two sit opposite each other. The mapping remains correct when joining as a guest.
- Community cards flip as they arrive. Hole cards flip at showdown. New rounds deal cards again.
- Swap dialog shows the hand and drawn pool, accessible selection buttons, a countdown bounded by the remaining turn, and a short exchange animation. Closing/reopening reuses the server's same draw pool.
- Roulette runs within the shared 4.5-second interval, cancels its timers on cleanup, and reveals character death only with the cylinder result.
- Winner, replay, next-round controls, survival notification, rules, sound controls, and room sharing use the same visual theme.
- Responsive layouts tested from 320px to 1440px, focus trapping and Escape in dismissible dialogs, keyboard controls, and reduced-motion support.
- Music is a quiet synthesized ambient chord. Audio does not depend on a third-party media URL.
- Socket traffic uses the current origin and Vite's existing proxy. A separate backend can still be selected using `VITE_SERVER_URL`.

## Validation

```sh
npm test
npm run build
npx tsc -p server/tsconfig.json --noEmit --rootDir . --module ESNext --moduleResolution Bundler
```

The explicit server typecheck options account for the existing workspace layout and extensionless shared imports used by the tsx runtime.

Six regression tests cover hidden opponent cards, one-use swaps, reopening the same pool, stale selection rejection, all-in/showdown transitions, the server turn deadline, and round resets.

Browser checks exercised real Socket.IO rooms with 2, 3, and 4 players, bot character selection, invalid room feedback, card swap, full-board showdown, roulette, victory, replay, connection recovery, and mobile layout. Rare survival and death-timing presentation were additionally checked with local UI fixtures. Axe checks on the mobile lobby and game returned no WCAG A/AA violations.

## Local development

Run `npm run dev:server` and `npm run dev:client`. The game uses the Vite URL shown in the terminal. Character artwork is served locally and is included in the production build.

## Dashboard reference revision

The dashboard follows the supplied `eg/eg dashboard` reference: illustrated tavern scenery, red brush lettering, copper borders, dark wood panels, six portrait choices and a nickname/play panel. No account, level or leaderboard interface is included. Nickname suggestions and previous/next character buttons are functional.

Gameplay shares this palette across the table, seats, history, action dock, swap, roulette and results. Seat placement is centralized in `client/src/utils/seating.ts`; responsive styles preserve the arrangement rather than stacking opponents into one row.

Ambient light, neon glow, drifting smoke, embers and subtle pointer parallax accompany character selection, turn indicators, action feedback and stage changes. Card dealing, flips and swaps remain tied to actual game events. Reduced-motion preferences suppress ambient movement and shorten transitions. Decorative layers do not capture pointer events or enter the accessibility tree.

The scenery asset, generation mode and exact final prompt are documented in [dashboard-art.md](dashboard-art.md). All image and font assets are local.

Revision validation: production build and six game regression tests; browser walkthrough of create/join, all 24 expressions, swap, full showdown, roulette, replay and reconnect; mobile lobby/game Axe scans with zero WCAG A/AA violations. Separate geometry checks cover 2/3/4 seats at 320, 390, 768, 1024, 1440 and 1920 pixels, checking seat separation, clear community cards and the mobile hand above the action dock. Preview screenshots are saved under `.local/ui-preview/` (ignored by Git).
