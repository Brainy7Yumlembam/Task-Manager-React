export type FilterType = 'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE';

export type SortBy = 'DUE_DATE' | 'PRIORITY' | 'CREATED_AT';

export type SortOrder = 'ASC' | 'DESC';

export interface TaskFilterOptions {
  filterType: FilterType;
  sortBy: SortBy;
  sortOrder: SortOrder;
  searchQuery: string;
}
