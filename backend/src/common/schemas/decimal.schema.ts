import { Decimal } from "src/generated/prisma/internal/prismaNamespace";
import z from "zod";

export const DecimalSchema = z.instanceof(Decimal);
