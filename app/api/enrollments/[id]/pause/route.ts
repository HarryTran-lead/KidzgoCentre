/**
 * Enrollment Pause API Route
 * PATCH /api/enrollments/[id]/pause - Pause an enrollment
 */

import { NextRequest } from 'next/server';
import { BACKEND_ENROLLMENT_ENDPOINTS } from '@/constants/apiURL';
import { proxyEnrollmentRequest } from '../../_proxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyEnrollmentRequest(
    request,
    BACKEND_ENROLLMENT_ENDPOINTS.PAUSE(id),
    'PATCH',
  );
}
