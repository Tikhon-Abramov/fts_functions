import {
  type ActionLabel,
  type Category,
  type Centralization,
  type CompetenceCenter,
  type Complexity,
  type Efficiency,
  type LinkKind,
  type Marker,
  type Periodicity,
  type Who,
} from './data.types';
import { TypesCodeEnum } from './types-code.enum';

export const CentralizationMap: Record<Centralization, string> = {
  Да: TypesCodeEnum.FTS_CENTRALIZATION_YES,
  Нет: TypesCodeEnum.FTS_CENTRALIZATION_NO,
};

export const CategoryMap: Record<Category, string> = {
  Методология: TypesCodeEnum.METHODOLOGY,
  'Фактическое действие': TypesCodeEnum.ACTUAL_ACTION,
  'Контроль/Аналитика': TypesCodeEnum.CONTROL_ANALYTICS,
};

export const WhoMap: Record<Who, string> = {
  ФНС: TypesCodeEnum.FEDERAL_TAX_SERVICE,
  ТНО: TypesCodeEnum.TERRITORIAL_OFFICE,
  ЦК: TypesCodeEnum.COMPETENCY_CENTER,
  МИУДОЛ: TypesCodeEnum.INTERREGIONAL_INSPECTION,
  'ТНО/ЦК': TypesCodeEnum.COMPETENCY_CENTER__TERRITORIAL_OFFICE,
  'ФНС/ЦК': TypesCodeEnum.FEDERAL_TAX_SERVICE__COMPETENCY_CENTER,
  'МИУДОЛ/ЦК': TypesCodeEnum.INTERREGIONAL_INSPECTION__COMPETENCY_CENTER,
  'МИУДОЛ/ТНО': TypesCodeEnum.INTERREGIONAL_INSPECTION__TERRITORIAL_OFFICE,
  'МИУДОЛ/ФНС': TypesCodeEnum.INTERREGIONAL_INSPECTION__FEDERAL_TAX_SERVICE,
  'ТНО/ПРД': TypesCodeEnum.TERRITORIAL_OFFICE__PRD,
  'ТНО/ПРД/МИУДОЛ': TypesCodeEnum.TERRITORIAL_OFFICE__PRD__INTERREGIONAL_INSPECTION,
  'ПРД/МИУДОЛ': TypesCodeEnum.PRD__INTERREGIONAL_INSPECTION,
  'ТНО/ЦК/МИУДОЛ': TypesCodeEnum.COMPETENCY_CENTER__TERRITORIAL_OFFICE__INTERREGIONAL_INSPECTION,
  'ЦК/ТНО/МИУДОЛ': TypesCodeEnum.COMPETENCY_CENTER__TERRITORIAL_OFFICE__INTERREGIONAL_INSPECTION,
};

export const ActionLabelMap: Record<ActionLabel, string> = {
  Оставить: TypesCodeEnum.KEEP,
  Передать: TypesCodeEnum.TRANSFER,
  Оптимизировать: TypesCodeEnum.OPTIMIZE,
  'Оптимизировать / Передать': TypesCodeEnum.OPTIMIZE_TRANSFER,
  'Оптимизировать / Оставить': TypesCodeEnum.OPTIMIZE_KEEP,
  'Решение по результатам пилота': TypesCodeEnum.PILOT_RESULT,
  Убрать: TypesCodeEnum.REMOVE,
};

export const PeriodicityMap: Record<Periodicity, string> = {
  Ежедневно: TypesCodeEnum.DAILY,
  Еженедельно: TypesCodeEnum.WEEKLY,
  Ежемесячно: TypesCodeEnum.MONTHLY,
  'По событию': TypesCodeEnum.ON_EVENT,
  Разово: TypesCodeEnum.ONCE,
};

export const ComplexityMap: Record<Complexity, string> = {
  Низкая: TypesCodeEnum.SIMPLE_COMPLEXITY,
  Средняя: TypesCodeEnum.MIDDLE_COMPLEXITY,
  Высокая: TypesCodeEnum.HARD_COMPLEXITY,
};

export const EfficiencyMap: Record<Efficiency, string> = {
  Низкая: TypesCodeEnum.SIMPLE_EFFECTIVENESS,
  Средняя: TypesCodeEnum.MIDDLE_EFFECTIVENESS,
  Высокая: TypesCodeEnum.HARD_EFFECTIVENESS,
};

export const LinkKindMap: Record<LinkKind, string> = {
  related: TypesCodeEnum.CONNECTED,
  depends_on: TypesCodeEnum.DEPENDS_ON,
  controls: TypesCodeEnum.CONTROLS,
};

export const MarkerMap: Record<Marker, string> = {
  'Урегулирование задолженности': TypesCodeEnum.DEBT_SETTLEMENT,
  'Преследование при наличии деликтного поведения': TypesCodeEnum.PROSECUTION,
};

export const CompetenceCenterMap: Record<CompetenceCenter, string> = {
  ПВА: TypesCodeEnum.PVA,
  СБЗ: TypesCodeEnum.SBZ,
  ВСИ: TypesCodeEnum.VSI,
  КНБ: TypesCodeEnum.KNB,
  ОКНО: TypesCodeEnum.OKNO,
  ЦОП: TypesCodeEnum.COP,
  ПРД: TypesCodeEnum.PRD,
  ПМВ: TypesCodeEnum.PMV,
  ИПБ: TypesCodeEnum.IPB,
  РКМ: TypesCodeEnum.RKM,
  РАУ: TypesCodeEnum.RAU,
  ВПД: TypesCodeEnum.VPD,
};
