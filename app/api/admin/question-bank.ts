// Admin Question Bank API Helpers

import { getAccessToken } from "@/lib/store/authToken";
import { QUESTION_BANK_ENDPOINTS } from "@/constants/apiURL";

export type QuestionType =
    | "MultipleChoice"
    | "TrueFalse"
    | "Essay"
    | "FillInBlank"
    | "TextInput";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type QuestionStatus = "Đang hoạt động" | "Tạm dừng";

export interface QuestionRow {
    id: string;
    content: string;
    type: QuestionType;
    difficulty: DifficultyLevel;
    category: string;
    course: string;
    programId: string;
    branch: string;
    status: QuestionStatus;
    createdAt: string;
    usageCount: number;
}

export interface QuestionDetail extends Omit<QuestionRow, "programId"> {
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    points?: number;
    programId?: string;
    programName?: string;
    branchId?: string;
    updatedAt?: string;
    updatedBy?: string;
    questionText?: string;
    questionType?: QuestionType;
    level?: DifficultyLevel;
}

export interface AiGeneratedQuestionDraft {
    questionText: string;
    questionType: "MultipleChoice" | "TextInput";
    options: string[];
    correctAnswer: string;
    points: number;
    explanation?: string | null;
    topic?: string | null;
    skill?: string | null;
    grammarTags: string[];
    vocabularyTags: string[];
    level?: DifficultyLevel;
}

export interface AiGenerateQuestionPayload {
    programId: string;
    topic: string;
    questionType?: "MultipleChoice" | "TextInput";
    questionCount?: number;
    level?: DifficultyLevel;
    skill?: string;
    taskStyle?: "standard" | "translation";
    grammarTags?: string[];
    vocabularyTags?: string[];
    instructions?: string;
    language?: string;
    pointsPerQuestion?: number;
}

export interface AiGenerateQuestionResult {
    aiUsed: boolean;
    summary?: string;
    warnings: string[];
    items: AiGeneratedQuestionDraft[];
}

function normalizeBooleanFlag(value: any): boolean | null {
    if (value === true) return true;
    if (value === false) return false;
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return null;
        if (["true", "1", "yes", "y", "on", "active"].includes(normalized)) return true;
        if (["false", "0", "no", "n", "off", "inactive"].includes(normalized)) return false;
    }
    return null;
}

interface FetchOptions {
    pageNumber?: number;
    pageSize?: number;
    type?: QuestionType;
    difficulty?: DifficultyLevel;
    status?: QuestionStatus;
    category?: string;
    search?: string;
    programId?: string;
}

function buildQueryString(params: Record<string, any>): string {
    const entries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "");
    if (entries.length === 0) return "";
    return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

function mapRow(item: any): QuestionRow {
    const id = String(item?.id ?? "");
    const content = String(item?.content ?? item?.questionText ?? item?.question_text ?? item?.text ?? "");
    const questionType = item?.type ?? item?.questionType ?? item?.question_type ?? "MultipleChoice";
    const type: QuestionType =
        questionType === "MULTIPLE_CHOICE" || questionType === "MultipleChoice" ? "MultipleChoice"
        : questionType === "TEXT_INPUT" || questionType === "TextInput" ? "TextInput"
        : questionType === "TRUE_FALSE" || questionType === "TrueFalse" ? "TrueFalse"
        : questionType === "ESSAY" || questionType === "Essay" ? "Essay"
        : questionType === "FILL_IN_BLANK" || questionType === "FillInBlank" ? "FillInBlank"
        : "MultipleChoice";
    const levelNum =
        typeof item?.level === "number" ? item.level
        : item?.difficulty === "Easy" ? 0
        : item?.difficulty === "Medium" ? 1
        : item?.difficulty === "Hard" ? 2
        : 1;
    const difficulty: DifficultyLevel =
        levelNum === 0 ? "Easy"
        : levelNum === 2 ? "Hard"
        : "Medium";
    const category = item?.category ?? item?.categoryName ?? item?.subject ?? "";
    const programId = String(item?.programId ?? item?.program_id ?? "");
    const course = item?.programName ?? item?.courseName ?? item?.course ?? "";
    const branch = item?.branch ?? item?.branchName ?? "";
    const isActive = normalizeBooleanFlag(item?.isActive ?? item?.active);
    const status: QuestionStatus = isActive === false ? "Tạm dừng" : "Đang hoạt động";
    const createdAt = item?.createdAt ?? item?.created_date ?? item?.createdDate ?? item?.createdAt ?? "";
    const usageCount = Number(item?.usageCount ?? item?.usage_count ?? item?.timesUsed ?? 0);
    return { id, content, type, difficulty, category, course, programId, branch, status, createdAt, usageCount };
}

export async function fetchAdminQuestions(options: FetchOptions = {}): Promise<{ data: QuestionRow[]; total?: number }> {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập.");
    const qs = buildQueryString(options);
    const res = await fetch(QUESTION_BANK_ENDPOINTS.GET_ALL + qs, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const text = await res.text();
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.message ?? j?.error ?? "Không thể tải danh sách câu hỏi.");
    }
    const json = await res.json();
    let items: any[] = []; let total = 0;
    if (Array.isArray(json?.data?.items?.items)) {
        items = json.data.items.items;
        total = json.data.items.totalCount ?? items.length;
    }
    else if (Array.isArray(json?.data?.items)) { items = json.data.items; total = json.data.totalCount ?? json.data.totalItems ?? items.length; }
    else if (Array.isArray(json?.data?.questions?.items)) { items = json.data.questions.items; total = json.data.questions.totalCount ?? items.length; }
    else if (Array.isArray(json?.data)) { items = json.data; total = items.length; }
    else if (Array.isArray(json)) { items = json; total = items.length; }
    return { data: items.map(mapRow).filter((c: QuestionRow) => c.id), total };
}

export async function fetchAdminQuestionDetail(questionId: string): Promise<QuestionDetail> {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập.");
    const res = await fetch(QUESTION_BANK_ENDPOINTS.GET_BY_ID(questionId), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const text = await res.text();
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.message ?? j?.error ?? "Không thể tải chi tiết câu hỏi.");
    }
    const json = await res.json();
    const item = json?.data ?? json;
    return {
        ...mapRow(item),
        options: item?.options ?? item?.answers ?? [],
        correctAnswer: item?.correctAnswer ?? item?.correct_answer ?? item?.correctAnswer ?? "",
        explanation: item?.explanation ?? "",
        points: Number(item?.points ?? item?.score ?? 1),
        programId: String(item?.programId ?? item?.program_id ?? ""),
        programName: item?.programName ?? "",
        branchId: item?.branchId ?? "",
        updatedAt: item?.updatedAt ?? item?.updated_at ?? "",
        updatedBy: item?.updatedBy ?? "",
        questionText: item?.questionText ?? item?.content ?? "",
        questionType: item?.questionType ?? item?.type ?? "MultipleChoice",
        level: item?.level ?? item?.difficulty ?? "Medium",
    };
}

interface CreateQuestionItem {
    questionText: string;
    questionType: QuestionType;
    options?: string[];
    correctAnswer?: string;
    points?: number;
    explanation?: string;
    level?: DifficultyLevel;
}

export async function createAdminQuestion(payload: {
    programId: string;
    items: CreateQuestionItem[];
}): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập.");
    const res = await fetch(QUESTION_BANK_ENDPOINTS.CREATE, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.message ?? j?.error ?? "Không thể tạo câu hỏi.");
    }
}

export async function updateAdminQuestion(questionId: string, payload: {
    questionText?: string;
    questionType?: QuestionType;
    options?: string[];
    correctAnswer?: string;
    points?: number;
    explanation?: string;
    level?: DifficultyLevel;
}): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập.");
    const res = await fetch(QUESTION_BANK_ENDPOINTS.UPDATE(questionId), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.message ?? j?.error ?? "Không thể cập nhật câu hỏi.");
    }
}

export async function toggleQuestionStatus(questionId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập.");
    const res = await fetch(QUESTION_BANK_ENDPOINTS.TOGGLE_STATUS(questionId), {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const text = await res.text();
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.message ?? j?.error ?? "Không thể thay đổi trạng thái.");
    }
}

export async function deleteAdminQuestion(questionId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập.");
    const res = await fetch(QUESTION_BANK_ENDPOINTS.DELETE(questionId), {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const text = await res.text();
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.message ?? j?.error ?? "Không thể xóa câu hỏi.");
    }
}

export async function importQuestions(programId: string, file: File): Promise<any> {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập.");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${QUESTION_BANK_ENDPOINTS.IMPORT}?programId=${programId}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    const text = await res.text();
    if (!res.ok) {
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.message ?? j?.error ?? "Import thất bại.");
    }
    const j = text ? JSON.parse(text) : null;
    return j?.data ?? j;
}

export async function generateAiQuestionDrafts(
    payload: AiGenerateQuestionPayload
): Promise<AiGenerateQuestionResult> {
    const token = getAccessToken();
    if (!token) throw new Error("Ban chua dang nhap.");

    const res = await fetch(QUESTION_BANK_ENDPOINTS.AI_GENERATE, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : null;

    if (!res.ok) {
        throw new Error(json?.message ?? json?.detail ?? "Khong the tao draft cau hoi bang AI.");
    }

    const data = json?.data ?? json ?? {};
    const items = Array.isArray(data?.items)
        ? data.items.map((item: any) => ({
            questionText: String(item?.questionText ?? item?.content ?? ""),
            questionType:
                item?.questionType === "TextInput" || item?.questionType === "TEXT_INPUT"
                    ? "TextInput"
                    : "MultipleChoice",
            options: Array.isArray(item?.options)
                ? item.options.map((option: any) => String(option ?? "").trim()).filter(Boolean)
                : [],
            correctAnswer: String(item?.correctAnswer ?? ""),
            points: Number(item?.points ?? payload.pointsPerQuestion ?? 1),
            explanation: item?.explanation ?? null,
            topic: item?.topic ?? null,
            skill: item?.skill ?? null,
            grammarTags: Array.isArray(item?.grammarTags)
                ? item.grammarTags.map((tag: any) => String(tag ?? "").trim()).filter(Boolean)
                : [],
            vocabularyTags: Array.isArray(item?.vocabularyTags)
                ? item.vocabularyTags.map((tag: any) => String(tag ?? "").trim()).filter(Boolean)
                : [],
            level:
                item?.level === "Easy" || item?.level === "Medium" || item?.level === "Hard"
                    ? item.level
                    : (payload.level ?? "Medium"),
        }))
        : [];

    return {
        aiUsed: Boolean(data?.aiUsed),
        summary: data?.summary,
        warnings: Array.isArray(data?.warnings)
            ? data.warnings.map((warning: any) => String(warning ?? "").trim()).filter(Boolean)
            : [],
        items,
    };
}
