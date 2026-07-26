// import i18n from "../i18n/config";

import toast from 'react-hot-toast';


type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ToastType = "success" | "error" | "warning" | "info";

interface ApiResponse<T = unknown> {
  isError: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  status?: number;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
//
interface ApiOptions {
  query?: boolean;
  msgs?: boolean;
  fetchOptions?: RequestInit;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  errorMessage?: string;
  successMessage?: string;
  signal?: AbortSignal;
  dedupe?: boolean;
  dedupeKey?: string;
  retry?: number;
  retryDelay?: number;
  validate?: (data: unknown) => unknown;
}

type RequestCredential = "same-origin" | "include" | "omit";

interface ApiConfig {
  baseUrl: string;
  getToken?: () => string | null | undefined;
  getCsrfToken?: () => string | null | undefined;
  getLang?: () => string;
  getSearchParams?: () => string | URLSearchParams | Record<string, unknown>;
  showToast?: (message: string, type: ToastType) => void;
  onUnauthorized?: () => void;
  onError?: (error: Error, response?: Response) => void;
  onSuccess?: (response: ApiResponse) => void;
  onRequestStart?: () => void;
  onRequestEnd?: () => void;
  defaultHeaders?: Record<string, string>;
  defaultTimeout?: number;
  credentials?: RequestCredential;
  fetch?: typeof fetch;
  retry?: number;
  retryDelay?: number;
  exposeErrorDetails?: boolean;
}

interface ApiInstance {
  get: <T = unknown>(endpoint: string, options?: ApiOptions) => Promise<ApiResponse<T>>;
  post: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ) => Promise<ApiResponse<T>>;
  put: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ) => Promise<ApiResponse<T>>;
  delete: <T = unknown>(endpoint: string, options?: ApiOptions) => Promise<ApiResponse<T>>;
  patch: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ) => Promise<ApiResponse<T>>;
  request: <T = unknown>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ) => Promise<ApiResponse<T>>;
}

const GENERIC_ERROR_MESSAGE = "حدث خطأ أثناء تنفيذ الطلب";
const UNEXPECTED_ERROR_MESSAGE = "حدث خطأ غير متوقع";

class ApiCore implements ApiInstance {
  private config: ApiConfig;
  private readonly inflight = new Map<string, Promise<ApiResponse<unknown>>>();

  constructor(config: ApiConfig) {
    this.config = {
      defaultTimeout: 20000,
      credentials: "same-origin",
      ...config,
    };
  }

  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  async get<T = unknown>(endpoint: string, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, data, options);
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, data, options);
  }

  async delete<T = unknown>(endpoint: string, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, options);
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, data, options);
  }

  async request<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    const requestOptions = this.mergeOptions(options);
    const fullUrl = this.buildUrl(endpoint, requestOptions);
    const dedupeKey =
      requestOptions.dedupeKey ?? `${method}:${fullUrl}:${JSON.stringify(data ?? null)}`;

    if (requestOptions.dedupe && method === "GET") {
      const existing = this.inflight.get(dedupeKey);
      if (existing) {
        return existing as Promise<ApiResponse<T>>;
      }

      const promise = this.executeRequest<T>(method, endpoint, data, requestOptions).finally(
        () => {
          this.inflight.delete(dedupeKey);
        }
      );
      this.inflight.set(dedupeKey, promise as Promise<ApiResponse<unknown>>);
      return promise;
    }

    return this.executeRequest<T>(method, endpoint, data, requestOptions);
  }

  private async executeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    data: unknown | undefined,
    requestOptions: ApiOptions
  ): Promise<ApiResponse<T>> {
    try {
      this.config.onRequestStart?.();

      const fullUrl = this.buildUrl(endpoint, requestOptions);
      const headers = this.prepareHeaders(requestOptions);

      const fetchOptions: RequestInit = {
        method,
        headers,
        ...(this.config.credentials && { credentials: this.config.credentials }),
        ...requestOptions.fetchOptions,
      };

      if (data && method !== "GET") {
        if (data instanceof FormData) {
          fetchOptions.body = data;
          delete headers["Content-Type"];
        } else {
          fetchOptions.body = JSON.stringify(data);
          headers["Content-Type"] = "application/json";
        }
      }

      const timeout = requestOptions.timeout || this.config.defaultTimeout || 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      linkAbortSignal(controller, requestOptions.signal);
      fetchOptions.signal = controller.signal;

      const fetchFn = this.resolveFetch();
      const maxRetries = requestOptions.retry ?? this.config.retry ?? 0;
      const baseDelay = requestOptions.retryDelay ?? this.config.retryDelay ?? 300;

      let response: Response | undefined;

      try {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            response = await fetchFn(fullUrl, fetchOptions);

            if (attempt < maxRetries && isRetryableStatus(response.status)) {
              await sleep(baseDelay * 2 ** attempt);
              continue;
            }

            break;
          } catch (error) {
            const isAbort = (error as { name?: string }).name === "AbortError";
            if (isAbort || attempt >= maxRetries) {
              throw error;
            }
            await sleep(baseDelay * 2 ** attempt);
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response) {
        throw new Error("No response received");
      }

      const apiResponse = await this.parseResponse<T>(response);

      if (requestOptions.validate && !apiResponse.isError) {
        try {
          apiResponse.data = requestOptions.validate(apiResponse.data) as T;
        } catch {
          return {
            isError: true,
            data: undefined as T,
            message: this.userFacingMessage("Invalid response format", requestOptions),
            status: response.status,
          };
        }
      }

      if (response.status === 401) {
        this.config.onUnauthorized?.();
        const errResponse = {
          ...apiResponse,
          isError: true,
          message:
            apiResponse.message ||
            this.userFacingMessage("تم تسجيل الخروج - انتهت صلاحية الجلسة", requestOptions),
        } as ApiResponse<T>;
        throw errResponse;
      }

      if (apiResponse.isError) {
        throw apiResponse;
      }

      this.handleSuccess(apiResponse, requestOptions);

      return apiResponse as ApiResponse<T>;
    } catch (error) {
      const handledError = this.handleError(error, requestOptions) as ApiResponse<T>;
      throw handledError;
    } finally {
      this.config.onRequestEnd?.();
    }
  }

  private resolveFetch(): typeof fetch {
    const fetchFn = this.config.fetch ?? (typeof fetch !== "undefined" ? fetch : undefined);
    if (!fetchFn) {
      throw new Error(
        "Fetch implementation missing. Provide config.fetch for this environment."
      );
    }
    return fetchFn;
  }

  private mergeOptions(options?: ApiOptions): ApiOptions {
    return {
      showErrorToast: true,
      showSuccessToast: true,
      msgs: false,
      query: false,
      ...options,
    };
  }

  private buildUrl(endpoint: string, options: ApiOptions): string {
    const cleanEndpoint =
      endpoint.startsWith("/") && this.config.baseUrl.endsWith("/")
        ? endpoint.slice(1)
        : endpoint;

    let fullUrl = `${this.config.baseUrl}${cleanEndpoint}`;

    if (options.query && this.config.getSearchParams) {
      const searchParams = this.config.getSearchParams();
      if (searchParams) {
        const queryString = serializeSearchParams(searchParams);
        if (queryString) {
          fullUrl += endpoint.includes("?") ? `&${queryString}` : `?${queryString}`;
        }
      }
    }

    if (options.params && Object.keys(options.params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += fullUrl.includes("?") ? `&${queryString}` : `?${queryString}`;
      }
    }

    return fullUrl;
  }

  private prepareHeaders(options: ApiOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...this.config.defaultHeaders,
    };

    if (this.config.getLang) {
      const lang = this.config.getLang();
      if (lang) {
        headers["Accept-Language"] = lang;
      }
    }

    if (this.config.getToken) {
      const token = this.config.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const csrf = this.config.getCsrfToken?.();
    if (csrf) {
      headers["X-CSRF-Token"] = csrf;
    }

    mergeSafeHeaders(headers, options.headers);

    return headers;
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const isError = !response.ok;

    try {
      const raw = await parseBodyFromResponse(response);

      if (raw === null) {
        return {
          isError,
          data: undefined as T,
          status: response.status,
        };
      }

      let payload: Record<string, unknown> = {};
      if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
        const rawObj = raw as Record<string, unknown>;
        if ('data' in rawObj) {
          payload = rawObj;
        } else {
          payload = {
            data: rawObj,
            ...(rawObj.message ? { message: rawObj.message } : {}),
            ...(rawObj.errors ? { errors: rawObj.errors } : {})
          };
        }
      } else {
        payload = { data: raw };
      }

      const message =
        typeof payload.message === "string"
          ? sanitizeDisplayMessage(payload.message)
          : undefined;

      return {
        isError,
        ...payload,
        ...(message !== undefined ? { message } : {}),
        status: response.status,
      } as ApiResponse<T>;
    } catch {
      return {
        isError,
        data: undefined as T,
        message: "Failed to parse response",
        status: response.status,
      };
    }
  }

  private handleSuccess<T>(response: ApiResponse<T>, options: ApiOptions): void {
    this.config.onSuccess?.(response as ApiResponse);

    const toastMessage = options.successMessage ?? response.message;
    if (!toastMessage) return;

    const safeMessage = sanitizeDisplayMessage(toastMessage);

    if (options.showSuccessToast && this.config.showToast) {
      this.config.showToast(safeMessage, "success");
    } else if (options.msgs && this.config.showToast) {
      this.config.showToast(safeMessage, "success");
    }
  }

  private handleError(error: unknown, options?: ApiOptions): ApiResponse {
    const errorMessage = this.getErrorMessage(error, options);

    this.config.onError?.(error as Error);

    const errorObj = error as { status?: number, errors?: Record<string, string[]> };
    if (errorObj.status === 401 || errorObj.status === 403) {
      this.config.onUnauthorized?.();
      return {
        isError: true,
        data: undefined,
        message:
          errorMessage ||
          this.userFacingMessage("تم تسجيل الخروج - انتهت صلاحية الجلسة", options),
        errors: errorObj.errors,
        status: errorObj.status || 401,
      };
    }

    if (options?.showErrorToast !== false && this.config.showToast) {
      const message = options?.errorMessage
        ? sanitizeDisplayMessage(options.errorMessage)
        : errorMessage;
      this.config.showToast(message, "error");
    } else if (options?.msgs && this.config.showToast) {
      this.config.showToast(errorMessage, "error");
    }

    return {
      isError: true,
      data: undefined,
      message: errorMessage,
      errors: errorObj.errors,
      status: errorObj.status || 500,
    };
  }

  private shouldExposeErrorDetails(): boolean {
    if (this.config.exposeErrorDetails !== undefined) {
      return this.config.exposeErrorDetails;
    }
    const nodeEnv = (
      globalThis as { process?: { env?: { NODE_ENV?: string } } }
    ).process?.env?.NODE_ENV;
    return nodeEnv === "development";
  }

  private userFacingMessage(detailed: string, options?: ApiOptions): string {
    if (options?.errorMessage) {
      return sanitizeDisplayMessage(options.errorMessage);
    }
    if (this.shouldExposeErrorDetails()) {
      return sanitizeDisplayMessage(detailed);
    }
    return GENERIC_ERROR_MESSAGE;
  }

  private getErrorMessage(error: unknown, options?: ApiOptions): string {
    const err = error as { name?: string; message?: string; errors?: Record<string, string[]> };

    if (err.name === "AbortError") {
      return this.userFacingMessage("Request timeout", options);
    }

    let detailed =
      err.message ||
      (typeof error === "string" ? error : "") ||
      UNEXPECTED_ERROR_MESSAGE;

    if (err.errors && typeof err.errors === "object") {
      const firstError = Object.values(err.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        detailed = firstError[0];
      } else if (typeof firstError === "string") {
        detailed = firstError as string;
      }
    }

    return this.userFacingMessage(detailed, options);
  }
}

function createApi(config: ApiConfig): ApiInstance {
  if (!config.baseUrl) {
    throw new Error("baseUrl is required in API configuration");
  }

  const apiInstance = new ApiCore(config);

  return {
    get: <T = unknown>(endpoint: string, options?: ApiOptions) =>
      apiInstance.request<T>("GET", endpoint, undefined, options),
    post: <T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions) =>
      apiInstance.request<T>("POST", endpoint, data, options),
    put: <T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions) =>
      apiInstance.request<T>("PUT", endpoint, data, options),
    delete: <T = unknown>(endpoint: string, options?: ApiOptions) =>
      apiInstance.request<T>("DELETE", endpoint, undefined, options),
    patch: <T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions) =>
      apiInstance.request<T>("PATCH", endpoint, data, options),
    request: <T = unknown>(
      method: HttpMethod,
      endpoint: string,
      data?: unknown,
      options?: ApiOptions
    ) => apiInstance.request<T>(method, endpoint, data, options),
  };
}



const PROTECTED_HEADER_NAMES = new Set(["authorization", "cookie"]);

function sanitizeDisplayMessage(message: string): string {
  return message
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
}

function mergeSafeHeaders(
  target: Record<string, string>,
  source?: Record<string, string>
): void {
  if (!source) return;

  for (const [key, value] of Object.entries(source)) {
    if (!PROTECTED_HEADER_NAMES.has(key.toLowerCase())) {
      target[key] = value;
    }
  }
}

function serializeSearchParams(
  input: string | URLSearchParams | Record<string, unknown>
): string {
  if (typeof input === "string") {
    return input.startsWith("?") ? input.slice(1) : input;
  }

  if (input instanceof URLSearchParams) {
    return input.toString();
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

async function parseBodyFromResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as unknown;
  }

  const text = await response.text();
  if (!text) return null;
  return text;
}

function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 429;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function linkAbortSignal(
  controller: AbortController,
  external?: AbortSignal | null
): void {
  if (!external) return;
  if (external.aborted) {
    controller.abort();
    return;
  }
  external.addEventListener("abort", () => controller.abort(), { once: true });
}

export const ApiClient = createApi({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem("token"),
  getCsrfToken: () => document.querySelector('meta[name="csrf-token"]')?.getAttribute("content"),
  credentials: "omit",
  exposeErrorDetails: true,
  getLang: () => localStorage.getItem("lang") || "ar",
  // retry: 3,
  // retryDelay: 10000

  showToast: (message, type) => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else if (type === "warning") toast(message);
    else if (type === "info") toast(message);
    else toast(message);
  }
});

