import { type UserType } from './user.type';

export function createFullName(user: UserType): string {
  const patronymic = user.patronymic ? ` ${user.patronymic}` : '';
  return `${user.lastName} ${user.firstName}` + patronymic;
}

export function createShortName(user: UserType): string {
  const firstName = ` ${user.firstName[0]}.`;
  const patronymic = user.patronymic ? ` ${user.patronymic[0]}.` : '';
  return `${user.lastName}${firstName}${patronymic}`;
}
