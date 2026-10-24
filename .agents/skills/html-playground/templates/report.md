# Report / Research / Explainer Template

Use this template for status reports, incident reports, research summaries, learning materials, and code explainers.

## Layout options

### Dashboard report
Best for status reports and summaries with metrics.

```
+--------------------------------------------+
|  Title + date + author                     |
|--------------------------------------------|
|  [KPI 1]  [KPI 2]  [KPI 3]  [KPI 4]      |
|  (metric cards with trend indicators)      |
|--------------------------------------------|
|  [Summary] [Details] [Timeline] [Risks]    |
|--------------------------------------------|
|                                            |
|  Active tab content                        |
|                                            |
+--------------------------------------------+
```

### Explainer
Best for teaching a concept or explaining how code works.

```
+--------------------------------------------+
|  Title                                     |
|--------------------------------------------|
|                                            |
|  Section 1: Overview                       |
|  - SVG diagram of the system               |
|  - Key concepts table                      |
|                                            |
|  Section 2: How it works                   |
|  - Step-by-step with diagrams              |
|  - Annotated code snippets                 |
|                                            |
|  Section 3: Gotchas                        |
|  - Warning callouts                        |
|  - Edge cases                              |
|                                            |
+--------------------------------------------+
```

### Slideshow / deck
Best for leadership-facing reports or presentations.

```
+--------------------------------------------+
|  < Slide 3 of 12 >                        |
|--------------------------------------------|
|                                            |
|  Large heading                             |
|  Key visual (SVG diagram or chart)         |
|  2-3 bullet points max                     |
|                                            |
+--------------------------------------------+
|  [Prev]  [1] [2] [3] ...  [Next]          |
+--------------------------------------------+
```

Use keyboard arrow keys for navigation. Keep slides sparse — one idea per slide.

## Content elements

| Element | Use for |
|---|---|
| Metric cards | KPIs with big number + label + trend arrow |
| Timeline | Horizontal or vertical event sequence with dates and descriptions |
| SVG charts | Bar charts, line charts, pie charts — all inline SVG, no libraries |
| Annotated code | Code blocks with numbered callouts and side explanations |
| Before/After | Side-by-side comparison blocks with diff highlighting |
| Callout boxes | Info (blue), Warning (amber), Error (red), Success (green) |

## SVG chart guidelines

Build simple charts with inline SVG. No charting libraries.

- Bar charts: `<rect>` elements with labels and values
- Line charts: `<polyline>` with `<circle>` data points
- Pie charts: `<path>` arcs with percentage labels
- Always include axis labels and a legend

## Example topics

- Weekly status report for leadership
- Incident post-mortem with timeline and root cause analysis
- "How does our rate limiter work?" code explainer
- Research summary: comparing 3 authentication approaches
- Onboarding guide for a new team member joining the project
