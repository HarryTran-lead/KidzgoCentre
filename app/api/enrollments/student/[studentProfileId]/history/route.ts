/**
 * Enrollment Student History API Route
 * GET /api/enrollments/student/[studentProfileId]/history - Get enrollment history for a student
 */

import { NextRequest } from 'next/server';
import { BACKEND_ENROLLMENT_ENDPOINTS } from '@/constants/apiURL';
import { proxyEnrollmentRequest } from '../../../_proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentProfileId: string }> }
) {
  const { studentProfileId } = await params;
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `${BACKEND_ENROLLMENT_ENDPOINTS.STUDENT_HISTORY(studentProfileId)}?${queryString}`
    : BACKEND_ENROLLMENT_ENDPOINTS.STUDENT_HISTORY(studentProfileId);

  return proxyEnrollmentRequest(request, endpoint, 'GET');
}
