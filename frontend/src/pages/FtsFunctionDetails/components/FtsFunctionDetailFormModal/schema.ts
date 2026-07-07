import { z } from "zod";


export const CreateFtsFunctionDetailSchema = z.object({
  ftsFunctionId: z.number({ error: () => "Обязательное поле" }),
  ftsFunctionStepId: z.number({ error: () => "Обязательное поле" }),
  ftsFunctionCategoryId: z.number({ error: () => "Обязательное поле" }),
  whoPerformsActionId: z.number({ error: () => "Обязательное поле" }),
  personPerformingActionId: z.number().nullish(),
  otherPersonPerformingAction: z
    .string()
    .trim()
    .max(4096, 'Иное лицо, выполняющее действие не может превышать 4096 символов')
    .optional(),
  ftsFunctionDetails: z
    .string()
    .trim()
    .min(1, "Обязательное поле")
    .max(4096, 'Наименование детализации не может превышать 4096 символов'),
  ftsFunctionExecutionFrequencyId: z.number().nullish(),
  ftsFunctionComplexityId: z.number().nullish(),
  artifact: z
    .string()
    .trim()
    .max(4096, 'Артефакт не может превышать 4096 символов')
    .nullish(),
  basis: z
    .string()
    .trim()
    .max(4096, 'Нормативное основание не может превышать 4096 символов')
    .nullish(),
  artifactUsage: z
    .string()
    .trim()
    .max(4096, '"Как используется артефакт" не может превышать 4096 символов')
    .nullish(),
  actionsСompleteness: z
    .string()
    .trim()
    .max(4096, 'Полнота действий не может превышать 4096 символов')
    .nullish(),
  actionsEffectiveness: z
    .string()
    .trim()
    .max(4096, 'Эффективность действий КПЭ не может превышать 4096 символов')
    .nullish(),
  technologicalSolutionId: z.number().nullish(),
  number: z
  .string()
  .trim()
  .max(64, 'Не более 64 символов')
  .nullish(),
  responsibleId: z.number().nullish(),
});

// .superRefine((data, ctx) => {

// });

export const UpdateFtsFunctionDetailSchema = CreateFtsFunctionDetailSchema.partial();

export type FtsFunctionDetailData = z.infer<typeof CreateFtsFunctionDetailSchema>;