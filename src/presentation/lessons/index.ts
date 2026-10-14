import type { ComponentType } from 'react';
import type { LessonId } from '../../domain/curriculum/ids';
import capBody from './cap';
import clocksBody from './clocks';
import commitBody from './commit';
import consensusBody from './consensus';
import deliveryBody from './delivery';
import failuresBody from './failures';
import fallaciesBody from './fallacies';
import introBody from './intro';
import isolationBody from './isolation';
import modelsBody from './models';
import partitioningBody from './partitioning';
import productionBody from './production';
import quorumsBody from './quorums';
import replicationBody from './replication';
import sdAvailabilityBody from './sd-availability';
import sdCommBody from './sd-comm';
import sdInterviewBody from './sd-interview';
import sdIntroBody from './sd-intro';
import sdObservabilityBody from './sd-observability';
import sdScalingBody from './sd-scaling';
import sdSecurityBody from './sd-security';
import sdStorageBody from './sd-storage';
import systemsBody from './systems';

/** Prose and labs for step 2 ("Learn and explore") of each lesson. Lesson *data* lives in `domain/curriculum`. */
export const LESSON_BODIES: Readonly<Record<LessonId, ComponentType>> = {
  cap: capBody,
  clocks: clocksBody,
  commit: commitBody,
  consensus: consensusBody,
  delivery: deliveryBody,
  failures: failuresBody,
  fallacies: fallaciesBody,
  intro: introBody,
  isolation: isolationBody,
  models: modelsBody,
  partitioning: partitioningBody,
  production: productionBody,
  quorums: quorumsBody,
  replication: replicationBody,
  "sd-availability": sdAvailabilityBody,
  "sd-comm": sdCommBody,
  "sd-interview": sdInterviewBody,
  "sd-intro": sdIntroBody,
  "sd-observability": sdObservabilityBody,
  "sd-scaling": sdScalingBody,
  "sd-security": sdSecurityBody,
  "sd-storage": sdStorageBody,
  systems: systemsBody,
};
