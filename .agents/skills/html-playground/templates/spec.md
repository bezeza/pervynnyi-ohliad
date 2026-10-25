# Spec / Plan / Exploration Template

Use this template for implementation plans, architecture specs, brainstorming explorations, or option comparisons.

## Layout options

Choose the layout that best fits the content:

### Tabbed document
Best for multi-section specs where each section is substantial.

```
+--------------------------------------------+
|  [Overview] [Architecture] [API] [Risks]   |
|--------------------------------------------|
|                                            |
|  Active tab content with:                  |
|  - SVG diagrams                            |
|  - Code snippets                           |
|  - Tables                                  |
|  - Collapsible details                     |
|                                            |
+--------------------------------------------+
```

### Comparison grid
Best for exploring multiple approaches side-by-side.

```
+----------+----------+----------+
| Option A | Option B | Option C |
|----------|----------|----------|
| Pros     | Pros     | Pros     |
| Cons     | Cons     | Cons     |
| Diagram  | Diagram  | Diagram  |
| Code     | Code     | Code     |
+----------+----------+----------+
```

### Scrollable narrative with sticky nav
Best for detailed implementation plans.

```
+---------+----------------------------------+
|         |                                  |
| Sticky  |  Scrollable content              |
| nav:    |  with anchored sections          |
| Phase 1 |                                  |
| Phase 2 |  Each section has:               |
| Phase 3 |  - Goal                          |
| Risks   |  - Diagram                       |
|         |  - Code snippets                 |
|         |  - Checklist                     |
+---------+----------------------------------+
```

## Content elements

| Element | Implementation |
|---|---|
| Diagrams | Inline SVG with labeled nodes, arrows, color-coded layers |
| Code snippets | `<pre><code>` with `<span>` color classes for syntax highlighting |
| Callouts | Colored left-border divs for warnings, notes, tips |
| Checklists | Styled `<ul>` with checkbox icons (not interactive — this is a reference doc) |
| Tables | HTML `<table>` with alternating row colors and sticky header |
| Collapsible sections | `<details><summary>` for optional depth |

## SVG diagram guidelines

- Use rounded rectangles for components/modules
- Color-code by layer or concern (blue = data, green = API, orange = UI)
- Label all arrows with relationship type
- Include a legend
- Keep diagrams readable: 8-15 nodes max per diagram, split into multiple diagrams if needed

## Example topics

- Implementation plan for a new feature
- Architecture exploration: monolith vs. microservices vs. serverless
- API design with endpoint specs and data flow
- Migration plan with phases, risks, and rollback strategies
- Design mockups laid out in a grid for comparison
