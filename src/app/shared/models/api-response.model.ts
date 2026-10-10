export interface StandardResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface ApiMessageResponse {
  message: string;
  status?: number;
}
