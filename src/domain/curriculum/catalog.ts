import { LESSON_IDS, type LessonId } from './ids';
import type { Lesson } from './types';
import sdIntro from './lessons/sd-intro';
import sdAvailability from './lessons/sd-availability';
import sdComm from './lessons/sd-comm';
import sdStorage from './lessons/sd-storage';
import sdScaling from './lessons/sd-scaling';
import sdObservability from './lessons/sd-observability';
import sdSecurity from './lessons/sd-security';
import intro from './lessons/intro';
import fallacies from './lessons/fallacies';
import failures from './lessons/failures';
import delivery from './lessons/delivery';
import partitioning from './lessons/partitioning';
import replication from './lessons/replication';
import quorums from './lessons/quorums';
import cap from './lessons/cap';
import models from './lessons/models';
import isolation from './lessons/isolation';
import commit from './lessons/commit';
import consensus from './lessons/consensus';
import clocks from './lessons/clocks';
import production from './lessons/production';
import systems from './lessons/systems';
import sdInterview from './lessons/sd-interview';

const BY_ID: Readonly<Record<LessonId, Lesson>> = {
  "sd-intro": sdIntro,
  "sd-availability": sdAvailability,
  "sd-comm": sdComm,
  "sd-storage": sdStorage,
  "sd-scaling": sdScaling,
  "sd-observability": sdObservability,
  "sd-security": sdSecurity,
  "intro": intro,
  "fallacies": fallacies,
  "failures": failures,
  "delivery": delivery,
  "partitioning": partitioning,
  "replication": replication,
  "quorums": quorums,
  "cap": cap,
  "models": models,
  "isolation": isolation,
  "commit": commit,
  "consensus": consensus,
  "clocks": clocks,
  "production": production,
  "systems": systems,
  "sd-interview": sdInterview,
};

/** Lessons in course order (the order of LESSON_IDS). */
export const LESSONS: readonly Lesson[] = LESSON_IDS.map(id => BY_ID[id]);
export const lessonById = (id: LessonId): Lesson => BY_ID[id];
