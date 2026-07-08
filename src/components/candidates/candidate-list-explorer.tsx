"use client";

import * as React from "react";
import { Search, UserPlus } from "lucide-react";

import { CandidatesTable } from "@/components/candidates/candidates-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CandidateFilterOptions,
  CandidateListItem,
} from "@/features/candidates/queries";

type CandidateListExplorerProps = {
  jobId: string;
  candidates: CandidateListItem[];
  options: CandidateFilterOptions;
};

type FilterState = {
  search: string;
  stageId: string;
  assignedUserId: string;
  source: string;
  currentCity: string;
  minExperience: string;
  maxExperience: string;
  noticePeriod: string;
};

const ALL = "__all__";

const initialFilters: FilterState = {
  search: "",
  stageId: ALL,
  assignedUserId: ALL,
  source: ALL,
  currentCity: ALL,
  minExperience: "",
  maxExperience: "",
  noticePeriod: ALL,
};

function includesText(value: string, search: string) {
  return value.toLowerCase().includes(search.toLowerCase());
}

export function CandidateListExplorer({
  jobId,
  candidates,
  options,
}: CandidateListExplorerProps) {
  const [filterState, setFilterState] = React.useState<FilterState>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filterState.search);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [filterState.search]);

  const filteredCandidates = React.useMemo(() => {
    const minExperience = filterState.minExperience ? Number(filterState.minExperience) : null;
    const maxExperience = filterState.maxExperience ? Number(filterState.maxExperience) : null;
    const search = debouncedSearch.trim();

    return candidates.filter((candidate) => {
      if (filterState.stageId !== ALL && candidate.currentStage.id !== filterState.stageId) {
        return false;
      }
      if (
        filterState.assignedUserId !== ALL &&
        candidate.assignedUser?.id !== filterState.assignedUserId
      ) {
        return false;
      }
      if (filterState.source !== ALL && candidate.source !== filterState.source) {
        return false;
      }
      if (filterState.currentCity !== ALL && candidate.currentCity !== filterState.currentCity) {
        return false;
      }
      if (filterState.noticePeriod !== ALL && candidate.noticePeriod !== filterState.noticePeriod) {
        return false;
      }
      if (minExperience !== null && Number(candidate.totalExperience) < minExperience) {
        return false;
      }
      if (maxExperience !== null && Number(candidate.totalExperience) > maxExperience) {
        return false;
      }
      if (
        search &&
        !includesText(candidate.name, search) &&
        !includesText(candidate.email, search) &&
        !includesText(candidate.phone, search)
      ) {
        return false;
      }

      return true;
    });
  }, [candidates, debouncedSearch, filterState]);

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilterState((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="candidate-list-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="candidate-list-search"
                value={filterState.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Name, email, or phone"
                className="pl-8"
              />
            </div>
          </div>
          <FilterSelect
            id="candidate-list-stage"
            label="Stage"
            value={filterState.stageId}
            onChange={(value) => updateFilter("stageId", value)}
            options={options.stages.map((stage) => ({ label: stage.name, value: stage.id }))}
          />
          <FilterSelect
            id="candidate-list-assignee"
            label="Assignee"
            value={filterState.assignedUserId}
            onChange={(value) => updateFilter("assignedUserId", value)}
            options={options.assignedUsers.map((user) => ({
              label: `@${user.username}`,
              value: user.id,
            }))}
          />
          <FilterSelect
            id="candidate-list-source"
            label="Source"
            value={filterState.source}
            onChange={(value) => updateFilter("source", value)}
            options={options.sources.map((source) => ({ label: source, value: source }))}
          />
          <FilterSelect
            id="candidate-list-city"
            label="City"
            value={filterState.currentCity}
            onChange={(value) => updateFilter("currentCity", value)}
            options={options.cities.map((city) => ({ label: city, value: city }))}
          />
          <FilterSelect
            id="candidate-list-notice"
            label="Notice period"
            value={filterState.noticePeriod}
            onChange={(value) => updateFilter("noticePeriod", value)}
            options={options.noticePeriods.map((noticePeriod) => ({
              label: noticePeriod,
              value: noticePeriod,
            }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="candidate-list-min-exp">Min exp</Label>
              <Input
                id="candidate-list-min-exp"
                value={filterState.minExperience}
                onChange={(event) => updateFilter("minExperience", event.target.value)}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-list-max-exp">Max exp</Label>
              <Input
                id="candidate-list-max-exp"
                value={filterState.maxExperience}
                onChange={(event) => updateFilter("maxExperience", event.target.value)}
                inputMode="decimal"
                placeholder="20"
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filteredCandidates.length} of {candidates.length} candidates shown
          </p>
          <Button variant="outline" size="sm" onClick={() => setFilterState(initialFilters)}>
            Clear filters
          </Button>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-12 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <UserPlus className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium">No candidates match the current filters</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Adjust the search or filters above, or add a new candidate to this job.
          </p>
        </div>
      ) : (
        <CandidatesTable jobId={jobId} candidates={filteredCandidates} />
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value={ALL}>All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}