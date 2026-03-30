import { buildApiUrl, BACKEND_QUESTION_BANK_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildApiUrl(BACKEND_QUESTION_BANK_ENDPOINTS.GET_BY_ID(id));
  return forwardToBackend(req, url, {
    method: "GET",
    context: { method: "GET", endpoint: "question-bank", id },
  });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const url = buildApiUrl(BACKEND_QUESTION_BANK_ENDPOINTS.UPDATE(id));
  return forwardToBackend(req, url, {
    method: "PUT",
    body,
    context: { method: "PUT", endpoint: "question-bank", id },
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildApiUrl(BACKEND_QUESTION_BANK_ENDPOINTS.DELETE(id));
  return forwardToBackend(req, url, {
    method: "DELETE",
    context: { method: "DELETE", endpoint: "question-bank", id },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildApiUrl(BACKEND_QUESTION_BANK_ENDPOINTS.TOGGLE_STATUS(id));
  return forwardToBackend(req, url, {
    method: "PATCH",
    context: { method: "PATCH", endpoint: "question-bank/toggle-status", id },
  });
}
