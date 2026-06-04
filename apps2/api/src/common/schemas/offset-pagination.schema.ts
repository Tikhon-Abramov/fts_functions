// import { createZodDto } from "@anatine/zod-nestjs";
// import { toInt } from "@common/utils/to-int.utils";
// import z from "zod";
//
// export const OffsetPaginationSchema = z.object({
//   page: z.union([z.string(), z.number()])
//     .transform(toInt)
//     .pipe(z.number().int().positive().optional()),
//   limit: z.union([z.string(), z.number()])
//     .transform(toInt)
//     .pipe(z.number().int().min(1).max(1000).optional())
// });
//
// export class OffsetPaginationDto extends createZodDto(OffsetPaginationSchema) { }
