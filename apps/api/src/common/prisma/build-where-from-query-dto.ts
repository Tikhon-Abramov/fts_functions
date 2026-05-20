/**
 * Универсальный построитель `Prisma.*WhereInput` из DTO-фильтров.
 *
 * Покрывает кейсы вида «массив значений → `{ in: [...] }`»: когда поле
 * фильтра в DTO задано (не `undefined`) — мапит на колонку Where с оператором
 * `{ in: <значение> }`. Поля, в которых `undefined`, не попадают в результат
 * и не «гасят» уже существующие предикаты.
 *
 * Карта `fieldMap` явная (`{ codes: 'code', categories: 'category' }`),
 * чтобы не было автомагии «имя DTO-поля совпадает с именем колонки» — это
 * сразу делает рефакторинг безопасным.
 *
 * Расширения (равенство, диапазоны и т. п.) добавляем по мере роста модулей.
 */
export function buildWhereInArrays<TDto extends object, TWhere extends Record<string, unknown>>(
  dto: TDto,
  fieldMap: { readonly [K in keyof TDto]?: keyof TWhere },
): Partial<TWhere> {
  const where: Record<string, unknown> = {};
  for (const dtoKey of Object.keys(fieldMap) as Array<keyof TDto>) {
    const value = dto[dtoKey];
    if (value === undefined || value === null) continue;
    const whereKey = fieldMap[dtoKey];
    if (whereKey === undefined) continue;
    where[whereKey as string] = { in: value };
  }
  return where as Partial<TWhere>;
}
