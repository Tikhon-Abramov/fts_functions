import type { Connection } from 'mariadb';

export const TYPE_CATEGORY_TRIGGER_ERROR_CODE = 'TYPE_CATEGORY_MISMATCH';

export type TypeCategoryGuard = {
  table: string; // DB table name (snake_case)
  column: string; // DB column name (snake_case)
  category: string; // Category enum value
  nullable?: boolean;
};

// prettier-ignore
export const TYPE_CATEGORY_GUARDS: readonly TypeCategoryGuard[] = [
    { table: 'fts_functions',         column: 'fts_centralization_id',             category: 'FTS_CENTRALIZATION' },
    { table: 'fts_functions',         column: 'fts_function_name_id',              category: 'FTS_FUNCTION_NAME' },
    { table: 'fts_functions',         column: 'competency_center_id',              category: 'FTS_COMPETENCY_CENTER' },
    { table: 'fts_functions',         column: 'fts_function_marker_id',            category: 'FTS_FUNCTION_MARKER' },
    { table: 'fts_function_details',  column: 'fts_function_step_id',              category: 'FTS_FUNCTION_STEP' },
    { table: 'fts_function_details',  column: 'fts_function_category_id',          category: 'FTS_FUNCTION_CATEGORY' },
    { table: 'fts_function_details',  column: 'fts_function_complexity_id',        category: 'FTS_FUNCTION_COMPLEXITY' },
    { table: 'fts_function_details',  column: 'fts_function_execution_frequency_id', category: 'FTS_FUNCTION_EXECUTION_FREQUENCY' },
    { table: 'fts_function_details',  column: 'who_performs_action_id',            category: 'WHO_PERFORMS_ACTION' },
    { table: 'fts_function_details',  column: 'fts_function_action_type_id',       category: 'FTS_FUNCTION_ACTION_TYPE' },
    { table: 'fts_function_details',  column: 'fts_function_effectiveness_id',     category: 'FTS_FUNCTION_EFFECTIVENESS' },
    { table: 'fts_function_tree',     column: 'relation_type_id',                  category: 'FTS_FUNCTION_RELATION_TYPE' },
    { table: 'fts_function_to_dtis',  column: 'dti_id',                            category: 'FTS_DTI' },
];

const MARIADB_IDENTIFIER_LIMIT = 64;

function triggerName(table: string, column: string, action: 'ins' | 'upd'): string {
  const full = `trg_${table}_${column}_${action}`;
  if (full.length <= MARIADB_IDENTIFIER_LIMIT) return full;
  const short = `trg_${column}_${action}`;
  if (short.length <= MARIADB_IDENTIFIER_LIMIT) return short;
  return short.slice(0, MARIADB_IDENTIFIER_LIMIT);
}

function triggerBody(guard: TypeCategoryGuard): string {
  return `BEGIN
  IF NEW.${guard.column} IS NOT NULL AND
     (SELECT category FROM type WHERE id = NEW.${guard.column}) <> '${guard.category}' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = '${TYPE_CATEGORY_TRIGGER_ERROR_CODE}:${guard.table}.${guard.column}:${guard.category}';
  END IF;
END`;
}

// MySQL rejects CREATE TRIGGER through the prepared-statement protocol
// (error 1295). Run via the mariadb driver's text-protocol `query()`
// instead of Prisma's prepared `$executeRawUnsafe`.
export async function mountTypeCategoryConstraints(conn: Connection): Promise<void> {
  for (const guard of TYPE_CATEGORY_GUARDS) {
    const insName = triggerName(guard.table, guard.column, 'ins');
    const updName = triggerName(guard.table, guard.column, 'upd');
    const body = triggerBody(guard);

    await conn.query(`DROP TRIGGER IF EXISTS ${insName}`);
    await conn.query(
      `CREATE TRIGGER ${insName} BEFORE INSERT ON ${guard.table} FOR EACH ROW ${body}`,
    );

    await conn.query(`DROP TRIGGER IF EXISTS ${updName}`);
    await conn.query(
      `CREATE TRIGGER ${updName} BEFORE UPDATE ON ${guard.table} FOR EACH ROW ${body}`,
    );
  }
}
