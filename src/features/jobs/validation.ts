import "server-only";

export type JobFieldErrors = {
  title?: string;
  description?: string;
  status?: string;
};

export type StageFieldErrors = {
  name?: string;
};

export type CreateJobInput = {
  title: string;
  description: string;
};

export type UpdateJobInput = {
  title: string;
  description: string;
  status: "open" | "closed";
};

export function parseJobStatus(value: string | undefined): "open" | "closed" | undefined {
  if (value === "open" || value === "closed") {
    return value;
  }
  return undefined;
}

function validateJobText(input: { title: string; description: string }) {
  const errors: JobFieldErrors = {};
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    errors.title = "Job title is required.";
  } else if (title.length > 120) {
    errors.title = "Job title must be 120 characters or fewer.";
  }

  if (!description) {
    errors.description = "Job description is required.";
  } else if (description.length > 10000) {
    errors.description = "Job description must be 10,000 characters or fewer.";
  }

  return { errors, title, description };
}

export function validateCreateJob(input: { title: string; description: string }): {
  errors: JobFieldErrors;
  input: CreateJobInput | null;
} {
  const { errors, title, description } = validateJobText(input);
  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    input: hasErrors ? null : { title, description },
  };
}

export function validateUpdateJob(input: {
  title: string;
  description: string;
  status: string | undefined;
}): { errors: JobFieldErrors; input: UpdateJobInput | null } {
  const { errors, title, description } = validateJobText(input);
  const status = parseJobStatus(input.status);

  if (!status) {
    errors.status = "Select a status.";
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    input: hasErrors || !status ? null : { title, description, status },
  };
}

export function validateStageName(value: string): {
  errors: StageFieldErrors;
  name: string | null;
} {
  const errors: StageFieldErrors = {};
  const name = value.trim();

  if (!name) {
    errors.name = "Stage name is required.";
  } else if (name.length > 80) {
    errors.name = "Stage name must be 80 characters or fewer.";
  }

  return {
    errors,
    name: Object.keys(errors).length > 0 ? null : name,
  };
}
