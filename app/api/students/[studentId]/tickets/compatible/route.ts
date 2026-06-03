import { proxyJson } from "@/app/api/_utils/proxy";
import { BACKEND_LEARNING_TICKET_ENDPOINTS } from "@/constants/apiURL";

type StudentTicketContext = {
  params: Promise<{ studentId: string }>;
};

export async function GET(req: Request, context: StudentTicketContext) {
  const { studentId: studentProfileId } = await context.params;

  return proxyJson({
    req,
    endpoint: BACKEND_LEARNING_TICKET_ENDPOINTS.COMPATIBLE(studentProfileId),
    method: "GET",
    includeQuery: true,
  });
}
