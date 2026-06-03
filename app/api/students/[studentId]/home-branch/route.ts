import { buildApiUrl, BACKEND_STUDENT_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ studentId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_STUDENT_BRANCH_ENDPOINTS.HOME_BRANCH(studentId));
  return forwardToBackend(req, buildFullUrl(backendUrl, queryString), {
    method: "GET",
    context: { method: "GET", endpoint: "students/home-branch", studentId },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { studentId } = await params;
  const backendUrl = buildApiUrl(BACKEND_STUDENT_BRANCH_ENDPOINTS.HOME_BRANCH(studentId));
  return forwardToBackend(req, backendUrl, {
    method: "PUT",
    context: { method: "PUT", endpoint: "students/home-branch", studentId },
  });
}
