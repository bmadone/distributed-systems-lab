# Architecture

Hexagonal (ports and adapters) on clean-architecture layering, with domain-driven design, written in a functional style. Dependencies point inward only:

```
presentation ─▶ application ─▶ domain
infrastructure ─▶ application ─▶ domain        (infrastructure implements ports declared by application)
main.tsx (composition root) wires everything
```

`domain` imports nothing from the other layers, and not React, zod, the DOM or `localStorage` either. `application` imports only `domain`. A test (`src/architecture.test.ts`) fails the build if an import crosses a boundary the wrong way.

## Bounded contexts (`src/domain/*`)

| Context | Language | Contents |
|---|---|---|
| `curriculum` | Part, Lesson, Task, QuizItem, Card, Exercise | The course catalogue as immutable data and the ids that name it. No React. |
| `learning` | Progress, LessonStatus, Streak, Deck | The **Progress aggregate** and its pure reducer (`makeReducer`), derived views (lesson status, dashboard summary, streak, flashcard deck) and the rule that a lesson completes once. |
| `review` | Card box, Due | Leitner spaced repetition: `grade`, `isDue`. |
| `simulation` | one module per lab | Pure models: quorum, CAP, Raft, vector clocks, 2PC, saga, cache, … Each exposes types plus pure functions or a reducer. Seeded randomness only. |
| `shared-kernel` | | `fp.ts`: range, clamp, seeded shuffle, PRNG, hashing. |

Context rules (enforced): `shared-kernel` imports nothing; `review` and `simulation` import only the kernel; `curriculum` may import `simulation` (lesson checks use lab helpers); `learning` may import `curriculum`, `review` and the kernel. The one exception: a simulation's `signal.ts` augments `curriculum/signals`.

## Application layer (`src/application/*`)

- `ports.ts`: `ProgressRepository`, `LabSettingsRepository`, `ProgressCodec`, `Clock`, `Random`.
- `learning-api.ts`: `createLearningApi({ lessons, progress, clock })` returns the `LearningApi` (the driving port). It loads the aggregate, runs the domain reducer, saves when progress changed and notifies subscribers.
- `services.ts`: the bundle handed to the UI by the composition root.
- `testing/`: in-memory adapters, a fixed clock, seeded random and `createTestServices()`; plus the shared `ProgressRepository` contract suite.

## Infrastructure (`src/infrastructure/*`)

- `persistence/`: localStorage adapters for progress and lab settings, zod schemas (persistence DTOs), the JSON export/import codec and migration from the vanilla build (`ds-lab-course-v1`).
- `storage/json-storage.ts`: guarded read, write and remove helpers.
- `system/`: `systemClock`, `mathRandom`.

## Presentation (`src/presentation/*`)

- `hooks/app.tsx`: `AppProvider`, `useApi`, `useProgress`, `useSignal`, `usePersistedState`, `useClock`, `useRandom`.
- `pages/` (lesson, review, exam, progress), `layout/` (sidebar), `ui/` (primitives, options, exercises), `hooks/route.ts`.
- `labs/<lab>/<Lab>.tsx`: thin views over `domain/simulation/<lab>`.
- `lessons/<id>.tsx`: the lesson **body** (prose and labs), registered by id in `lessons/index.ts`. Lesson data lives in `domain/curriculum/lessons/<id>.ts`.

`src/main.tsx` is the composition root: the only file that picks adapters.

## Rules of thumb

- Data in, data out: functions take readonly values and return new ones; effects happen only in infrastructure and in the React shell.
- Time and randomness are arguments, never ambient.
- Errors you can expect are values (`Result`), not exceptions.
- A lab's practice tasks are predicates over its typed signal, defined next to the curriculum and checked in the domain.

## Ports and adapters

The application core (domain + use cases) talks to the outside world only through ports. Adapters plug into them from the outside.

| | Port (declared in `application/ports`) | Adapters |
|---|---|---|
| **Driving** (who calls the core) | The use-case functions themselves, exposed as one `LearningApi` object | React UI (`presentation`), tests, and any future CLI or script |
| **Driven** (what the core calls) | `ProgressRepository`, `LabSettingsRepository`, `Clock`, `Random` | `localStorage` adapters, `systemClock`, `mathRandom` in production; in-memory adapters, a fixed clock and a seeded random in tests |

- Ports are plain function-record types, for example `{ load: () => Progress; save: (p: Progress) => void }`, so adapters are values, not classes.
- Adapters are created and injected only in `main.tsx` (the composition root). Nothing else imports `infrastructure`.
- Swapping storage (for example IndexedDB or a server API) means writing one new adapter that satisfies the port. The domain, use cases and UI don't change.
- The use-case tests run against in-memory adapters, and a contract test suite runs against every `ProgressRepository` adapter to prove they behave the same.

## Adding a lab

1. `domain/simulation/<lab>/model.ts` (+ `model.test.ts`): pure types and functions, or a reducer. Seeded randomness only.
2. `domain/simulation/<lab>/signal.ts`: the signal type and its `declare module '../../curriculum/signals'` augmentation.
3. `presentation/labs/<lab>/<Lab>.tsx`: render the model, `useSignal('<key>', …)`, `usePersistedState` for controls.
4. Use the signal in the lesson's practice tasks (`domain/curriculum/lessons/<id>.ts`) and put the lab in the lesson body (`presentation/lessons/<id>.tsx`).
5. Defaults must not solve any task (`presentation/fresh.test.tsx`), and every task needs a reachability test.

`src/architecture.test.ts` fails the build if a layer or context rule is broken.
