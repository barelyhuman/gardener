---
name: garden
description: Inspect the codebase and report maintenance or performance findings for a given focus area.
---

Given the `focus` argument (e.g. "general maintenance", "tests", "dependencies", "docs", "performance"):

1. Survey the repository structure with `git status`, file listing, and search tools
2. Identify items aligned with the focus (see focus-specific sections below)
3. Prefer suggestions over risky auto-fixes in this version
4. If a safe fix is obvious and low-risk, apply it and note what changed

## Focus: general maintenance, tests, dependencies, docs

When focus is not `"performance"`, identify maintenance items aligned with the focus:

- Stale or missing dependencies
- Test gaps or failing patterns
- Documentation drift
- Small, safe fixes that match project conventions

## Focus: performance

When `focus` is `"performance"`:

1. **Detect language(s)** from project markers (`package.json`, `tsconfig.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`, etc.) and file extensions. Note primary vs secondary languages in the summary.
2. **Prioritize hot paths** — route handlers, middleware, loops over large collections, build/bundling code, database query layers, render paths, and frequently called utilities.
3. **Search for anti-patterns** using grep and semantic search, applying the language-specific checklist below for detected languages.
4. **Suggest simpler alternatives** — each finding should name the pattern, show a concise before/after or equivalent rewrite, and explain the performance tradeoff in plain language.
5. **Severity guidance**:
   - **high** — repeated work in a hot path (e.g. O(n²) lookup in a loop, sync I/O blocking an async handler)
   - **medium** — clear inefficiency in non-critical but repeated code (e.g. chained `.filter().map()` where one loop suffices)
   - **low** — micro-optimization or readability tradeoff; mention only if the fix is trivial
6. **Safe fixes** — apply only when the rewrite is behavior-preserving and low-risk; otherwise suggest only.

### Language-specific checklists

Apply checklists for each detected language.

#### JavaScript / TypeScript

- `await` in loops instead of `Promise.all`
- `.includes()` on arrays inside loops (prefer `Set` or `Map`)
- Chained `.filter().map().reduce()` where a single loop suffices
- `JSON.parse(JSON.stringify())` for cloning
- RegExp or literal objects recreated inside loops
- String `+=` concatenation in loops (prefer array join or template accumulation)
- Unnecessary spread/rest in hot loops
- Sync `fs.*Sync` calls in async handlers
- Unbounded cache or listener growth

#### Python

- Repeated list membership (`x in list`) inside loops
- List comprehension where a generator suffices
- Regex compiled on every call instead of once
- Pandas row-wise `apply` where vectorization works
- Loading entire files when streaming would work
- Imports or setup work inside tight loops

#### Go

- Allocations inside hot loops
- Unnecessary string ↔ `[]byte` conversions
- Missing pre-sized slices or maps
- Mutex where atomic or read-only access would do
- `defer` in tight loops

#### Rust

- Unnecessary `.clone()`
- Collecting iterators when lazy evaluation would work
- `String` where `&str` suffices
- Lock contention patterns

#### Generic (any language)

- N+1 queries
- Missing pagination on large result sets
- Redundant serialization/deserialization
- Missing cache on expensive pure computations
- Blocking calls in concurrent or async paths

### Performance finding format

Use the standard schema, with these conventions:

- `area`: `"<file>:<line> — <pattern name>"` (e.g. `"src/api/users.ts:84 — await in loop"`)
- `suggestion`: pattern explanation, simpler rewrite (before/after if helpful), and when *not* to apply (e.g. if clarity matters more at this scale)

## Output

Return a structured result with:

- `summary`: one-paragraph overview of what you found
- `findings`: array of `{ area, severity, suggestion }` where severity is low, medium, or high
- `actions_taken`: list of concrete actions performed (empty if read-only)
