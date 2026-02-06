import { NextResponse } from "next/server";

/**
 * Standard error response for unauthorized requests
 */
export function unauthorizedResponse(message: string = "Chưa đăng nhập") {
  return NextResponse.json(
    {
      success: false,
      data: null,
      message,
    },
    { status: 401 }
  );
}

/**
 * Standard error response for server errors
 */
export function serverErrorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      message,
    },
    { status }
  );
}

/**
 * Extract authorization header from request
 */
export function getAuthHeader(req: Request): string | null {
  return req.headers.get("authorization");
}

/**
 * Parse JSON response safely
 */
export async function parseJsonResponse(response: Response): Promise<{ data: any; error: string | null }> {
  const text = await response.text();
  
  if (!text) {
    return { data: null, error: "Empty response from backend" };
  }

  try {
    const data = JSON.parse(text);
    return { data, error: null };
  } catch (parseError) {
    return { data: null, error: `Invalid JSON: ${text.substring(0, 200)}` };
  }
}

/**
 * Handle backend API response with error handling
 */
export async function handleBackendResponse(
  response: Response,
  context: { method: string; endpoint: string; id?: string }
): Promise<NextResponse> {
  const { data, error } = await parseJsonResponse(response);

  if (!response.ok) {
    const errorMessage = data?.message || data?.detail || `Backend error: ${response.status} ${response.statusText}`;
    console.error(`[${context.method}] ${context.endpoint}${context.id ? `/${context.id}` : ""} failed:`, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      error: error || errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        isSuccess: false,
        data: null,
        message: errorMessage,
      },
      { status: response.status }
    );
  }

  if (error) {
    console.error(`[${context.method}] ${context.endpoint}${context.id ? `/${context.id}` : ""} - Parse error:`, error);
    return serverErrorResponse("Invalid JSON response from backend");
  }

  return NextResponse.json(data, {
    status: response.status,
  });
}

/**
 * Forward request to backend API with standard error handling
 */
export async function forwardToBackend(
  req: Request,
  backendUrl: string,
  options: {
    method?: string;
    body?: any;
    context?: { method: string; endpoint: string; id?: string };
  } = {}
): Promise<NextResponse> {
  const { method = "GET", body, context } = options;
  const authHeader = getAuthHeader(req);

  if (!authHeader) {
    return unauthorizedResponse();
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      fetchOptions.body = JSON.stringify(body);
    }

    const upstream = await fetch(backendUrl, fetchOptions);
    return await handleBackendResponse(upstream, context || { method, endpoint: backendUrl });
  } catch (error) {
    const endpoint = context?.endpoint || backendUrl;
    const id = context?.id ? `/${context.id}` : "";
    console.error(`[${method}] ${endpoint}${id} - Request failed:`, error);
    return serverErrorResponse(
      `Đã xảy ra lỗi khi gọi API: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get query string from request URL
 */
export function getQueryString(req: Request): string {
  const { searchParams } = new URL(req.url);
  return searchParams.toString();
}

/**
 * Build full URL with query string
 */
export function buildFullUrl(baseUrl: string, queryString?: string): string {
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
