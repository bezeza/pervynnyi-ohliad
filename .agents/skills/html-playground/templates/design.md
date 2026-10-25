# Design / Prototype Template

Use this template for visual design decisions, component explorers, animation tuning, layout comparisons, and design system artifacts.

## Layout

```
+-------------------+----------------------+
|                   |                      |
|  Controls         |  Live component /    |
|  grouped by:      |  layout preview      |
|  - Spacing        |  (renders in a       |
|  - Color          |   mock page or       |
|  - Typography     |   isolated card)     |
|  - Shadow/Border  |                      |
|  - Animation      |                      |
|                   +----------------------+
|                   |  Prompt output       |
|                   |  [ Copy Prompt ]     |
+-------------------+----------------------+
```

## Control types by decision

| Decision | Control | Example |
|---|---|---|
| Sizes, spacing, radius | Slider | border-radius 0-24px |
| On/off features | Toggle | show border, hover effect |
| Choosing from a set | Dropdown | font-family, easing curve |
| Colors | Hue + saturation + lightness sliders | shadow color, accent |
| Layout structure | Clickable cards | sidebar-left / top-nav / no-nav |
| Responsive behavior | Viewport-width slider | watch grid reflow at breakpoints |

## Preview rendering

Apply state values directly to preview elements inline:

```javascript
function renderPreview() {
  const el = document.getElementById('preview');
  el.style.borderRadius = state.radius + 'px';
  el.style.padding = state.padding + 'px';
  el.style.boxShadow = state.shadow
    ? `0 ${state.shadowY}px ${state.shadowBlur}px rgba(0,0,0,${state.shadowOpacity})`
    : 'none';
}
```

Show the preview on both light and dark backgrounds if relevant. Include a context toggle (light/dark/both).

## Prompt output for design

Frame it as a direction, not a spec sheet:

> "Update the card to feel soft and elevated: 12px border-radius, 24px horizontal padding, a medium box-shadow (0 4px 12px rgba(0,0,0,0.1)). On hover, lift it with translateY(-1px) and deepen the shadow slightly."

Match the user's framework vocabulary (Tailwind classes, SwiftUI modifiers, raw CSS).

## Multiple-design comparison variant

When comparing 6+ design options, use a grid layout instead of controls:

```
+----------+----------+----------+
| Design A | Design B | Design C |
| (card)   | (card)   | (card)   |
|----------|----------|----------|
| Design D | Design E | Design F |
| (card)   | (card)   | (card)   |
+----------+----------+----------+
| [Selected: Design B]           |
| Prompt: "Use the rounded       |
| elevated style with..."        |
| [ Copy Prompt ]                |
+---------------------------------+
```

Each card is clickable. Selecting one generates a prompt describing that design.

## Example topics

- Button style explorer (radius, padding, weight, hover/active states)
- Card component (shadow depth, radius, content layout, image treatment)
- Layout builder (sidebar width, content max-width, header height, grid columns)
- Typography scale (base size, ratio, line heights across h1-body-caption)
- Color palette generator (primary hue, derive secondary/accent/surface)
- Dashboard density (airy-to-compact slider that scales everything proportionally)
- Animation tuner (easing, duration, transform, with replay button)
