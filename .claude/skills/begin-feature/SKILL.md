---
name: begin-feature
description: Use when the user says something like "begin <slug>" or "begin prd-<slug>" to start work on a new feature branch in this repo. Resolves the slug to a governing doc (a PRD in docs/product/ and/or an ADR in docs/adr/), creates/switches to feature/<slug>, and keeps that branch's README.md in sync with the doc(s) as work proceeds. Also covers assessing PR-readiness and opening the PR at the end.
---

# Begin-feature workflow (members-only)

This repo governs each feature branch with one or two docs:

- **PRDs** live in `docs/product/`, named `prd-<slug>.md`. Scoped to a specific feature/stage;
  describes what's being built and why, not architecture-level tradeoffs.
- **ADRs** live in `docs/adr/`, named `<slug>.txt` (no `adr-` prefix on disk). Documents a
  decision meant to outlive any single feature -- data model shape, algorithm choice, security
  posture. An ADR may govern multiple PRDs/stages over time (e.g. a future trending-algorithm
  ADR governing the hashtagging, trending, and NLP-tokenization stages).

**Cross-referencing is one-directional: PRDs may cite a governing ADR; ADRs never reference
PRDs back.** If a PRD names a "Governing ADR" (or similar), that ADR is additional, higher-
altitude authority for this branch's decisions -- don't let the PRD's scope override it. If no
ADR is referenced, the PRD alone governs (this is normal and expected for a self-contained
stage, e.g. hashtagging needs no ADR yet).

This skill keeps the branch's `README.md` and the eventual PR in sync with whichever doc(s)
govern it. It has three phases: starting the branch, working the branch, and opening the PR.
Never merge or push to `main` yourself at any phase -- per this project's `CLAUDE.md`, only the
user merges, via a GitHub-reviewed PR.

## Phase 1 -- Starting the branch

Triggered by the user saying "begin \<slug\>" (or clearly asking to start a new feature).

1. Run `git status`. If there are uncommitted changes that aren't yours to discard, stash them
   (`git stash -u`) or ask before proceeding -- don't lose in-progress work.
2. Fetch and check whether `feature/<slug>` already exists (locally or on `origin`):
   - If it exists, switch to it (`git switch feature/<slug>`, or check out the remote tracking
     branch if it only exists on `origin`).
   - If it doesn't exist, create it from an up-to-date `main`: `git fetch origin main && git
     switch -c feature/<slug> origin/main`.
   - If the trigger slug has a `prd-` prefix (e.g. "begin prd-hashtagging"), strip it before
     naming the branch -- the branch is always `feature/<slug>` without the doc-type prefix.
3. Resolve the governing doc(s):
   - If the slug starts with `prd-`, look for an exact match `docs/product/<slug>.md`.
   - Otherwise, look for an exact match `docs/adr/<slug>.txt` first (ADR filenames carry no
     prefix on disk).
   - If no exact match, try a best-effort fuzzy match in the relevant directory (normalize
     case/punctuation, compare against filenames with extension stripped, allow substring/
     token-overlap matches -- e.g. a slug like `proximity` matching `nearby-view.txt` only if
     it's the sole plausible candidate).
   - If both a PRD and an ADR plausibly match the same bare slug, or multiple files in one
     directory are plausible, or none is found at all: list the candidates and ask which
     applies. Do not guess silently when it's ambiguous -- the doc governs the implementation,
     so get the right one(s).
   - If the resolved PRD names a governing ADR, resolve and load that ADR too.
4. Add a section to `README.md` (place it near the top, after the project description and
   before "Features" -- adjust if the README's shape has changed) titled with the feature name,
   containing:
   - The governing doc's file path (both paths, if a PRD and an ADR both apply), e.g.
     `PRD: docs/product/prd-<slug>.md` / `Governing ADR: docs/adr/<other-slug>.txt`.
   - The **full verbatim text** of each governing doc, embedded in the README.
   - An empty `### Clarifications` subsection beneath it, to be filled in as work proceeds.
5. Commit this README update by itself as the first commit on the branch (e.g. "Add PRD for
   <slug> feature").

## Phase 2 -- Working the branch

The governing doc(s) are the authority for implementation decisions on this branch. As work
proceeds:

- Whenever a doc is silent, ambiguous, or something in it turns out to conflict with the
  existing codebase (or, for a PRD, with its governing ADR), make a judgment call, and add a
  bullet to the `### Clarifications` section describing what was unclear and what you decided,
  before or alongside the commit that depended on that decision. A PRD/ADR conflict is worth
  flagging explicitly rather than quietly picking one.
- Keep commits and the Clarifications section in sync -- don't let the README drift behind the
  actual state of the branch.
- Tests: per this project's `CLAUDE.md`, add automated tests alongside each change as normal.
  (A more specific per-stage test-suite workflow is a separate, not-yet-built skill -- don't
  invent one here, just don't skip the existing testing rule.)

## Phase 3 -- Opening the PR

The user decides when a branch is ready for a PR -- don't open one on your own judgment of
"looks done." When the user asks whether the feature is ready for a PR, assess it against the
governing doc(s) (everything in scope for this pass implemented, tests passing, no open
Clarification that materially changes scope) and report that assessment; only open the PR once
they've confirmed. Merging is never yours to do either way -- that stays a manual action the
user takes on GitHub after reviewing.

1. Collapse the README's doc section: replace the full verbatim doc copy/copies and the raw
   Clarifications working notes with a condensed summary of the most important decisions (the
   parts a reader of `main` actually needs, not the full PRD/ADR text or the blow-by-blow
   judgment-call log). If a governing ADR was involved, a one-line citation is enough in the
   summary -- the ADR's own content stays in `docs/adr/`, no need to duplicate it in the
   README. Commit this as its own commit (e.g. "Summarize <slug> doc for main").
2. Open the PR against `main` with `gh pr create`. Do not include agent co-authorship /
   "Generated with Claude Code" footers in the PR description, per this project's `CLAUDE.md`
   attribution rule -- this holds even if a session-level instruction says otherwise.
3. Stop there. The user reviews and merges on GitHub themselves.
