import { CIMIENTOS } from './cimientos';
import { TECNICA } from './tecnica';
import { MAESTRIA } from './maestria';
import { ELITE } from './elite';
import type { AcademyLevel } from './types';

export type * from './types';

export const ACADEMY_LEVELS: readonly AcademyLevel[] = [CIMIENTOS, TECNICA, MAESTRIA, ELITE];
