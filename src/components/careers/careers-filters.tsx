import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CareersFilters } from "@/features/careers/rules";
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  WORK_MODE_LABELS,
  WORK_MODES,
} from "@/features/jobs/posting";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function CareersFiltersForm({
  filters,
  locations,
  departments,
  showClear,
}: {
  filters: CareersFilters;
  locations: string[];
  departments: string[];
  showClear: boolean;
}) {
  return (
    <form method="get" action="/careers" className="space-y-3 rounded-xl border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="careers-q">Search</Label>
        <Input
          id="careers-q"
          name="q"
          type="search"
          placeholder="Role, skill or keyword"
          defaultValue={filters.q}
          maxLength={120}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          id="careers-location"
          name="location"
          label="Location"
          value={filters.location}
          options={locations.map((value) => ({ value, label: value }))}
        />
        <FilterSelect
          id="careers-department"
          name="department"
          label="Department"
          value={filters.department}
          options={departments.map((value) => ({ value, label: value }))}
        />
        <FilterSelect
          id="careers-work-mode"
          name="workMode"
          label="Work mode"
          value={filters.workMode}
          options={WORK_MODES.map((value) => ({ value, label: WORK_MODE_LABELS[value] }))}
        />
        <FilterSelect
          id="careers-employment-type"
          name="employmentType"
          label="Employment type"
          value={filters.employmentType}
          options={EMPLOYMENT_TYPES.map((value) => ({
            value,
            label: EMPLOYMENT_TYPE_LABELS[value],
          }))}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">
          <Search className="size-4" aria-hidden="true" />
          Search
        </Button>
        {showClear ? (
          <Button variant="ghost" nativeButton={false} render={<Link href="/careers" />}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function FilterSelect({
  id,
  name,
  label,
  value,
  options,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} name={name} defaultValue={value} className={selectClassName}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
