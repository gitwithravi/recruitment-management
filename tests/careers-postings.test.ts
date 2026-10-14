import assert from "node:assert/strict";
import test from "node:test";

import {
  canAcceptPublicApplications,
  collectFilterOptions,
  filterCareersJobs,
  getPublicJobPageState,
  hasActiveCareersFilters,
  isJobListedOnCareers,
  parseCareersFilters,
} from "../src/features/careers/rules.ts";
import {
  EMPTY_JOB_POSTING_FIELDS,
  buildJobPostingJsonLd,
  formatExperienceRange,
  getJobPostingChips,
  isPastApplyBy,
  parseJobPostingFields,
  serializeJsonLd,
} from "../src/features/jobs/posting.ts";
import {
  isConsentGiven,
  validateApplicationAnswers,
  validateQuestionInput,
  type ApplicationQuestion,
} from "../src/features/questions/rules.ts";

test("posting fields parse optional values and treat blanks as null", () => {
  const { errors, fields } = parseJobPostingFields({
    location: "  Bengaluru ",
    department: "",
    workMode: "hybrid",
    employmentType: "unspecified",
    minExperience: "2",
    maxExperience: "5",
    openings: "3",
    applyBy: "2026-11-30",
  });

  assert.deepEqual(errors, {});
  assert.equal(fields.location, "Bengaluru");
  assert.equal(fields.department, null);
  assert.equal(fields.workMode, "hybrid");
  assert.equal(fields.employmentType, null);
  assert.equal(fields.minExperience, 2);
  assert.equal(fields.openings, 3);
  assert.equal(fields.applyBy?.toISOString(), "2026-11-30T00:00:00.000Z");
  assert.deepEqual(parseJobPostingFields({}).fields, EMPTY_JOB_POSTING_FIELDS);
});

test("posting fields reject invalid values", () => {
  const { errors } = parseJobPostingFields({
    workMode: "moon",
    minExperience: "6",
    maxExperience: "2",
    openings: "0",
    applyBy: "2026-02-30",
  });

  assert.ok(errors.workMode);
  assert.equal(errors.maxExperience, "Maximum experience must be at least the minimum.");
  assert.equal(errors.openings, "Openings must be between 1 and 999.");
  assert.equal(errors.applyBy, "Enter a valid date.");
  assert.equal(
    parseJobPostingFields({ minExperience: "1.5" }).errors.minExperience,
    "Minimum experience must be a whole number.",
  );
});

test("apply-by date closes applications after the end of that UTC day", () => {
  const applyBy = new Date("2026-11-30T00:00:00.000Z");
  assert.equal(isPastApplyBy(null), false);
  assert.equal(isPastApplyBy(applyBy, new Date("2026-11-30T23:59:59.000Z")), false);
  assert.equal(isPastApplyBy(applyBy, new Date("2026-12-01T00:00:00.000Z")), true);

  const job = { status: "open", isPublished: true, applyBy, stageCount: 3 };
  const before = new Date("2026-11-29T12:00:00.000Z");
  const after = new Date("2026-12-02T12:00:00.000Z");
  assert.equal(isJobListedOnCareers(job, before), true);
  assert.equal(isJobListedOnCareers(job, after), false);
  assert.equal(getPublicJobPageState(job, after), "closed");
  assert.equal(canAcceptPublicApplications(job, before), true);
  assert.equal(canAcceptPublicApplications(job, after), false);
});

test("posting chips and experience ranges read naturally", () => {
  assert.equal(formatExperienceRange(null, null), null);
  assert.equal(formatExperienceRange(2, 5), "2–5 yrs");
  assert.equal(formatExperienceRange(3, null), "3+ yrs");
  assert.equal(formatExperienceRange(null, 4), "Up to 4 yrs");
  assert.deepEqual(
    getJobPostingChips({
      ...EMPTY_JOB_POSTING_FIELDS,
      location: "Pune",
      workMode: "remote",
      employmentType: "full_time",
      openings: 1,
    }),
    ["Pune", "Remote", "Full-time", "1 opening"],
  );
});

test("job posting JSON-LD maps fields and cannot break out of its script tag", () => {
  const jsonLd = buildJobPostingJsonLd({
    title: "Engineer </script><script>alert(1)</script>",
    descriptionHtml: "<p>Build things</p>",
    datePosted: new Date("2026-10-01T10:00:00.000Z"),
    organizationName: "Acme",
    url: "https://jobs.example.com/careers/abc",
    posting: {
      ...EMPTY_JOB_POSTING_FIELDS,
      employmentType: "contract",
      workMode: "remote",
      applyBy: new Date("2026-11-30T00:00:00.000Z"),
      minExperience: 2,
    },
  });

  assert.equal(jsonLd["@type"], "JobPosting");
  assert.equal(jsonLd.employmentType, "CONTRACTOR");
  assert.equal(jsonLd.jobLocationType, "TELECOMMUTE");
  assert.equal(jsonLd.validThrough, "2026-11-30T23:59:59Z");
  assert.equal(jsonLd.datePosted, "2026-10-01");
  const serialized = serializeJsonLd(jsonLd);
  assert.equal(serialized.includes("</script>"), false);
  assert.equal(JSON.parse(serialized).title, "Engineer </script><script>alert(1)</script>");
});

test("careers filters parse search params and filter jobs", () => {
  const filters = parseCareersFilters({
    q: " react ",
    location: ["pune", "x"],
    workMode: "remote",
  });
  assert.deepEqual(filters, {
    q: "react",
    location: "pune",
    department: "",
    workMode: "remote",
    employmentType: "",
  });
  assert.equal(hasActiveCareersFilters(parseCareersFilters({})), false);

  const jobs = [
    {
      id: "1",
      title: "Frontend Engineer",
      searchText: "React and TypeScript",
      location: "Pune",
      department: "Engineering",
      workMode: "remote",
      employmentType: "full_time",
    },
    {
      id: "2",
      title: "Recruiter",
      searchText: "Hiring",
      location: "Pune",
      department: "HR",
      workMode: "onsite",
      employmentType: "full_time",
    },
    {
      id: "3",
      title: "Backend Engineer",
      searchText: "Node",
      location: "Delhi",
      department: "Engineering",
      workMode: "remote",
      employmentType: "contract",
    },
  ];

  assert.deepEqual(
    filterCareersJobs(jobs, filters).map((job) => job.id),
    ["1"],
  );
  assert.deepEqual(
    filterCareersJobs(jobs, { ...parseCareersFilters({}), department: "engineering" }).map(
      (job) => job.id,
    ),
    ["1", "3"],
  );
  assert.deepEqual(
    filterCareersJobs(jobs, parseCareersFilters({ q: "delhi" })).map((job) => job.id),
    ["3"],
  );
  assert.deepEqual(collectFilterOptions(["Pune", "pune ", null, "Delhi", ""]), ["Delhi", "Pune"]);
});

test("question input validation", () => {
  assert.deepEqual(
    validateQuestionInput({
      label: " Notice? ",
      type: "short_text",
      options: "a\nb",
      required: true,
    }).input,
    { label: "Notice?", type: "short_text", options: [], required: true },
  );
  assert.deepEqual(
    validateQuestionInput({
      label: "Shift",
      type: "single_choice",
      options: "Day\n\n Night \n",
      required: false,
    }).input?.options,
    ["Day", "Night"],
  );
  assert.ok(
    validateQuestionInput({
      label: "Shift",
      type: "single_choice",
      options: "Day",
      required: false,
    }).errors.options,
  );
  assert.equal(
    validateQuestionInput({
      label: "Shift",
      type: "single_choice",
      options: "Day\nday",
      required: false,
    }).errors.options,
    "Options must be unique.",
  );
  assert.ok(
    validateQuestionInput({ label: "", type: "nope", options: "", required: false }).errors.type,
  );
});

test("application answers are validated per question type", () => {
  const questions: ApplicationQuestion[] = [
    { id: "q1", label: "Relocate?", type: "yes_no", options: [], required: true, position: 1 },
    {
      id: "q2",
      label: "Shift",
      type: "single_choice",
      options: ["Day", "Night"],
      required: true,
      position: 2,
    },
    { id: "q3", label: "Portfolio", type: "short_text", options: [], required: false, position: 3 },
    { id: "q4", label: "Why us?", type: "long_text", options: [], required: true, position: 4 },
  ];

  const valid = validateApplicationAnswers(
    questions,
    (id) => ({ q1: "yes", q2: "Night", q3: "", q4: " Growth " })[id] ?? "",
  );
  assert.deepEqual(valid.errors, {});
  assert.deepEqual(
    valid.answers.map((answer) => [answer.questionId, answer.value]),
    [
      ["q1", "Yes"],
      ["q2", "Night"],
      ["q4", "Growth"],
    ],
  );

  const invalid = validateApplicationAnswers(
    questions,
    (id) => ({ q1: "maybe", q2: "Evening", q3: "x".repeat(301) })[id] ?? "",
  );
  assert.deepEqual(Object.keys(invalid.errors).sort(), ["q1", "q2", "q3", "q4"]);
  assert.equal(invalid.answers.length, 0);
});

test("consent checkbox value", () => {
  assert.equal(isConsentGiven("on"), true);
  assert.equal(isConsentGiven(null), false);
  assert.equal(isConsentGiven(""), false);
});
