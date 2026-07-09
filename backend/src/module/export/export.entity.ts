import { Prisma } from "src/generated/prisma/client";
import { downloadActionSelect, downloadFeedbackSelect, downloadFtsFunctionDetailSelect, downloadFtsFunctionSelect, downloadFtsFunctionTreeSelect } from "./export.select";

export type DownloadFtsFunctionEntity = Prisma.FtsFunctionGetPayload<{
  select: typeof downloadFtsFunctionSelect;
}>;

export type DownloadFtsFunctionDetailEntity = Prisma.FtsFunctionDetailGetPayload<{
  select: typeof downloadFtsFunctionDetailSelect;
}>;

export type DownloadFFtsFunctionTreeEntity = Prisma.FtsFunctionTreeGetPayload<{
  select: typeof downloadFtsFunctionTreeSelect;
}>;

export type DownloadFeedbackEntity = Prisma.FeedbackGetPayload<{
  select: typeof downloadFeedbackSelect;
}>;

export type DownloadActionEntity = Prisma.ActionGetPayload<{
  select: typeof downloadActionSelect;
}>;
