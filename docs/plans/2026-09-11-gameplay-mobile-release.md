# Shinobi Cascade Gameplay and Mobile Release Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the current game fully usable on phones, expose ordered combo decisions, improve run variety and deterministic progression, then publish the complete source in a public GitHub repository.

**Architecture:** Keep the dependency-free single-page game and its offline build. Add small state-backed UI layers for the mobile combat sheet and chain rail, route every gameplay random choice through a saved seeded generator, and model normal encounter rules separately from boss modifiers. Build both the full offline artifact and a compressed hosted artifact from the same source.

**Tech Stack:** Vanilla JavaScript, CSS, Python/Pillow build scripts, Node VM tests, Playwright browser tests, Git and GitHub CLI.

---

### Task 1: Deterministic state and persistence

**Files:** Modify `src/game.js`, `src/audio.js`; test `qa/engine-tests.cjs`.

1. Add a saved run seed, RNG state, awakening progress and mobile sheet state.
2. Route gameplay shuffle, choice, rarity and encounter changes through the seeded RNG.
3. Save the sound preference separately from the run and restore it on load.
4. Verify save/resume reproduces the RNG stream.

### Task 2: Weighted shop and awakening

**Files:** Modify `src/game.js`; test `qa/engine-tests.cjs`.

1. Roll rarity by chapter before selecting a ninja or relic.
2. Keep team synergy as a weight inside the rolled rarity.
3. Add owned-character awakening offers and three upgrade stages.
4. Verify early legendary probability is zero and owned characters never become duplicate deck cards.

### Task 3: Encounter rules and boss phases

**Files:** Modify `src/data.js`, `src/game.js`; test `qa/engine-tests.cjs`.

1. Add reusable rules to every normal and elite encounter.
2. Give boss phases distinct rules and surface their current phase description.
3. Apply exact-card, suppression, finisher, weakness and repetition rules during evaluation.
4. Add visual feedback when rotating seals or weaknesses change.

### Task 4: Ordered combo controls

**Files:** Modify `src/game.js`, `src/expansion.css`; test `qa/browser-tests.cjs`.

1. Add a visible chain rail containing selected cards and arrows.
2. Support pointer drag and keyboard buttons to reorder the rail.
3. Show the damage and newly triggered combo delta for each candidate card.
4. Keep tap selection usable without hover.

### Task 5: Mobile combat sheet and card geometry

**Files:** Modify `src/game.js`, `src/expansion.css`, `src/style-0.css`; test `qa/browser-tests.cjs`.

1. Replace the mobile threat block with a compact sticky HUD.
2. Add one bottom sheet with Scrolls, Build and Log tabs.
3. Use a fixed 2:3 art frame plus a separate caption on every screen size.
4. Verify 360, 390, 768 and desktop layouts without missing combat information or horizontal overflow.

### Task 6: Lean starter teams and release

**Files:** Modify `src/expansion.js`, `README.md`, build outputs and QA reports.

1. Reduce all starter teams to nine cards with one completed and two partial combo paths.
2. Run engine, balance, release and browser checks.
3. Rebuild the full offline HTML and the hosted HTML.
4. Update the existing hosted site.
5. Initialize Git, create a public GitHub repository, and push source, assets, tests, build scripts and release artifacts.
