export interface ApiResponse<T> {
    success?: boolean; 
    isSuccess?: boolean; 
    data: T;
    message?: string;
  }
  export interface ErrorResponse {
    success?: boolean;
    isSuccess?: boolean;
    data: {
      message?: string,
    }
    error?: [
      message?: string,
      field?: string,
    ]
  }
  export type ListData<T> =
  | T[]
  | { items: T[] };