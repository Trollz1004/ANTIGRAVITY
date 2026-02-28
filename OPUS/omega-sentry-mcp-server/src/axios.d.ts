declare module "axios" {
  interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  }

  interface AxiosRequestConfig {
    method?: string;
    url?: string;
    data?: unknown;
    params?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
  }

  interface AxiosStatic {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    (config: AxiosRequestConfig): Promise<AxiosResponse>;
    isAxiosError(payload: unknown): boolean;
  }

  const axios: AxiosStatic;
  export default axios;
  export type AxiosError = Error & {
    response?: { status: number; data?: unknown };
    code?: string;
  };
}
