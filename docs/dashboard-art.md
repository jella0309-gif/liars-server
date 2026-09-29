# Dashboard artwork

- Reference/edit target: `eg/eg dashboard/ChatGPT Image Sep 29, 2026, 07_06_03 AM.png`.
- Mode: built-in Imagegen, single edit; no CLI fallback.
- Final asset: `client/public/art/tavern-dashboard.png`.
- Integration: local CSS background in `client/src/styles/atmosphere.css`; preloaded by `client/index.html`.
- Generated scenery is decorative. All navigation, character selection, game state and controls are real HTML/React.
- The original reference and the character expression sheets are preserved.
- Brush lettering uses locally hosted Permanent Marker. Its license is included at `client/public/fonts/LICENSE-permanent-marker.txt`.

## Final prompt

Use case: precise-object-edit. Asset: production background wallpaper for the Liar's Bar game website, landscape 16:9. Edit the supplied dashboard mockup into ONLY its illustrated tavern scene. Remove ALL overlaid interface: header navigation, logos in the header, white/red foreground headline, explanatory copy, character selection thumbnails, bottom character profile panel, entire right-hand form panel, all buttons, icons and labels. Seamlessly reconstruct the warm tavern and dark wooden bar/table behind every removed overlay. Preserve the visual identities and clothing of Monkey, Fox, Boar, Dog and Bear gathered in a row behind the bar in the upper half; keep their faces crisp, illustrated anime/comic painterly style exactly matching the reference, amber pendant lighting, bottles, smoky copper highlights, burgundy red neon ambience, and wood texture. Add the golden Cat in the same character style beside Dog and Bear if needed to complete the existing six-character cast, keeping all six separated along the upper half. Keep the actual environmental red neon 'LIAR'S BAR' sign on the back wall. Lower half is a dim, spacious wooden tabletop with subtle cards and chips near the edges, darker negative space for real web UI. Right quarter should be atmospheric darker bar interior so a real form can overlay it. No visible interface elements, no copy outside the environmental sign, no boxes, no frames, no watermark. Return the standalone art only.
