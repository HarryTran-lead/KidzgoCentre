/**
 * Placement Test Retake API Route
 * POST /api/placement-tests/[id]/retake - Create a retake placement test
 */

import { NextRequest } from "next/server";
import { BACKEND_PLACEMENT_TEST_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const backendUrl = buildApiUrl(BACKEND_PLACEMENT_TEST_ENDPOINTS.RETAKE(id));

  return forwardToBackend(request, backendUrl, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "placement-tests/retake", id },
  });
}
