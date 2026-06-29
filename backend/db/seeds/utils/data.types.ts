export type Category = 'Методология' | 'Фактическое действие' | 'Контроль/Аналитика';
export type ActionLabel =
  | 'Оставить'
  | 'Передать'
  | 'Оптимизировать'
  | 'Оптимизировать / Передать'
  | 'Решение по результатам пилота'
  | 'Оптимизировать / Оставить'
  | 'Убрать';
export type LinkKind = 'related' | 'depends_on' | 'controls';
export type Periodicity = 'Ежедневно' | 'Еженедельно' | 'Ежемесячно' | 'По событию' | 'Разово';
export type Complexity = 'Низкая' | 'Средняя' | 'Высокая';
export type Efficiency = 'Низкая' | 'Средняя' | 'Высокая';
export type Marker =
  | 'Урегулирование задолженности'
  | 'Преследование при наличии деликтного поведения';
export type Centralization = 'Да' | 'Нет';
export type CompetenceCenter =
  | 'ПВА'
  | 'СБЗ'
  | 'ВСИ'
  | 'КНБ'
  | 'ОКНО'
  | 'ЦОП'
  | 'ПРД'
  | 'ПМВ'
  | 'ИПБ'
  | 'РКМ'
  | 'РАУ'
  | 'ВПД';
export type Who =
  | 'ФНС'
  | 'ТНО'
  | 'ЦК'
  | 'МИУДОЛ'
  | 'ТНО/ЦК'
  | 'ФНС/ЦК'
  | 'МИУДОЛ/ЦК'
  | 'МИУДОЛ/ТНО'
  | 'МИУДОЛ/ФНС'
  | 'ТНО/ПРД'
  | 'ТНО/ПРД/МИУДОЛ'
  | 'ПРД/МИУДОЛ'
  | 'ТНО/ЦК/МИУДОЛ'
  | 'ЦК/ТНО/МИУДОЛ';

export type Row = {
  id: string;
  step: 1 | 2;
  category: Category;
  detailText: string;
  who: Who | '';
  actionLabel: ActionLabel | '';
  periodicity?: Periodicity | '';
  complexity?: Complexity | '';
  artifact?: string;
  basis?: string;
  artifactUsage?: string;
  purpose?: string;
  efficiency?: Efficiency | '';
  transferTo?: string;
  controlPoint?: string;
  nextAction?: string;
};

export type Link = {
  id: string;
  fromId: string;
  toId: string;
  kind: LinkKind;
};

export type FunctionDetails = {
  rows: Row[];
  links: Link[];
};

export type FunctionRecord = {
  id: string;
  name: string;
  marker: Marker;
  centralization: Centralization;
  competenceCenter: CompetenceCenter;
  strategyProjects: [];
  curatorCA: string;
  nuZnu: string;
  managerMiudol: string;
  niZni: string;
  details: FunctionDetails;
};
