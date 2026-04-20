import { BACKEND_REGISTRATION_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PAYMENT_SETTING);
  const fullUrl = buildFullUrl(url, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "GET",
    context: {
      method: "GET",
      endpoint: "registrations/enrollment-confirmation-payment-setting",
    },
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PAYMENT_SETTING);

  return forwardToBackend(req, url, {
    method: "PUT",
    body,
    context: {
      method: "PUT",
      endpoint: "registrations/enrollment-confirmation-payment-setting",
    },
  });
}
