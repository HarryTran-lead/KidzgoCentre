export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
  }
  export interface ErrorResponse {
    success?: boolean;
    data: {
      message?: string,
    }
    error?: [
      message?: string,
      field?: string,
    ]
  }