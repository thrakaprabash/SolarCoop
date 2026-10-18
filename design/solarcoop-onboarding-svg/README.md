# SolarCoop opening and onboarding SVG designs

12 mobile screens at 390 × 844: six light and six dark. All illustrations and logo marks are vector geometry; no reference JPEG is embedded. Text remains editable SVG text (Inter, with Arial fallback). The logo is a clean vector reconstruction inspired by the supplied references, not an exact trace of the original artwork.

## Files

- `svg/light/` and `svg/dark/`: individual screens ready to drag into Figma.
- `brand/`: transparent light and dark vector logo marks.
- `overview-light.png` and `overview-dark.png`: complete flow previews.
- `png/`: full resolution rendered screen previews.
- `preview.html`: clickable local demo; open in a browser, then use the theme switch and buttons.

## Flow

1. `00-opening`: brand reveal, sun and homes, “Share the sun.”
2. `01-loading`: preparation state. Progress bar is illustrative, not an actual measurement.
3. `02-monitor`: solar generation and usage introduction.
4. `03-community`: local solar community and surplus energy introduction.
5. `04-support`: system alerts and technician support introduction.
6. `05-welcome`: Create an account → existing Register; Log in → existing Login.

## Figma prototype setup

Import a single theme's six SVGs, then place each imported group in a 390 × 844 frame. Connect Opening to Loading with an After delay transition for the design demo. Connect Loading to Monitor after a demo delay. Connect Next to the next screen, Get started to Welcome, and Skip on all three slides to Welcome. Link Welcome's buttons to the existing auth frames. Suggested transitions: opening dissolve 300 ms, onboarding move in from right 250 ms, Skip dissolve 200 ms. Create a flow starting at Opening for each theme.

The SVG files contain the visuals only. Figma does not import interactive prototype connections from SVG. The included HTML preview demonstrates the proposed interactions.

## Implementation notes

In the real app, leave Loading when initialization completes, rather than relying on the preview's timer. Persist onboarding completion locally; signed-out returning users should go to Login, and users with a restored session should follow the existing role router. Skip counts as completion. On initialization failure, show a Retry state rather than keeping the progress bar moving forever. Use the system theme consistently across opening, loading and onboarding. No app code or existing Figma screens were changed by this design pack.

Colours follow `src/theme/colors.js`: Solar Orange #ED8936, amber #F6AD55, cream #FFF9F2, light text #221408, dark background #121212, dark surface #1E1E1E. Orange button labels use dark ink for readability.
