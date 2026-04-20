/**
 * Placement Test Availability API Route
 * GET /api/placement-tests/availability - Check invigilator and room availability by schedule window
 */

import { NextRequest } from "next/server";
import { BACKEND_PLACEMENT_TEST_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

export async function GET(request: NextRequest) {
  const queryString = getQueryString(request);
  const backendUrl = buildFullUrl(
    buildApiUrl(BACKEND_PLACEMENT_TEST_ENDPOINTS.AVAILABILITY),
    queryString,
  );

  return forwardToBackend(request, backendUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "placement-tests/availability" },
  });
}
