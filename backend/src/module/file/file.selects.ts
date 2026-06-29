import type { Prisma } from 'src/generated/prisma/client';

export const fileTinySelect = {
  id: true,
  createdAt: true,
} as const satisfies Prisma.FileSelect;

export const fileViewSelect = {
  id: true,
  objectKey: true,
  originalName: true,
  mimeType: true,
  size: true,
  createdAt: true,
} as const satisfies Prisma.FileSelect;
