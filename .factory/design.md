# Code Lesson Replay — visual thesis

## Direction: annotated bench sheet

Code Lesson Replay uses a **neo-brutalist utility** system modelled on a tutor's marked-up lab sheet: direct, high-contrast, a little physical, and built for inspecting evidence rather than admiring chrome. Thick black rules separate moments like cuts on an edit bench. Acid yellow marks the student's active hypothesis; coral flags a failed run; cyan marks evidence that held. The hard edges make sequence and provenance unmistakable without looking like a generic developer dashboard.

The treatment is deliberately single-mode. A warm paper canvas and near-black ink keep long replay reading comfortable, while saturated accents are reserved for state and action. This keeps the extension small and prevents theme state from changing the apparent meaning of annotations.

## Tokens

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Canvas | `--paper` | `#F4F0E6` | Main background, like a lesson worksheet |
| Surface | `--white` | `#FFFDF7` | Editable and raised work areas |
| Ink | `--ink` | `#171713` | Text, borders, focus contrast |
| Muted ink | `--muted` | `#5B584F` | Supporting text (7.0:1 on paper) |
| Hypothesis | `--signal` | `#F4D43A` | Primary action and reasoning markers |
| Evidence | `--cyan` | `#54D6D0` | Successful runs and file evidence |
| Failure | `--coral` | `#F46B55` | Errors, excluded or risky content |
| Success | `--green` | `#237A49` | Confirmations, paired with text/icon |
| Focus | `--blue` | `#1746B4` | 3 px visible keyboard focus ring |

All body-text combinations meet WCAG AA. State always has a word, icon, or pattern in addition to colour.

## Type and spacing

- Display and interface: `Arial Black`, `Arial`, system sans-serif. Its blunt shapes carry the neo-brutalist voice without a downloaded font.
- Code and measurements: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace. Tabular figures make run times and sequence numbers stable.
- Scale: 16 px body, 18 px lead, 22 px section, 32–56 px display, with 1.45–1.6 line-height for reading.
- Spacing: 4 px base rhythm. Primary gaps are 8, 12, 16, 24, 32, 48, and 72 px. Controls are at least 44 px high; borders are 2 px; raised elements use a hard 4 px offset shadow.
- Reading measures stop near 70 characters. At 390 px, the two-column recorder/playback workspace becomes a single sequence and secondary decoration drops below the task.

## Interaction grammar

- The primary action is a yellow, ink-bordered block with a hard 4 px shadow. Pressing it moves it to the shadow origin; no soft elevation or gradients.
- Steps are numbered physical slips. Selecting a step shifts its border and marker, preserving its timeline origin.
- Sensitive text is masked before it is persisted. A visible scrub report names how many values were replaced; exclusion is an explicit switch next to each command.
- Playback supports Previous/Next and left/right arrows. Record forms use native controls and submit with Ctrl/Cmd+Enter where useful.
- Import, verification, offline, empty, and error states always name the next available action.

## Motion policy

Interface changes use 160–220 ms transform/opacity transitions with physical origin: cards rise from their hard shadow, timeline selection moves one step, and notices enter from the edge that owns them. Nothing loops. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling are removed and state changes are instant; hierarchy remains through outline, labels, and position.

## Asset plan and provenance

The hero is one original, generated editorial still-life: stacked paper replay slips, a compact terminal window, diff fragments, masking tape, and an oversized yellow hypothesis marker on a warm workbench. It explains the product's central object—a short, inspectable reasoning trail—without pretending the app records a real screen. UI icons are hand-authored inline SVG with square caps and a consistent 2 px stroke.

### Hero prompt sheet

- Use case: `stylized-concept`
- Asset type: wide landing-page hero illustration
- Subject/world: a physical code-review workbench made from stacked paper timeline cards, simplified terminal panes, red/green diff strips, black annotation arrows, and one yellow hypothesis tab; no people
- Style/materials: tactile cut-paper editorial diorama, screen-printed ink, slightly imperfect paper edges, crisp neo-brutalist geometry
- Composition: 3:2 landscape, shallow isometric view, central stack with breathing room at edges, no readable UI text
- Light/lens: hard overhead studio light, short graphic shadows, 45 mm editorial product lens
- Palette words: warm paper, carbon black, acid yellow, evidence cyan, failure coral
- Negative list: photorealistic computer brands, logos, legible text, letters, watermarks, people, hands, gradients, glassmorphism, purple, excessive tiny details
- Exact generation prompt: “A wide landing-page hero illustration of a physical code-review workbench: stacked paper timeline cards, simplified terminal panes, red and green diff strips, black annotation arrows and one oversized acid-yellow hypothesis tab. No people. Tactile cut-paper editorial diorama with screen-printed ink, slightly imperfect paper edges, crisp neo-brutalist geometry. Shallow isometric product view, central stack with breathing room at the edges, hard overhead studio lighting and short graphic shadows, warm paper, carbon black, evidence cyan and failure coral. No readable text, no letters, no logos, no brands, no watermark, no gradients, no glassmorphism, no purple.”

Generated with the Factory Azure image deployment (`factory-image`) on 2026-08-28 using `/opt/fleet/lib/gen-image.sh`. The generated image is original for this product. Source PNG and prompt sidecar live in `assets/src/`; optimized WebP/AVIF derivatives ship on the site. Generated-imagery disclosure appears in the site footer.
