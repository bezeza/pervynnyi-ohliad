# Playground Template

Use this template when the user asks for an interactive playground, explorer, or visual tool — especially when the input space is large, visual, or structural and hard to express as plain text.

## Layout

```
+-------------------+----------------------+
|                   |                      |
|  Controls         |  Live preview        |
|  grouped by       |  (renders instantly  |
|  concern:         |   on every change)   |
|  - Group A        |                      |
|  - Group B        |                      |
|  - Presets        |                      |
|                   +----------------------+
|                   |  Prompt output       |
|                   |  [ Copy Prompt ]     |
+-------------------+----------------------+
```

## Control types by decision

| Decision | Control | Example |
|---|---|---|
| Continuous values | Slider | border-radius 0-24px, opacity 0-1 |
| On/off features | Toggle | show border, enable animation |
| Choosing from a set | Dropdown or radio | font-family, easing curve |
| Colors | Color picker or HSL sliders | accent color, shadow color |
| Layout structure | Clickable cards | sidebar-left / top-nav / grid |
| Responsive behavior | Viewport-width slider | watch reflow at breakpoints |

## Presets

Include 3-5 named presets. Each preset snaps all controls to a cohesive combination. Show presets as clickable chips/buttons at the top of the controls panel.

```javascript
const PRESETS = {
  'Minimal': { radius: 4, shadow: false, padding: 16 },
  'Elevated': { radius: 12, shadow: true, padding: 24, shadowBlur: 12 },
  'Bold': { radius: 0, shadow: true, padding: 32, shadowBlur: 24 },
};
```

## Preview rendering

Apply state values directly to preview elements. The preview must update on every control change without any delay or "Apply" button.

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

## Prompt output

Frame as a natural-language instruction, not a spec sheet. Only include non-default values:

> "Update the card to feel soft and elevated: 12px border-radius, 24px horizontal padding, a medium box-shadow (0 4px 12px rgba(0,0,0,0.1)). On hover, lift it with translateY(-1px) and deepen the shadow slightly."

If the user is working in a specific framework (Tailwind, SwiftUI, etc.), match the vocabulary.

## Example topics

- Button style explorer (radius, padding, weight, hover/active states)
- Card component (shadow depth, radius, content layout, image)
- Animation tuner (easing curve, duration, transform, delay)
- Typography scale (base size, ratio, line heights)
- Color palette generator (primary hue, derive secondary/accent/surface)
- Game balance tuner (health, damage, cooldowns, with simulated outcomes)
- System prompt tuner (side-by-side editable prompt + live template fill + token counter)
