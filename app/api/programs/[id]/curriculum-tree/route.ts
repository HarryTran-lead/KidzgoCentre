import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import {
  getAuthHeader,
  handleBackendResponse,
  serverErrorResponse,
} from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function buildCurriculumTreeUrl(id: string) {
  const endpoint = BACKEND_ADMIN_ENDPOINTS.PROGRAMS_CURRICULUM_TREE(id);
  const preferredBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
    /\/$/,
    "",
  );

  return preferredBase ? `${preferredBase}${endpoint}` : buildApiUrl(endpoint);
}

function getCookieValue(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const prefix = `${name}=`;
  const match = cookies.find((item) => item.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildCurriculumTreeUrl(id);

  try {
    const cookieToken = getCookieValue(req, "kidzgo.accessToken");
    const authHeader = getAuthHeader(req) ?? (
      cookieToken ? `Bearer ${cookieToken}` : null
    );
    const upstream = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    return handleBackendResponse(upstream, {
      method: "GET",
      endpoint: "programs/curriculum-tree",
      id,
    });
  } catch (error) {
    return serverErrorResponse(
      `Đã xảy ra lỗi khi gọi API curriculum-tree: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
