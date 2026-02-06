import { SESSION_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";

export type SourceSession = {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  branchName?: string;
  plannedDatetime?: string;
  actualDatetime?: string;
  durationMinutes?: number;
};

export type SessionByIdResponse = {
  isSuccess: boolean;
  data: {
    session: SourceSession;
  };
};

export async function getSessionById(id: string): Promise<SessionByIdResponse> {
  return get<SessionByIdResponse>(SESSION_ENDPOINTS.GET_BY_ID(id));
}
