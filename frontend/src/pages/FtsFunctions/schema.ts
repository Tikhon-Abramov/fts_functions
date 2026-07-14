import { z } from "zod";


export const FtsFunctionFormSchema = z.object({
  ftsFunctionNameId: z.number({ error: () => "Обязательное поле" }),
  otherFtsFunctionName: z
    .string()
    .trim()
    .max(512, 'Иное наименование функции не может превышать 512 символов')
    .optional(),
  ftsFunctionMarkerId: z.number({ error: () => "Обязательное поле" }),
  ftsCentralizationId: z.number({ error: () => "Обязательное поле" }),
  competencyCenterId: z.number({ error: () => "Обязательное поле" }),
  curatorCentralOfficeId: z.number({ error: () => "Обязательное поле" }),
  departmentHeadCentralOfficeId: z.number({ error: () => "Обязательное поле" }),
  managerInterregionalInspectionId: z.number({ error: () => "Обязательное поле" }),
  departmentHeadInterregionalInspectionId: z.number({ error: () => "Обязательное поле" }),
  dtiIds: z.array(z.number()),
});

export type FtsFunctionFormData = z.infer<typeof FtsFunctionFormSchema>;
