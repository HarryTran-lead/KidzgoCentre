/**
 * Session Availability API Route
 * GET /api/sessions/availability - Check teacher and room availability by schedule window
 * Returns teachers and rooms with isAvailable based on conflicts with class sessions and placement tests
 */

import { NextRequest } from "next/server";
import { BACKEND_SESSION_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

export async function GET(request: NextRequest) {
  const queryString = getQueryString(request);
  const backendUrl = buildFullUrl(
    buildApiUrl(BACKEND_SESSION_ENDPOINTS.AVAILABILITY),
    queryString,
  );

  return forwardToBackend(request, backendUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "sessions/availability" },
  });
}
