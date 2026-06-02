import { buildApiUrl, BACKEND_STUDENT_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ studentId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_STUDENT_BRANCH_ENDPOINTS.BRANCH_TRANSFER_HISTORY(studentId));
  return forwardToBackend(req, buildFullUrl(backendUrl, queryString), {
    method: "GET",
    context: { method: "GET", endpoint: "students/branch-transfer/history", studentId },
  });
}

export async function POST(req: Request, { params }: Params) {
  const { studentId } = await params;
  const backendUrl = buildApiUrl(BACKEND_STUDENT_BRANCH_ENDPOINTS.BRANCH_TRANSFER(studentId));
  return forwardToBackend(req, backendUrl, {
    method: "POST",
    context: { method: "POST", endpoint: "students/branch-transfer", studentId },
  });
}
