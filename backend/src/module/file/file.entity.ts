import type { Prisma } from 'src/generated/prisma/client';
import type { fileViewSelect } from './file.selects';

export type FileEntity = Prisma.FileGetPayload<{ select: typeof fileViewSelect }>;
