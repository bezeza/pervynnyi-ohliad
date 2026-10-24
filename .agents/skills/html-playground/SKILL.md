---
name: html-playground
description: Generate rich interactive HTML files instead of markdown. Use for specs, reports, code reviews, design prototypes, playgrounds, and custom editing interfaces. Produces self-contained single-file HTML with live previews, interactive controls, and copyable prompt output.
---

# HTML Playground Builder

Generate self-contained HTML files instead of markdown whenever the output benefits from richer visualization, interactivity, or shareability.

## When to use this skill

Use HTML output when the user asks for any of these, or when the output would clearly benefit from visual richness:

- **Specs, plans, exploration** — architecture docs, implementation plans, brainstorming, option comparisons
- **Reports and research** — status reports, incident reports, research summaries, code explainers
- **Code review** — PR walkthroughs, diff annotations, code understanding documents
- **Design and prototypes** — component explorers, animation tuners, layout comparisons, design system artifacts
- **Interactive playgrounds** — visual tools with controls, live preview, and prompt output for pasting back
- **Custom editing interfaces** — drag-and-drop reorderers, config editors, prompt tuners, dataset curators

Do NOT use this skill for simple factual answers, short code snippets, or when the user explicitly asks for markdown.

## Choosing the output type

1. **Identify the category** from the user's request
2. **Load the matching template** from `templates/`:
   - `templates/playground.md` — Interactive playground with controls + live preview + prompt output
   - `templates/spec.md` — Specs, plans, brainstorming, and option exploration
   - `templates/report.md` — Reports, research, learning materials, and explainers
   - `templates/code-review.md` — Diff review, PR walkthroughs, code understanding
   - `templates/design.md` — Visual design decisions, prototypes, component explorers
   - `templates/custom-editor.md` — Purpose-built editing interfaces with export
3. **Follow the template** to build the HTML file. Adapt if the topic doesn't fit any template cleanly.
4. **Open in browser** after writing the file.

## Core requirements (every HTML file)

- **Single HTML file.** Inline all CSS and JS. No external dependencies or CDN links.
- **Dark theme by default.** System font for UI, monospace for code/values. Minimal chrome.
- **Responsive.** Readable on desktop and mobile.
- **Sensible structure.** Use tabs, collapsible sections, or grids to organize dense information. Never produce a wall of text.
- **SVG for diagrams.** Use inline SVG for flowcharts, architecture diagrams, data flow, and illustrations. Do not use ASCII art.
- **Syntax highlighting.** Color-code code snippets with `<span>` classes. Do not use external highlighters.

## Additional requirements for interactive playgrounds

When the output is a playground (controls + preview + prompt):

- **Live preview.** Updates instantly on every control change. No "Apply" button.
- **Prompt output.** Natural language, not a value dump. Only mentions non-default choices. Includes enough context to act on without seeing the playground. Updates live.
- **Copy button.** Clipboard copy with brief "Copied!" feedback.
- **Sensible defaults + presets.** Looks good on first load. Include 3-5 named presets that snap all controls to a cohesive combination.

### State management pattern

Keep a single state object. Every control writes to it, every render reads from it.

```javascript
const state = { /* all configurable values */ };

function updateAll() {
  renderPreview();
  updatePrompt();
}
// Every control calls updateAll() on change
```

### Prompt output pattern

```javascript
function updatePrompt() {
  const parts = [];

  // Only mention non-default values
  if (state.borderRadius !== DEFAULTS.borderRadius) {
    parts.push(`border-radius of ${state.borderRadius}px`);
  }

  // Use qualitative language alongside numbers
  if (state.shadowBlur > 16) parts.push('a pronounced shadow');
  else if (state.shadowBlur > 0) parts.push('a subtle shadow');

  prompt.textContent = `Update the card to use ${parts.join(', ')}.`;
}
```

## Additional requirements for custom editing interfaces

When the output is a purpose-built editor:

- **Export button.** Always end with an export: "Copy as JSON", "Copy as prompt", or "Copy as markdown" that turns whatever the user did in the UI back into something pasteable.
- **Purpose-built.** Not a general-purpose tool. Built for this one specific piece of data or task.
- **Visual feedback.** Drag-and-drop, color-coding, inline validation, dependency warnings.

## Common mistakes to avoid

- Prompt output is just a value dump — write it as a natural instruction
- Too many controls at once — group by concern, hide advanced in a collapsible section
- Preview doesn't update instantly — every control change must trigger immediate re-render
- No defaults or presets — starts empty or broken on load
- External dependencies — if CDN is down, the file is dead
- Prompt lacks context — include enough that it's actionable without the playground
- Wall of text — use tabs, grids, collapsible sections, color, and SVG to organize
- ASCII diagrams — always use SVG instead
