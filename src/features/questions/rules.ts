export const QUESTION_TYPES = ["short_text", "long_text", "yes_no", "single_choice"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short answer",
  long_text: "Paragraph",
  yes_no: "Yes / No",
  single_choice: "Single choice",
};

export const QUESTION_LABEL_MAX = 300;
export const QUESTION_OPTION_MAX = 120;
export const QUESTION_OPTIONS_MIN = 2;
export const QUESTION_OPTIONS_MAX = 20;
export const SHORT_ANSWER_MAX = 300;
export const LONG_ANSWER_MAX = 3000;
export const MAX_QUESTIONS_PER_JOB = 20;

export const YES_NO_VALUES = { yes: "Yes", no: "No" } as const;

export type QuestionFieldErrors = {
  label?: string;
  type?: string;
  options?: string;
};

export type QuestionInput = {
  label: string;
  type: QuestionType;
  options: string[];
  required: boolean;
};

export type ApplicationQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  options: string[];
  required: boolean;
  position: number;
};

export function parseQuestionType(value: string): QuestionType | null {
  return (QUESTION_TYPES as readonly string[]).includes(value) ? (value as QuestionType) : null;
}

export function parseQuestionOptions(value: string) {
  return value
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);
}

export function validateQuestionInput(input: {
  label: string;
  type: string;
  options: string;
  required: boolean;
}): { errors: QuestionFieldErrors; input: QuestionInput | null } {
  const errors: QuestionFieldErrors = {};
  const label = input.label.trim();
  const type = parseQuestionType(input.type.trim());
  let options: string[] = [];

  if (!label) {
    errors.label = "Question is required.";
  } else if (label.length > QUESTION_LABEL_MAX) {
    errors.label = `Question must be ${QUESTION_LABEL_MAX} characters or fewer.`;
  }

  if (!type) {
    errors.type = "Select a question type.";
  }

  if (type === "single_choice") {
    options = parseQuestionOptions(input.options);
    const unique = new Set(options.map((option) => option.toLowerCase()));

    if (options.length < QUESTION_OPTIONS_MIN || options.length > QUESTION_OPTIONS_MAX) {
      errors.options = `Add between ${QUESTION_OPTIONS_MIN} and ${QUESTION_OPTIONS_MAX} options, one per line.`;
    } else if (options.some((option) => option.length > QUESTION_OPTION_MAX)) {
      errors.options = `Each option must be ${QUESTION_OPTION_MAX} characters or fewer.`;
    } else if (unique.size !== options.length) {
      errors.options = "Options must be unique.";
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    input: hasErrors || !type ? null : { label, type, options, required: input.required },
  };
}

export function questionFieldName(questionId: string) {
  return `question_${questionId}`;
}

export type ValidatedAnswer = {
  questionId: string;
  questionLabel: string;
  value: string;
  position: number;
};

export function validateApplicationAnswers(
  questions: ApplicationQuestion[],
  readValue: (questionId: string) => string,
): { errors: Record<string, string>; answers: ValidatedAnswer[] } {
  const errors: Record<string, string> = {};
  const answers: ValidatedAnswer[] = [];

  for (const question of questions) {
    const raw = readValue(question.id).trim();

    if (!raw) {
      if (question.required) {
        errors[question.id] = "This question is required.";
      }
      continue;
    }

    let value: string | null = raw;

    if (question.type === "short_text" && raw.length > SHORT_ANSWER_MAX) {
      errors[question.id] = `Answer must be ${SHORT_ANSWER_MAX} characters or fewer.`;
      value = null;
    } else if (question.type === "long_text" && raw.length > LONG_ANSWER_MAX) {
      errors[question.id] = `Answer must be ${LONG_ANSWER_MAX} characters or fewer.`;
      value = null;
    } else if (question.type === "yes_no") {
      value = raw === "yes" ? YES_NO_VALUES.yes : raw === "no" ? YES_NO_VALUES.no : null;
      if (!value) {
        errors[question.id] = "Select yes or no.";
      }
    } else if (question.type === "single_choice" && !question.options.includes(raw)) {
      errors[question.id] = "Select one of the options.";
      value = null;
    }

    if (value !== null) {
      answers.push({
        questionId: question.id,
        questionLabel: question.label,
        value,
        position: question.position,
      });
    }
  }

  return { errors, answers };
}

export function isConsentGiven(value: unknown) {
  return value === "on" || value === "true" || value === "yes";
}
