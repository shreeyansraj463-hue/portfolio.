NEXUS Core fixed version
Replace the old three files with:
- index.html
- style.css
- script.js

Key fixes:
1. AudioContext is created lazily instead of immediately on page load.
2. Boot sequence can be skipped and does not depend on audio autoplay permission.
3. Mobile navigation has proper aria state and safer close behavior.
4. Section highlighting uses IntersectionObserver instead of heavy scroll work.
5. Three.js reactor cleans up resources and uses capped pixel ratio.
6. HUD canvas uses device-pixel-ratio safely and avoids unnecessary scaling.
7. AI messages use textContent instead of innerHTML for safer rendering.
8. Contact form gives status feedback and validates fields.
9. External links use rel="noopener noreferrer".
10. Reduced-motion and lite-mode behavior are handled more consistently.
11. Better mobile sizing, focus states, accessibility labels, and semantic structure.
