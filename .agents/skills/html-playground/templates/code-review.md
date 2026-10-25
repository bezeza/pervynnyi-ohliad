# Code Review Template

Use this template for PR walkthroughs, diff annotations, code understanding documents, and code review with interactive commenting.

## Layout

```
+-------------------+----------------------------------+
|                   |                                  |
|  File list +      |  Diff content                    |
|  metadata:        |  (files with hunks)              |
|  - Commit info    |  with line numbers               |
|  - Files changed  |  and +/- indicators              |
|  - Stats          |  Click lines to comment          |
|                   |                                  |
+-------------------+----------------------------------+
|  Prompt Output Panel (fixed bottom)                  |
|  [ Copy All ]                                        |
+------------------------------------------------------+
```

## Diff rendering

Parse diff data into a structured format:

```javascript
const diffData = [
  {
    file: "path/to/file.py",
    hunks: [
      {
        header: "@@ -41,13 +41,13 @@ function context",
        lines: [
          { type: "context", oldNum: 41, newNum: 41, content: "unchanged line" },
          { type: "deletion", oldNum: 42, newNum: null, content: "removed line" },
          { type: "addition", oldNum: null, newNum: 42, content: "added line" },
        ]
      }
    ]
  }
];
```

## Line type styling

| Type | Background | Prefix |
|---|---|---|
| `context` | transparent | ` ` (space) |
| `addition` | green tint (rgba(46,160,67,0.15)) | `+` |
| `deletion` | red tint (rgba(248,81,73,0.15)) | `-` |
| `hunk-header` | blue tint | `@@` |

## Interactive comment system

Each diff line is clickable. Clicking opens a textarea below the line for review comments.

```javascript
const comments = {}; // { lineId: commentText }

function selectLine(lineId, lineEl) {
  lineEl.classList.add('selected');
  document.getElementById(`comment-box-${lineId}`).classList.add('active');
}

function saveComment(lineId) {
  const textarea = document.getElementById(`textarea-${lineId}`);
  comments[lineId] = textarea.value.trim();
  renderDiff();
  updatePromptOutput();
}
```

## Prompt output

Generate structured code review feedback:

```
Code Review Comments:

file: src/utils/handler.py:45
Code: subagent_id = tracker.register()
Comment: Consider adding error handling for registration failures.

file: src/api/routes.py:112
Code: return Response(data, status=200)
Comment: Should validate data shape before returning.
```

## Non-interactive variant

For read-only code explainers (not review), skip the comment system and instead:

- Add margin annotations explaining key lines
- Use SVG diagrams showing call flow between functions
- Include a "Key Changes" summary section with colored severity indicators
- Group changes by theme (refactoring, bug fix, new feature)

## Pre-populating with real data

For a specific commit or PR:

1. Run `git show <commit> --format="%H%n%s%n%an%n%ad" -p` or `git diff <base>...<head>`
2. Parse the output into the `diffData` structure
3. Include commit metadata in the header

## Example topics

- PR review with inline commenting
- Code walkthrough explaining what a complex function does
- Architecture diagram + annotated code for a new module
- "What changed in this release" summary with grouped diffs
