# Website Maintenance Agent Instructions

## Purpose
This file instructs any AI coding agent (Claude Code, Cursor, Copilot Workspace, etc.)
working on this website's codebase to continuously remove dead code and keep the
site optimized for performance, size, and maintainability.

---

## 1. Dead Code Removal

When making changes anywhere in the codebase, the agent MUST:

1. **Detect unused code before committing changes**
   - Unused variables, functions, classes, and imports.
   - Unused CSS selectors/classes not referenced in any HTML/JS/JSX/TSX file.
   - Unreachable code branches (e.g. code after `return`, always-false conditionals).
   - Commented-out code blocks older than the current change — remove unless
     explicitly tagged `// KEEP:` or `<!-- KEEP: -->`.
   - Unused npm/yarn/pnpm dependencies in `package.json` (cross-check with actual imports).
   - Orphaned files: components, images, fonts, or assets not imported/referenced anywhere.
   - Duplicate utility functions or components that do the same thing (consolidate to one).

2. **Tools to use for detection (run before finalizing any change)**
   - JS/TS: `eslint` with `no-unused-vars`, `ts-prune`, or `knip` for unused exports/files.
   - CSS: `purgecss` or `uncss` to find unused selectors (validate before deleting —
     don't strip classes toggled dynamically via JS).
   - Images/assets: grep-search filenames across the repo before deleting.
   - Dependencies: `depcheck` to flag unused packages.

3. **Safety rules**
   - Never delete code without confirming it's unreferenced anywhere in the repo
     (including dynamic references like `require(variable)`, template strings, or CMS content).
   - If unsure whether something is dead code, flag it in the PR/commit message
     instead of silently deleting it.
   - Keep one rollback-safe commit per cleanup pass — don't mix dead-code removal
     with feature changes in the same commit.

---

## 2. Ongoing Optimization

On every meaningful change, check and apply the following where relevant:

### Performance
- Lazy-load images, videos, and below-the-fold components (`loading="lazy"`,
  dynamic `import()`, React `lazy`/`Suspense`).
- Compress and serve modern image formats (WebP/AVIF) with fallbacks.
- Minify and bundle CSS/JS for production builds; ensure tree-shaking is enabled.
- Avoid render-blocking scripts — use `defer`/`async` or move to end of `<body>`.
- Cache static assets with appropriate headers (`Cache-Control`, hashed filenames).
- Audit bundle size after dependency changes (`webpack-bundle-analyzer`,
  `source-map-explorer`, or built-in Vite/Next.js analyzers).

### Code Quality
- Keep components/functions small and single-purpose; refactor large files
  (>300–400 lines) into smaller modules when touched.
- Ensure consistent formatting via Prettier/ESLint before commit.
- Avoid introducing new dependencies for functionality achievable with a few
  lines of native code.

### SEO & Accessibility (secondary optimization pass)
- Alt text on all images, semantic HTML tags, proper heading hierarchy.
- Valid meta tags (title, description, canonical, Open Graph).
- Check Lighthouse/PageSpeed scores don't regress after changes.

---

## 3. Workflow for the Agent

For every task involving code changes, follow this sequence:

1. **Before editing**: scan the affected files/modules for existing dead code
   or optimization opportunities in the same area you're touching.
2. **Make the requested change.**
3. **Cleanup pass**: remove any dead code you introduced or discovered nearby
   (imports no longer used after your edit, etc.).
4. **Run checks**: lint, unused-export scan, and a build to confirm nothing broke.
5. **Report**: summarize what was removed/optimized alongside the main change,
   so the user can review before merging.

Do not perform large, repo-wide dead-code sweeps unprompted in the middle of
an unrelated task — keep cleanup scoped to what you touched, unless the user
explicitly asks for a full audit.

---

## 4. Full-Repo Audit Mode (only when explicitly requested)

When the user asks for a full cleanup/optimization pass:
1. Run all detection tools listed in Section 1 across the entire repo.
2. Produce a report categorizing findings: `Safe to remove`, `Needs review`,
   `Possible false positive`.
3. Apply only the `Safe to remove` items automatically; list the rest for
   manual confirmation.
4. Re-run the build and test suite after changes to confirm nothing broke.
5. Summarize size/performance impact (e.g. bundle size before vs. after).
