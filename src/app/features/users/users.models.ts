export interface UserSummary {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  resourceUrl: string | null;
}

export interface PaginatedUsers {
  dataList: UserSummary[];
  dataCount: number;
}
