import { NextResponse } from "next/server";

import { buildApiUrl } from "@/constants/apiURL";

const BACKEND_HOMEWORK_ENDPOINTS = {
  SUBMISSION_BY_ID: (homeworkStudentId: string) =>
    `/homework/submissions/${homeworkStudentId}`,
  STUDENT_HOMEWORK_BY_ID: (homeworkStudentId: string) =>
    `/students/homework/${homeworkStudentId}`,
};

type UpstreamResult =
  | { kind: "ok"; status: number; payload: any }
  | { kind: "empty"; status: number }
  | { kind: "invalid"; status: number };

type NormalizedOption = {
  id: string;
  optionId: string;
  text: string;
  optionText: string;
  isCorrect?: boolean;
};

type NormalizedQuestion = {
  id: string;
  questionId: string;
  questionText?: string;
  questionType?: string;
  points?: number;
  explanation?: string;
  options: NormalizedOption[];
};

type NormalizedAnswerResult = {
  questionId?: string;
  questionText?: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  correctOptionId?: string;
  correctOptionText?: string;
  explanation?: string;
  isCorrect?: boolean;
  earnedPoints?: number;
  maxPoints?: number;
};

function normalizeComparable(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/^[A-Z][\.\)]\s*/i, "")
    .toLowerCase();
}

function optionLabelFromIndex(index: number) {
  return String.fromCharCode(65 + index);
}

function isMatchingOption(
  optionId: string,
  optionText: string,
  index: number,
  correctAnswer?: string,
  correctOptionId?: string
) {
  const normalizedOptionId = normalizeComparable(optionId);
  const normalizedOptionText = normalizeComparable(optionText);
  const normalizedCorrectAnswer = normalizeComparable(correctAnswer);
  const normalizedCorrectOptionId = normalizeComparable(correctOptionId);
  const optionLabel = normalizeComparable(optionLabelFromIndex(index));

  if (normalizedCorrectOptionId && normalizedOptionId === normalizedCorrectOptionId) {
    return true;
  }

  if (!normalizedCorrectAnswer) {
    return false;
  }

  return [
    normalizedOptionId,
    normalizedOptionText,
    optionLabel,
    normalizeComparable(`${optionLabelFromIndex(index)}. ${optionText}`),
    normalizeComparable(`${optionLabelFromIndex(index)}) ${optionText}`),
  ].includes(normalizedCorrectAnswer);
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getObjectCandidates(payload: any): any[] {
  return [payload?.data?.data, payload?.data, payload].filter(isRecord);
}

function extractDetail(payload: any) {
  return getObjectCandidates(payload)[0] ?? null;
}

function attachDetail(payload: any, detail: any) {
  if (isRecord(payload?.data?.data)) {
    return {
      ...payload,
      data: {
        ...payload.data,
        data: detail,
      },
    };
  }

  if (isRecord(payload?.data)) {
    return {
      ...payload,
      data: detail,
    };
  }

  return detail;
}

function parseAnswerArrayFromTextAnswer(textAnswer?: string | null) {
  if (!textAnswer) {
    return [];
  }

  try {
    const parsed = JSON.parse(textAnswer);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeQuestionOptions(
  rawOptions: unknown,
  correctAnswer?: string,
  correctOptionId?: string
): NormalizedOption[] {
  if (!Array.isArray(rawOptions)) {
    return [];
  }

  const options: NormalizedOption[] = [];

  rawOptions.forEach((option: any, index) => {
    const optionId = String(option?.optionId || option?.id || `option-${index}`);
    const optionText =
      typeof option === "string"
        ? option
        : String(
            option?.text ||
              option?.optionText ||
              option?.content ||
              option?.label ||
              ""
          );

    if (!optionText.trim()) {
      return;
    }

    options.push({
      id: optionId,
      optionId,
      text: optionText,
      optionText,
      isCorrect:
        option?.isCorrect === true ||
        isMatchingOption(optionId, optionText, index, correctAnswer, correctOptionId),
    });
  });

  return options;
}

function normalizeQuestion(rawQuestion: any, index: number): NormalizedQuestion {
  const questionId = String(
    rawQuestion?.questionId || rawQuestion?.id || `question-${index}`
  );
  const correctAnswer =
    rawQuestion?.correctAnswer ||
    rawQuestion?.correctOptionText ||
    rawQuestion?.answer;
  const correctOptionId =
    rawQuestion?.correctOptionId || rawQuestion?.correctAnswerId;
  const rawOptions = Array.isArray(rawQuestion?.options)
    ? rawQuestion.options
    : Array.isArray(rawQuestion?.optionsText)
      ? rawQuestion.optionsText
      : Array.isArray(rawQuestion?.optionTexts)
        ? rawQuestion.optionTexts
        : [];

  return {
    id: questionId,
    questionId,
    questionText:
      rawQuestion?.questionText || rawQuestion?.text || rawQuestion?.content,
    questionType: rawQuestion?.questionType,
    points: rawQuestion?.points ?? rawQuestion?.maxPoints,
    explanation: rawQuestion?.explanation,
    options: normalizeQuestionOptions(rawOptions, correctAnswer, correctOptionId),
  };
}

function extractQuestions(...sources: any[]): NormalizedQuestion[] {
  for (const source of sources) {
    const candidates = [
      source?.questions,
      source?.review?.questions,
      source?.data?.questions,
      source?.data?.review?.questions,
    ];
    const rawQuestions = candidates.find((item) => Array.isArray(item));
    if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
      return rawQuestions.map((question, index) => normalizeQuestion(question, index));
    }
  }

  return [];
}

function normalizeAnswerResult(raw: any): NormalizedAnswerResult {
  return {
    questionId: raw?.questionId || raw?.QuestionId || raw?.id,
    questionText: raw?.questionText || raw?.QuestionText,
    selectedOptionId:
      raw?.selectedOptionId || raw?.SelectedOptionId || raw?.answerId,
    selectedOptionText:
      raw?.selectedOptionText ||
      raw?.SelectedOptionText ||
      raw?.studentAnswer ||
      raw?.selectedAnswer,
    correctOptionId:
      raw?.correctOptionId || raw?.CorrectOptionId || raw?.correctAnswerId,
    correctOptionText:
      raw?.correctOptionText ||
      raw?.CorrectOptionText ||
      raw?.correctAnswer,
    explanation: raw?.explanation,
    isCorrect: raw?.isCorrect,
    earnedPoints: raw?.earnedPoints ?? raw?.score ?? raw?.points,
    maxPoints: raw?.maxPoints ?? raw?.points,
  };
}

function extractAnswerResults(source: any) {
  if (!isRecord(source)) {
    return [];
  }

  const candidates = [
    source.review?.answerResults,
    source.answerResults,
    source.answers,
    source.questionAnswers,
    source.multipleChoiceAnswers,
    source.submissionAnswers,
    parseAnswerArrayFromTextAnswer(source.textAnswer),
  ];

  const rawResults = candidates.find((item) => Array.isArray(item));
  if (!Array.isArray(rawResults)) {
    return [];
  }

  return rawResults.map((item) => normalizeAnswerResult(item));
}

function findQuestionOption(
  question: NormalizedQuestion | undefined,
  optionId?: string,
  optionText?: string
) {
  if (!question) {
    return undefined;
  }

  const normalizedOptionId = normalizeComparable(optionId);
  const normalizedOptionText = normalizeComparable(optionText);

  return question.options.find((option) => {
    const candidateId = normalizeComparable(option.optionId || option.id);
    const candidateText = normalizeComparable(option.optionText || option.text);

    return (
      (normalizedOptionId && candidateId === normalizedOptionId) ||
      (normalizedOptionText && candidateText === normalizedOptionText)
    );
  });
}

function findCorrectQuestionOption(question: NormalizedQuestion | undefined) {
  if (!question) {
    return undefined;
  }

  return question.options.find((option) => option.isCorrect);
}

function buildAnswerResults(
  questions: NormalizedQuestion[],
  primaryResults: NormalizedAnswerResult[],
  studentResults: NormalizedAnswerResult[]
) {
  const total = Math.max(
    questions.length,
    primaryResults.length,
    studentResults.length
  );

  const mergedResults: NormalizedAnswerResult[] = [];

  for (let index = 0; index < total; index += 1) {
    const question = questions[index];
    const primaryResult =
      (question
        ? primaryResults.find(
            (item) =>
              normalizeComparable(item.questionId) ===
              normalizeComparable(question.questionId)
          )
        : undefined) || primaryResults[index];
    const studentResult =
      (question
        ? studentResults.find(
            (item) =>
              normalizeComparable(item.questionId) ===
              normalizeComparable(question.questionId)
          )
        : undefined) || studentResults[index];

    const rawResult = primaryResult || studentResult;
    if (!question && !rawResult) {
      continue;
    }

    const selectedOption =
      findQuestionOption(
        question,
        rawResult?.selectedOptionId,
        rawResult?.selectedOptionText
      ) ||
      findQuestionOption(
        question,
        studentResult?.selectedOptionId,
        studentResult?.selectedOptionText
      );
    const correctOption =
      findQuestionOption(
        question,
        rawResult?.correctOptionId,
        rawResult?.correctOptionText
      ) ||
      findQuestionOption(
        question,
        studentResult?.correctOptionId,
        studentResult?.correctOptionText
      ) ||
      findCorrectQuestionOption(question);

    const mergedResult: NormalizedAnswerResult = {
      questionId:
        rawResult?.questionId ||
        studentResult?.questionId ||
        question?.questionId,
      questionText:
        rawResult?.questionText ||
        studentResult?.questionText ||
        question?.questionText,
      selectedOptionId:
        rawResult?.selectedOptionId || studentResult?.selectedOptionId,
      selectedOptionText:
        rawResult?.selectedOptionText ||
        studentResult?.selectedOptionText ||
        selectedOption?.optionText ||
        selectedOption?.text,
      correctOptionId:
        rawResult?.correctOptionId ||
        studentResult?.correctOptionId ||
        correctOption?.optionId ||
        correctOption?.id,
      correctOptionText:
        rawResult?.correctOptionText ||
        studentResult?.correctOptionText ||
        correctOption?.optionText ||
        correctOption?.text,
      explanation:
        rawResult?.explanation ||
        studentResult?.explanation ||
        question?.explanation,
      isCorrect: rawResult?.isCorrect ?? studentResult?.isCorrect,
      earnedPoints: rawResult?.earnedPoints ?? studentResult?.earnedPoints,
      maxPoints:
        rawResult?.maxPoints ??
        studentResult?.maxPoints ??
        question?.points,
    };

    if (
      mergedResult.questionId ||
      mergedResult.questionText ||
      mergedResult.selectedOptionId ||
      mergedResult.selectedOptionText ||
      mergedResult.correctOptionId ||
      mergedResult.correctOptionText
    ) {
      mergedResults.push(mergedResult);
    }
  }

  return mergedResults;
}

async function fetchUpstreamJson(
  authHeader: string,
  endpoint: string
): Promise<UpstreamResult> {
  const upstream = await fetch(buildApiUrl(endpoint), {
    method: "GET",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  });

  const text = await upstream.text();
  if (!text) {
    return { kind: "empty", status: upstream.status };
  }

  try {
    return {
      kind: "ok",
      status: upstream.status,
      payload: JSON.parse(text),
    };
  } catch {
    return { kind: "invalid", status: upstream.status };
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ homeworkStudentId: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { homeworkStudentId } = await params;

    const [submissionResult, studentHomeworkResult] = await Promise.all([
      fetchUpstreamJson(
        authHeader,
        BACKEND_HOMEWORK_ENDPOINTS.SUBMISSION_BY_ID(homeworkStudentId)
      ),
      fetchUpstreamJson(
        authHeader,
        BACKEND_HOMEWORK_ENDPOINTS.STUDENT_HOMEWORK_BY_ID(homeworkStudentId)
      ).catch(() => null),
    ]);

    if (submissionResult.kind === "empty") {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Empty upstream response" },
        { status: 502 }
      );
    }

    if (submissionResult.kind === "invalid") {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Invalid upstream JSON" },
        { status: 502 }
      );
    }

    const submissionDetail = extractDetail(submissionResult.payload);
    const studentHomeworkDetail =
      studentHomeworkResult?.kind === "ok"
        ? extractDetail(studentHomeworkResult.payload)
        : null;

    if (!submissionDetail) {
      return NextResponse.json(submissionResult.payload, {
        status: submissionResult.status,
      });
    }

    const questions = extractQuestions(submissionDetail, studentHomeworkDetail);
    const answerResults = buildAnswerResults(
      questions,
      extractAnswerResults(submissionDetail),
      extractAnswerResults(studentHomeworkDetail)
    );
    const existingReview = isRecord(submissionDetail.review)
      ? submissionDetail.review
      : {};

    const enrichedDetail = {
      ...submissionDetail,
      ...(questions.length > 0 ? { questions } : {}),
      ...(questions.length > 0
        ? {
            review: {
              ...existingReview,
              questions,
            },
          }
        : {}),
      ...(answerResults.length > 0
        ? {
            review: {
              ...existingReview,
              ...(questions.length > 0 ? { questions } : {}),
              answerResults,
            },
            answerResults,
          }
        : {}),
    };

    return NextResponse.json(
      attachDetail(submissionResult.payload, enrichedDetail),
      { status: submissionResult.status }
    );
  } catch (error) {
    console.error("Homework submission detail proxy error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Proxy request failed" },
      { status: 500 }
    );
  }
}
