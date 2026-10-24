# Custom Editing Interface Template

Use this template when the user needs a purpose-built throwaway editor for a specific piece of data. Not a product or a reusable tool — a single HTML file built for this one task.

## Layout

Varies by task, but always ends with an export:

```
+--------------------------------------------+
|                                            |
|  Purpose-built editing interface           |
|  (drag-and-drop, forms, toggles, etc.)    |
|                                            |
+--------------------------------------------+
|  [ Copy as JSON ]  [ Copy as Prompt ]      |
|  [ Copy as Markdown ]                      |
+--------------------------------------------+
```

## Key principle

The trick is always to end with an export: a "Copy as JSON", "Copy as Prompt", or "Copy as Markdown" button that turns whatever the user did in the UI back into something they can paste into their agent or codebase.

## Common patterns

### Drag-and-drop reorderer

For prioritizing, triaging, or bucketing items.

- Render items as draggable cards
- Define columns/buckets (e.g., Now / Next / Later / Cut)
- Pre-sort by best guess
- Export: markdown list grouped by bucket with rationale

### Form-based config editor

For structured config with constraints (feature flags, env vars, JSON/YAML).

- Group fields by area
- Show dependencies between fields
- Warn if enabling a flag whose prerequisite is off
- Export: diff of changed keys only

### Side-by-side tuner

For prompts, templates, or copy with live preview.

- Editable text on the left with variable slots highlighted
- Live-rendered output on the right (fill template with sample inputs)
- Token/character counter
- Export: the edited text

### Annotation interface

For reviewing traces, datasets, transcripts, or documents.

- Display items one at a time or in a scrollable list
- Per-item actions: approve/reject/tag/comment
- Progress indicator (12/50 reviewed)
- Export: JSON array of decisions

## State management

Always persist state in a single object and re-render on every change:

```javascript
const state = {
  items: [...],
  buckets: { now: [], next: [], later: [], cut: [] },
  decisions: {}
};

function updateAll() {
  renderInterface();
  updateExport();
}
```

## Export button pattern

```javascript
function copyExport(format) {
  let output;
  if (format === 'json') output = JSON.stringify(state, null, 2);
  if (format === 'markdown') output = generateMarkdown(state);
  if (format === 'prompt') output = generatePrompt(state);

  navigator.clipboard.writeText(output);
  showFeedback('Copied!');
}
```

## Example topics

- Reprioritize 30 tickets across Now / Next / Later / Cut columns
- Feature flag config editor with dependency warnings
- System prompt tuner with side-by-side preview and token counter
- Dataset curation: approve/reject rows, tag examples, export selection
- Cron schedule builder with visual timeline
- Regex builder with sample strings and live match highlighting
- Color palette picker for a design system
