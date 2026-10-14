import type { LearningApi } from './learning-api';
import type { Clock, LabSettingsRepository, PreferencesRepository, ProgressCodec, Random } from './ports';

/** Everything the presentation layer is given by the composition root. */
export interface Services {
  readonly api: LearningApi;
  readonly settings: LabSettingsRepository;
  readonly codec: ProgressCodec;
  readonly preferences: PreferencesRepository;
  readonly clock: Clock;
  readonly random: Random;
}
