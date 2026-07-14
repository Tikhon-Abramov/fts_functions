import { Prisma } from 'src/generated/prisma/client';
import { TypeSelect, UserSelect } from '../constant/constant.select';


export const FtsFunctionSelect = {
  id: true,
  ftsCentralization: { select: TypeSelect },
  ftsFunctionName: { select: TypeSelect },
  otherFtsFunctionName: true,
  ftsFunctionMarker: { select: TypeSelect },
  competencyCenter: { select: TypeSelect },
  dtis: { select: { type: { select: TypeSelect } } },
  curatorCentralOffice: { select: UserSelect },
  managerInterregionalInspection: { select: UserSelect },
  departmentHeadCentralOffice: { select: UserSelect },
  departmentHeadInterregionalInspection: { select: UserSelect },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FtsFunctionSelect;