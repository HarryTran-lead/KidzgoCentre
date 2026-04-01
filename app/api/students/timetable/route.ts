import { BACKEND_STUDENT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import {
  buildFullUrl,
  forwardToBackend,
  getQueryString,
} from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const queryString = getQueryString(req);
  const backendUrl = buildFullUrl(
    buildApiUrl(BACKEND_STUDENT_ENDPOINTS.TIMETABLE),
    queryString,
  );

  return forwardToBackend(req, backendUrl, {
    method: "GET",
    context: {
      method: "GET",
      endpoint: BACKEND_STUDENT_ENDPOINTS.TIMETABLE,
    },
  });
}
