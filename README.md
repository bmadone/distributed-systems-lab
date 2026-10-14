# Distributed Systems Lab

An interactive course on system design and distributed systems: 23 lessons (10+ quiz questions and 8+ practice tasks each), each with predict-first, prose plus hands-on labs, auto-checked practice, a retrieval quiz, explain-it-back, and flashcards feeding a spaced-repetition deck. There's a progress dashboard and a final exam.

## Run

```sh
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + tests + build
npm run build      # dist/index.html, one self-contained file you can open from disk
```

## Architecture

Hexagonal architecture with DDD bounded contexts, written functionally. See [ARCHITECTURE.md](ARCHITECTURE.md): `domain` (pure) ← `application` (use cases and ports) ← `presentation` and `infrastructure` (adapters), wired in `src/main.tsx`. `src/architecture.test.ts` enforces the dependency rule.

## Progress & storage

All data stays in the browser's `localStorage`:

- `dsl:progress:v2` holds predictions, quiz answers and best scores, practice tasks, notes, flashcard boxes, first-visit and completion dates, active time per page, daily activity, CAP scenario answers and exam attempts. It's validated with zod on load (bad or partial data falls back safely), saved after every change, and migrated automatically from the old single-file build (`ds-lab-course-v1`).
- `dsl:lab:<name>` holds each lab's settings (sliders, modes, selections), so a lab looks the way you left it.

**My progress** (sidebar → Consolidate) shows lessons, tasks, quiz accuracy, streak, active time, flashcard mastery, progress by part, a 12-week activity heatmap and a per-lesson table. You can export your progress as JSON, import it on another device, or reset everything.

## Tests

- `src/architecture.test.ts`: layer and bounded-context dependency rules.
- `domain/curriculum`: data invariants (answer indices, at least 10 quiz questions and 8 practice tasks per lesson, numeric answers verified).
- `presentation/fresh.test.tsx`: mounting every lesson with defaults must not complete any practice task.
- `domain/learning`, `domain/review`, `application`, `infrastructure`: reducer, spaced repetition, use cases on in-memory adapters, a repository contract suite run against both adapters, persistence and migration.
- `domain/simulation/*/model.test.ts`: lab maths and simulations, including that every practice task is reachable.

`legacy/` holds the previous vanilla-JS build for reference.
