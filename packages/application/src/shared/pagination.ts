export interface PageRequest {
  page: number; // à partir de 1
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const MAX_PAGE_SIZE = 50;

export function normalizePage(input?: { page?: number; pageSize?: number }): PageRequest {
  const page = Number.isInteger(input?.page) && (input!.page as number) >= 1 ? (input!.page as number) : 1;
  const raw = Number.isInteger(input?.pageSize) ? (input!.pageSize as number) : 10;
  return { page, pageSize: Math.min(Math.max(raw, 1), MAX_PAGE_SIZE) };
}
