# Implementation Plan: Terminal Portfolio

## Overview

Build a static Next.js site deployed to GitHub Pages that emulates an interactive command-line terminal. The implementation is broken into incremental steps: project scaffolding → type definitions and data → core terminal UI → command system → AI integration → responsive/visual polish → CI/CD pipeline. Each step leaves the app in a runnable state.

Language: **TypeScript** (Next.js with static export).

---

## Tasks

- [x] 1. Scaffold project and configure static export
  - Initialize Next.js project with TypeScript and Tailwind CSS (`npx create-next-app@latest --typescript --tailwind`)
  - Configure `next.config.js` with `output: 'export'` and `images: { unoptimized: true }`; add `basePath` / `assetPrefix` placeholders commented out for project-repo deployments
  - Add `next/font` import for JetBrains Mono / Fira Code in `src/app/layout.tsx`; apply the font variable to `<body>` with a monospace fallback
  - Create `public/bg.jpg` placeholder and `public/favicon.ico`
  - Add `.env.local.example` with `NEXT_PUBLIC_GEMINI_KEY=` for developer reference
  - _Requirements: 17.3, 21.1, 21.5, 21.6_

- [x] 2. Define types and data layer
  - [x] 2.1 Create `src/types/terminal.ts` with `Theme`, `Lang`, `OutputType`, and `HistoryEntry` interfaces
    - Export `Theme = 'dark' | 'light' | 'matrix'`, `Lang = 'es' | 'en'`
    - Export `OutputType = 'input' | 'output' | 'error' | 'banner' | 'loader'`
    - Export `HistoryEntry` with `id: string`, `type: OutputType`, `content: string | ReactNode`, `timestamp: number`
    - _Requirements: 20.1_

  - [x] 2.2 Create `src/data/profile.ts` with fully-typed profile data
    - Define and export `WorkEntry`, `Project`, `SkillCategory`, `ContactChannel`, `SocialLink`, `LangProfile`, `ProfileData` interfaces
    - Export `profile: ProfileData` with populated `es` and `en` objects covering bio, whoami (≤160 chars, no newlines), experience, projects, skills, contact, social, and cvUrl
    - _Requirements: 20.1, 20.3, 3.1, 4.1, 5.1, 6.1, 7.1, 10.1, 11.1, 12.1_

- [ ] 3. Implement Command_Registry and core command handlers
  - [-] 3.1 Create `src/lib/commands/index.ts` — Command_Registry
    - Define `CommandContext` (`lang`, `theme`, `setTheme`, `setLang`), `CommandResult` union (`text | jsx | clear | async`), and `CommandDefinition` interfaces
    - Implement `resolveCommand(raw, ctx)`: trim → split on first space → lowercase token → Map lookup → unknown-command error fallback (never throws, _Req. 1.9, 16.1_)
    - Implement compound-command parsing for `download cv` and `ask <question>` as described in the design
    - _Requirements: 16.1, 1.9, 20.2, 20.3_

  - [x] 3.2 Write property test for unknown-command safety (Property 4)
    - **Property 4: Unknown commands never throw, always show an error**
    - Use `fc.string()` filtered to exclude registered command names; assert result type is `'error'`, contains the input token, and no exception is thrown
    - **Validates: Requirements 1.9, 16.1**

  - [-] 3.3 Implement `help` command (`src/lib/commands/help.ts`)
    - Return all registered command names sorted alphabetically, each padded to 20 chars with `padEnd(20)` followed by description
    - Return a "no commands available" message when registry is empty
    - _Requirements: 2.1, 2.2, 2.3_

  - [~] 3.4 Write property test for `help` alphabetical ordering (Property 5)
    - **Property 5: `help` output is always alphabetically sorted**
    - Use `fc.array(fc.record({ name: fc.string({ minLength: 1 }), description: fc.string() }), { minLength: 1 })`; assert names are in lexicographic order and each line pads name to exactly 20 characters
    - **Validates: Requirements 2.1, 2.2**

  - [-] 3.5 Implement content commands: `about`, `whoami`, `experience`, `skills`, `projects`, `contact`, `social`
    - Each handler reads from `profile[ctx.lang]` with fallback to `profile['es']`; if neither exists, returns a plain error string (never undefined, never throws)
    - `experience`: format each entry as `──────… | company | role | from–to\ndescription` separated by divider lines
    - `skills`: format each category as `▶ CATEGORY_NAME\n  skill · skill · …`
    - `projects` and `contact`: return JSX with `<a target="_blank" rel="noopener noreferrer">` for every URL
    - `social`: same anchor treatment; each entry includes name, ASCII icon, and URL
    - _Requirements: 3.1–3.3, 4.1–4.3, 5.1–5.3, 6.1–6.3, 7.1–7.3, 10.1–10.2, 11.1–11.2, 20.2–20.4_

  - [~] 3.6 Write property test for content command lang/fallback (Property 6)
    - **Property 6: Content commands return data for the active lang with `es` fallback**
    - Use `fc.constantFrom('es', 'en')` × `fc.constantFrom('about', 'experience', 'projects', 'skills', 'contact', 'social', 'whoami')`; assert result is never undefined and never throws
    - **Validates: Requirements 3.1, 3.3, 4.1, 4.3, 5.1, 5.3, 6.1, 6.3, 7.1, 7.3, 10.1, 10.2, 20.4**

  - [~] 3.7 Write property test for `experience` separator invariant (Property 7)
    - **Property 7: `experience` output has separators between all entries**
    - Use `fc.array(workEntryArbitrary, { minLength: 2 })`; assert that between every pair of adjacent entries there is at least one separator character sequence
    - **Validates: Requirements 4.2**

  - [~] 3.8 Write property test for `skills` category differentiation (Property 8)
    - **Property 8: `skills` output differentiates category names from skill items**
    - Use `fc.array(skillCategoryArbitrary, { minLength: 1 })`; assert each category name line is uppercase and/or prefixed with `▶`
    - **Validates: Requirements 6.2**

  - [~] 3.9 Write property test for safe anchor elements (Property 9)
    - **Property 9: All external URLs render as safe anchor elements**
    - Use `fc.array(projectArbitrary, { minLength: 1 })`; assert every URL in the JSX output is wrapped in `<a>` with `target="_blank"` and `rel="noopener noreferrer"`
    - **Validates: Requirements 5.2, 7.2, 11.2**

  - [-] 3.10 Implement `clear`, `banner`, `download cv`, `theme`, `lang` command handlers
    - `clear`: returns `{ type: 'clear' }`; does not modify theme or lang
    - `banner`: returns the welcome banner content as a `banner`-type entry
    - `download cv`: if `cvUrl` is truthy, triggers download via `<a download>`; otherwise returns `{ type: 'error' }` with `--text-error`
    - `theme <dark|light|matrix>`: validates argument; calls `ctx.setTheme`; persists to `localStorage['terminal-theme']`; invalid arg returns error listing valid options
    - `lang <es|en>`: validates argument; calls `ctx.setLang`; persists to `localStorage['terminal-lang']`; invalid arg returns error listing valid codes
    - _Requirements: 8.1–8.3, 9.1, 12.1–12.3, 14.1–14.6, 15.1–15.5_

  - [~] 3.11 Write property test for `clear` history reset (Property 10)
    - **Property 10: `clear` resets history regardless of its prior size**
    - Use `fc.array(historyEntryArbitrary)` × `fc.constantFrom('dark','light','matrix')` × `fc.constantFrom('es','en')`; assert history is empty after clear and theme/lang are unchanged
    - **Validates: Requirements 8.1, 8.3**

  - [~] 3.12 Write property test for `banner` append-only behavior (Property 11)
    - **Property 11: `banner` always appends without removing existing history**
    - Use `fc.array(historyEntryArbitrary)`; assert history length increases by exactly 1 and last entry type is `'banner'`
    - **Validates: Requirements 9.1, 9.3**

  - [~] 3.13 Write property test for invalid theme argument (Property 15)
    - **Property 15: Invalid theme argument does not change the active theme**
    - Use `fc.string()` filtered to exclude `['dark','light','matrix']`; assert active theme is unchanged and output lists valid options
    - **Validates: Requirements 14.4**

  - [~] 3.14 Write property test for invalid lang argument (Property 18)
    - **Property 18: Invalid lang argument does not change the active lang**
    - Use `fc.string()` filtered to exclude `['es','en']`; assert active lang is unchanged and output lists valid codes
    - **Validates: Requirements 15.3**

  - [~] 3.15 Write property test for theme persistence (Property 16)
    - **Property 16: Theme preference persists and restores across sessions**
    - Use `fc.constantFrom('dark','light','matrix')`; assert `localStorage['terminal-theme']` equals the applied theme; on re-init with stored value, Terminal uses that theme; absent key defaults to `'dark'`
    - **Validates: Requirements 14.5, 14.6**

  - [~] 3.16 Write property test for lang persistence (Property 17)
    - **Property 17: Lang preference persists and restores across sessions**
    - Use `fc.constantFrom('es','en')`; assert `localStorage['terminal-lang']` equals the applied lang; on re-init with stored value, Terminal uses that lang; absent key defaults to `'es'`
    - **Validates: Requirements 15.4, 15.5**

- [~] 4. Checkpoint — run `npx tsc --noEmit` and all property tests; fix any type or logic errors before proceeding
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Build the Terminal UI components
  - [-] 5.1 Create theme CSS variables and apply via a wrapper `data-theme` attribute
    - Define CSS custom properties per theme in `globals.css` (dark/light/matrix variables from the design's data model table)
    - Add `text-shadow: 0 0 8px currentColor` to `--text-primary` for the matrix theme
    - Implement `isValidTheme` and `isValidLang` type guards
    - _Requirements: 14.1–14.3, 22.3_

  - [x] 5.2 Write property test for WCAG contrast ratios (Property 19)
    - **Property 19: All themes maintain WCAG 2.1 AA contrast ratio**
    - Use `fc.constantFrom('dark','light','matrix')`; compute relative luminance for each theme's `--text-primary` vs `--bg-terminal` and assert ratio ≥ 4.5:1
    - **Validates: Requirements 14.1, 14.2, 14.3, 22.3**

  - [x] 5.3 Create `src/components/Terminal/WelcomeBanner.tsx`
    - Render ASCII art name and a welcome message with a `help` suggestion; accept `lang: Lang` prop
    - _Requirements: 9.2_

  - [-] 5.4 Create `src/components/Terminal/OutputLine.tsx`
    - Accept `entry: HistoryEntry` and `theme: Theme` props
    - Map `entry.type` to color class: `output → --text-primary`, `error → --text-error`, `input → --text-secondary`, `loader → --text-warning`
    - Render JSX `content` directly; render string `content` in a `<pre>` preserving whitespace
    - For `loader` type: display animated spinner frames (`⣾⣽⣻⢿⡿⣟⣯⣷`) cycling every 100ms via `setInterval` in a `useEffect`
    - _Requirements: 2.2, 4.2, 6.2, 13.2, 16.1_

  - [ ] 5.5 Create `src/components/Terminal/InputLine.tsx`
    - Render prompt string and `<input>` with `aria-label="Entrada de comandos de la terminal"` and minimum `fontSize: 14px`
    - Implement CSS blinking cursor animation (500ms on / 500ms off keyframes)
    - Handle `onKeyDown`: Enter → `onSubmit`; ArrowUp → `onArrowUp`; ArrowDown → `onArrowDown`
    - `autoFocus` on mount; accept `disabled` prop to block input while `ask` is in flight
    - _Requirements: 1.1, 1.4, 19.4, 22.1_

  - [~] 5.6 Create `src/components/MobileKeyboard.tsx`
    - Render 5 buttons (`help`, `about`, `projects`, `contact`, `clear`) with `role="button"` and descriptive `aria-label` on each
    - Hide on ≥768px with `md:hidden`; accept `disabled: boolean` and `onCommand: (cmd: string) => void` props
    - _Requirements: 19.2, 19.3, 22.4_

  - [~] 5.7 Create `src/components/Terminal/Terminal.tsx` — main stateful component
    - Declare state: `history`, `inputValue`, `theme`, `lang`, `commandHistory`, `historyIndex`, `isLoading`
    - On mount (`useEffect`): read `localStorage['terminal-theme']` and `localStorage['terminal-lang']` with try/catch; apply validated values or defaults (`dark`, `es`); add WelcomeBanner as first history entry
    - Add `bottomRef` and scroll-to-bottom `useEffect` triggered on every `history` change
    - Implement `handleSubmit`: reject empty/whitespace input; add input echo entry; call `resolveCommand`; handle `clear` (empty history), `async` (loader + promise chain), and all other types; push to `commandHistory`; reset `historyIndex`
    - Implement `handleArrowUp` / `handleArrowDown` per the design's pseudocode
    - Wrap history area in `<div role="log" aria-live="polite" aria-atomic="false">`
    - On panel click (not on links/buttons): focus the input
    - Pass `isLoading` as `disabled` to `InputLine` and `MobileKeyboard`
    - _Requirements: 1.1–1.9, 8.1–8.3, 9.1–9.3, 14.5–14.6, 15.4–15.5, 18.2–18.3, 19.1, 19.5, 22.2_

  - [~] 5.8 Write property test for non-empty command grows history (Property 1)
    - **Property 1: Submitting a non-empty command grows the history**
    - Use `fc.string({ minLength: 1 })`; simulate submit and assert history grows by exactly 2 entries (echo + output) and input is cleared
    - **Validates: Requirements 1.2**

  - [~] 5.9 Write property test for whitespace-only input is ignored (Property 2)
    - **Property 2: Whitespace-only input is silently ignored**
    - Use strings composed entirely of whitespace; assert history length is unchanged after submit attempt
    - **Validates: Requirements 1.3**

  - [~] 5.10 Write property test for history navigation round-trip (Property 3)
    - **Property 3: History navigation round-trip**
    - Use `fc.array(fc.string({ minLength: 1 }), { minLength: 1 })`; press ArrowUp N times then ArrowDown N times; assert input returns to empty and each intermediate step matches expected command
    - **Validates: Requirements 1.7, 1.8**

- [~] 6. Checkpoint — run `npm run build`, verify no TypeScript errors and layout renders; ask the user if questions arise.

- [ ] 7. Implement Gemini AI integration
  - [~] 7.1 Create `src/lib/gemini.ts` — Gemini_Client
    - Read `process.env.NEXT_PUBLIC_GEMINI_KEY`; throw immediately with a descriptive error if absent or empty (no fetch)
    - Construct system prompt containing serialized `profileData` as JSON and explicit instructions: restrict to professional profile, max 3 paragraphs
    - POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=...`
    - Distinguish network errors (fetch throws) from HTTP errors (`response.ok === false`, include status code)
    - Extract and return `data.candidates[0].content.parts[0].text`
    - _Requirements: 13.1, 13.4, 13.6, 13.7, 13.8_

  - [~] 7.2 Write property test for missing API key prevents HTTP call (Property 14)
    - **Property 14: Missing API key prevents any HTTP call**
    - Use `fc.string({ minLength: 1 })` as question with empty API key; mock `fetch`; assert `fetch` is never called and the function rejects with an error
    - **Validates: Requirements 13.8**

  - [~] 7.3 Write property test for Gemini system prompt contains profile data (Property 13)
    - **Property 13: Gemini system prompt always contains profile data and response constraints**
    - Use `fc.string({ minLength: 1 })` as question, mock fetch; assert request body system instruction contains serialized profile and max-3-paragraphs constraint
    - **Validates: Requirements 13.1, 13.6**

  - [~] 7.4 Implement `ask` command handler in `src/lib/commands/ai.ts`
    - Return `{ type: 'async', loader: '⣾ Pensando...', promise: askGemini(question, profile[ctx.lang]) }` when question is non-empty
    - Return usage error message (`ask <pregunta>`) when invoked without arguments
    - _Requirements: 13.1–13.5, 13.8_

  - [~] 7.5 Write property test for `ask` loader is always replaced (Property 12)
    - **Property 12: `ask` always replaces the loader with a final output**
    - Use `fc.string({ minLength: 1 })` × mock Gemini that resolves or rejects randomly; assert loader entry is never visible in history after promise settles
    - **Validates: Requirements 13.3, 13.4**

- [ ] 8. Apply visual styling and responsive layout
  - [~] 8.1 Style the full-page background in `src/app/page.tsx`
    - Add fixed full-viewport background div with `bg.jpg` (`background-size: cover; background-position: center`) and a `bg-black/75` overlay
    - Add `background-color: #0a0a0a` as CSS fallback on `<body>` for image load failure
    - _Requirements: 17.1, 17.2, 17.4_

  - [~] 8.2 Style the Terminal panel with responsive layout
    - Desktop (≥768px): centered, `max-w-[900px]`, `h-[80vh]`, internal scroll on history area, input pinned to bottom
    - Mobile (<768px): `h-[100dvh]`, font size ≥14px on input, full-width
    - Apply `data-theme` attribute to terminal wrapper so CSS variables cascade correctly
    - _Requirements: 17.3, 18.1, 18.2, 19.1, 19.4_

  - [~] 8.3 Add inline `<script>` in `src/app/layout.tsx` `<head>` to read `localStorage['terminal-theme']` before hydration and set `data-theme` on `<html>` to prevent flash of wrong theme
    - _Requirements: 14.6_

  - [~] 8.4 Write unit tests for accessibility attributes
    - Assert `<input>` has `aria-label="Entrada de comandos de la terminal"` (Req. 22.1)
    - Assert history container has `aria-live="polite"` and `aria-atomic="false"` (Req. 22.2)
    - Assert each MobileKeyboard button has `role="button"` and a non-empty `aria-label` (Req. 22.4)
    - Assert WelcomeBanner renders as the first history entry on app load (Req. 9.2)
    - Assert `clear` command keeps input focused after execution (Req. 8.2)
    - _Requirements: 8.2, 9.2, 22.1, 22.2, 22.4_

  - [~] 8.5 Write property test for mobile shortcut parity (Property 20)
    - **Property 20: Mobile shortcut buttons behave identically to typing the command**
    - Use `fc.constantFrom('help','about','projects','contact','clear')`; compare history state after shortcut tap vs. after typing the same command and pressing Enter
    - **Validates: Requirements 19.3**

- [~] 9. Checkpoint — verify responsive layout on desktop and mobile viewport widths, all accessibility attributes present; ask the user if questions arise.

- [~] 10. Configure GitHub Actions CI/CD pipeline
  - Create `.github/workflows/deploy.yml` with the exact pipeline from the design:
    - Trigger: `push` to `main`
    - Steps: `checkout@v4` → `setup-node@v4` (Node 20) → `npm ci` → `npm run build` (with `NEXT_PUBLIC_GEMINI_KEY` from secrets) → `peaceiris/actions-gh-pages@v4` publishing `./out`
  - Confirm `next.config.js` has `output: 'export'` and `images: { unoptimized: true }` (no changes needed if already done in Task 1)
  - _Requirements: 21.1–21.6_

- [~] 11. Final checkpoint — run `npx tsc --noEmit`, `npm run build`, and all tests; confirm `/out` directory is generated; ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) (`npm install --save-dev fast-check`)
- All content commands follow the same `activeLang → 'es' → error` fallback chain; centralize this logic in a helper
- `localStorage` access must always be inside `useEffect` or event handlers to avoid SSR issues with Next.js
- The inline theme script in `<head>` must be a `dangerouslySetInnerHTML` script tag to execute before React hydration
- Task 5.1 (CSS variables) and Task 5.7 (Terminal.tsx) may need iteration; review the theme table in the design's Data Models section

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "5.1", "5.3"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.5", "3.10", "5.2", "5.4", "5.5", "5.6"] },
    { "id": 3, "tasks": ["3.4", "3.6", "3.7", "3.8", "3.9", "3.11", "3.12", "3.13", "3.14", "3.15", "3.16", "5.7", "7.1"] },
    { "id": 4, "tasks": ["5.8", "5.9", "5.10", "7.2", "7.3", "7.4"] },
    { "id": 5, "tasks": ["7.5", "8.1", "8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4", "8.5"] }
  ]
}
```
