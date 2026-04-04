import { EXTRACURRICULAR_PROGRAM_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";

export type ExtracurricularQuery = QueryParams;

export async function getExtracurricularPrograms(
  params?: ExtracurricularQuery
): Promise<any> {
  return get<any>(
    `${EXTRACURRICULAR_PROGRAM_ENDPOINTS.BASE}${buildQueryString(params)}`
  );
}

export async function createExtracurricularProgram(
  payload: Record<string, unknown>
): Promise<any> {
  return post<any>(EXTRACURRICULAR_PROGRAM_ENDPOINTS.BASE, payload);
}

export async function updateExtracurricularProgram(
  id: string,
  payload: Record<string, unknown>
): Promise<any> {
  return put<any>(EXTRACURRICULAR_PROGRAM_ENDPOINTS.BY_ID(id), payload);
}
