import type {
  ftsFunctionBaseSelect,
  ftsFunctionDetailDetailedSelect,
  ftsFunctionDetailedSelect,
  ftsFunctionListSelect,
  ftsFunctionToDtiSelect,
  ftsFunctionTreeSelect,
  feedbackDetailedSelect,
  downloadFtsFunctionSelect,
  downloadFtsFunctionDetailSelect,
  downloadFeedbackSelect,
  downloadFtsFunctionTreeSelect,
} from './fts-function.selects';
import type { Prisma } from '@prisma-client';

/**
 * Сущности модуля FtsFunction выводятся из формы селектов через
 * `Prisma.*GetPayload<{ select: typeof ... }>` — см. reference pattern в
 * `apps/api/src/modules/task/internal/task.entity.ts`.
 */

export type FtsFunctionBaseEntity = Prisma.FtsFunctionGetPayload<{
  select: typeof ftsFunctionBaseSelect;
}>;

export type FtsFunctionListEntity = Prisma.FtsFunctionGetPayload<{
  select: typeof ftsFunctionListSelect;
}>;

export type FtsFunctionDetailedEntity = Prisma.FtsFunctionGetPayload<{
  select: typeof ftsFunctionDetailedSelect;
}>;

export type FtsFunctionDetailDetailedEntity = Prisma.FtsFunctionDetailGetPayload<{
  select: typeof ftsFunctionDetailDetailedSelect;
}>;

export type FtsFunctionTreeEntity = Prisma.FtsFunctionTreeGetPayload<{
  select: typeof ftsFunctionTreeSelect;
}>;

export type FtsFunctionToDtiEntity = Prisma.FtsFunctionToDtiGetPayload<{
  select: typeof ftsFunctionToDtiSelect;
}>;

export type FeedbackDetailedEntity = Prisma.FeedbackGetPayload<{
  select: typeof feedbackDetailedSelect;
}>;

export type DownloadFtsFunctionEntity = Prisma.FtsFunctionGetPayload<{
  select: typeof downloadFtsFunctionSelect;
}>;

export type DownloadFtsFunctionDetailEntity = Prisma.FtsFunctionDetailGetPayload<{
  select: typeof downloadFtsFunctionDetailSelect;
}>;

export type DownloadFeedbackEntity = Prisma.FeedbackGetPayload<{
  select: typeof downloadFeedbackSelect;
}>;

export type DownloadFFtsFunctionTreeEntity = Prisma.FtsFunctionTreeGetPayload<{
  select: typeof downloadFtsFunctionTreeSelect;
}>;
