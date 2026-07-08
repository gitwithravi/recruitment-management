"use client";

import * as React from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  GripVertical,
  Loader2,
  MoreHorizontal,
  Search,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { moveCandidateAction } from "@/features/candidates/actions";
import type { BoardCandidate, BoardFilters, BoardStage } from "@/features/candidates/queries";
import { cn } from "@/lib/utils";

type CandidateBoardProps = {
  jobId: string;
  stages: BoardStage[];
  candidates: BoardCandidate[];
  filters: BoardFilters;
};

type FilterState = {
  search: string;
  stageId: string;
  assignedUserId: string;
  source: string;
  city: string;
  minExperience: string;
  maxExperience: string;
  noticePeriod: string;
};

type PendingMove = {
  candidate: BoardCandidate;
  fromStage: BoardStage;
  toStage: BoardStage | null;
};

const ALL = "__all__";

const initialFilters: FilterState = {
  search: "",
  stageId: ALL,
  assignedUserId: ALL,
  source: ALL,
  city: ALL,
  minExperience: "",
  maxExperience: "",
  noticePeriod: ALL,
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function includesText(value: string, search: string) {
  return value.toLowerCase().includes(search.toLowerCase());
}

export function CandidateBoard({ jobId, stages, candidates, filters }: CandidateBoardProps) {
  const [boardCandidates, setBoardCandidates] = React.useState(candidates);
  const [filterState, setFilterState] = React.useState<FilterState>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [activeCandidateId, setActiveCandidateId] = React.useState<string | null>(null);
  const [pendingMove, setPendingMove] = React.useState<PendingMove | null>(null);
  const [moveComment, setMoveComment] = React.useState("");
  const [selectedStageId, setSelectedStageId] = React.useState("");
  const [moveError, setMoveError] = React.useState<string | null>(null);
  const [isMoving, startMoveTransition] = React.useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

    return boardCandidates.filter((candidate) => {
      if (filterState.stageId !== ALL && candidate.currentStageId !== filterState.stageId) {
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
      if (filterState.city !== ALL && candidate.currentCity !== filterState.city) {
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
  }, [boardCandidates, debouncedSearch, filterState]);

  const candidatesByStage = React.useMemo(() => {
    const map = new Map<string, BoardCandidate[]>();
    for (const stage of stages) {
      map.set(stage.id, []);
    }
    for (const candidate of filteredCandidates) {
      map.get(candidate.currentStageId)?.push(candidate);
    }
    return map;
  }, [filteredCandidates, stages]);

  const activeCandidate = activeCandidateId
    ? boardCandidates.find((candidate) => candidate.id === activeCandidateId)
    : null;
  const isDebouncing = filterState.search !== debouncedSearch;
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? null;

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilterState((current) => ({ ...current, [key]: value }));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCandidateId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const candidateId = String(event.active.id);
    const toStageId =
      typeof event.over?.id === "string" ? event.over.id.replace("stage:", "") : null;
    const candidate = boardCandidates.find((item) => item.id === candidateId);
    const toStage = stages.find((stage) => stage.id === toStageId);
    const fromStage = candidate
      ? stages.find((stage) => stage.id === candidate.currentStageId)
      : undefined;

    setActiveCandidateId(null);

    if (!candidate || !toStage || !fromStage || fromStage.id === toStage.id) {
      return;
    }

    openMoveDialog({ candidate, fromStage, toStage });
  }

  function openMoveDialog(input: PendingMove) {
    setPendingMove(input);
    setSelectedStageId(input.toStage?.id ?? "");
    setMoveComment("");
    setMoveError(null);
  }

  function closeMoveDialog() {
    if (isMoving) return;
    setPendingMove(null);
    setSelectedStageId("");
    setMoveComment("");
    setMoveError(null);
  }

  function confirmMove() {
    if (!pendingMove || !selectedStage) {
      setMoveError("Select a target stage.");
      return;
    }

    const previousCandidates = boardCandidates;
    const movedCandidate = pendingMove.candidate;
    setMoveError(null);
    setBoardCandidates((current) =>
      current.map((candidate) =>
        candidate.id === movedCandidate.id
          ? { ...candidate, currentStageId: selectedStage.id, updatedAt: new Date() }
          : candidate,
      ),
    );

    startMoveTransition(async () => {
      const result = await moveCandidateAction(
        jobId,
        movedCandidate.id,
        selectedStage.id,
        moveComment,
      );

      if (result.error) {
        setBoardCandidates(previousCandidates);
        setMoveError(result.error);
        return;
      }

      closeMoveDialog();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="board-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="board-search"
                value={filterState.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Name, email, or phone"
                className="pl-8"
              />
            </div>
          </div>
          <FilterSelect
            id="board-stage"
            label="Stage"
            value={filterState.stageId}
            onChange={(value) => updateFilter("stageId", value)}
            options={stages.map((stage) => ({ label: stage.name, value: stage.id }))}
          />
          <FilterSelect
            id="board-assignee"
            label="Assignee"
            value={filterState.assignedUserId}
            onChange={(value) => updateFilter("assignedUserId", value)}
            options={filters.assignedUsers.map((user) => ({
              label: `@${user.username}`,
              value: user.id,
            }))}
          />
          <FilterSelect
            id="board-source"
            label="Source"
            value={filterState.source}
            onChange={(value) => updateFilter("source", value)}
            options={filters.sources.map((source) => ({ label: source, value: source }))}
          />
          <FilterSelect
            id="board-city"
            label="City"
            value={filterState.city}
            onChange={(value) => updateFilter("city", value)}
            options={filters.cities.map((city) => ({ label: city, value: city }))}
          />
          <FilterSelect
            id="board-notice"
            label="Notice period"
            value={filterState.noticePeriod}
            onChange={(value) => updateFilter("noticePeriod", value)}
            options={filters.noticePeriods.map((noticePeriod) => ({
              label: noticePeriod,
              value: noticePeriod,
            }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="board-min-exp">Min exp</Label>
              <Input
                id="board-min-exp"
                value={filterState.minExperience}
                onChange={(event) => updateFilter("minExperience", event.target.value)}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-max-exp">Max exp</Label>
              <Input
                id="board-max-exp"
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
            {filteredCandidates.length} of {boardCandidates.length} candidates shown
          </p>
          <Button variant="outline" size="sm" onClick={() => setFilterState(initialFilters)}>
            Clear filters
          </Button>
        </div>
      </div>

      {isDebouncing ? <BoardSkeleton /> : null}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-3 overflow-x-auto pb-2 lg:grid-flow-col lg:auto-cols-[18rem]">
          {stages.map((stage) => (
            <BoardColumn
              key={stage.id}
              jobId={jobId}
              stage={stage}
              stages={stages}
              candidates={candidatesByStage.get(stage.id) ?? []}
              onMoveCandidate={(candidate) => {
                const fromStage = stages.find(
                  (stageItem) => stageItem.id === candidate.currentStageId,
                );
                if (!fromStage) return;
                openMoveDialog({ candidate, fromStage, toStage: null });
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCandidate ? (
            <CandidateCard
              jobId={jobId}
              candidate={activeCandidate}
              stages={stages}
              overlay
              onMoveCandidate={() => undefined}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={Boolean(pendingMove)} onOpenChange={(open) => !open && closeMoveDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move candidate</DialogTitle>
            <DialogDescription>
              Confirm the stage change and optionally add a movement comment.
            </DialogDescription>
          </DialogHeader>
          {pendingMove ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{pendingMove.candidate.name}</p>
                <p className="mt-1 text-muted-foreground">
                  {pendingMove.fromStage.name} &rarr; {selectedStage?.name ?? "Select stage"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="move-target-stage">Target stage</Label>
                <select
                  id="move-target-stage"
                  value={selectedStageId}
                  onChange={(event) => setSelectedStageId(event.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  disabled={isMoving}
                >
                  <option value="">Select stage</option>
                  {stages
                    .filter((stage) => stage.id !== pendingMove.fromStage.id)
                    .map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="move-comment">Comment</Label>
                <textarea
                  id="move-comment"
                  value={moveComment}
                  onChange={(event) => setMoveComment(event.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="Optional movement note"
                  disabled={isMoving}
                  className="flex min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                />
              </div>
              {moveError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {moveError}
                </p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button disabled={isMoving || !selectedStageId} onClick={confirmMove}>
              {isMoving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Moving...
                </>
              ) : (
                "Confirm move"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function BoardColumn({
  jobId,
  stage,
  stages,
  candidates,
  onMoveCandidate,
}: {
  jobId: string;
  stage: BoardStage;
  stages: BoardStage[];
  candidates: BoardCandidate[];
  onMoveCandidate: (candidate: BoardCandidate) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage.id}` });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex max-h-[72vh] min-h-80 flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "border-foreground bg-muted",
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-medium">{stage.name}</h2>
        <Badge variant="secondary">{candidates.length}</Badge>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {candidates.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background/60 px-3 py-8 text-center text-xs text-muted-foreground">
            No candidates
          </div>
        ) : (
          candidates.map((candidate) => (
            <DraggableCandidateCard
              key={candidate.id}
              jobId={jobId}
              candidate={candidate}
              stages={stages}
              onMoveCandidate={onMoveCandidate}
            />
          ))
        )}
      </div>
    </section>
  );
}

function DraggableCandidateCard({
  jobId,
  candidate,
  stages,
  onMoveCandidate,
}: {
  jobId: string;
  candidate: BoardCandidate;
  stages: BoardStage[];
  onMoveCandidate: (candidate: BoardCandidate) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(isDragging && "opacity-40")}
    >
      <CandidateCard
        jobId={jobId}
        candidate={candidate}
        stages={stages}
        dragAttributes={attributes}
        dragListeners={listeners}
        onMoveCandidate={onMoveCandidate}
      />
    </div>
  );
}

function CandidateCard({
  jobId,
  candidate,
  stages,
  overlay = false,
  dragAttributes,
  dragListeners,
  onMoveCandidate,
}: {
  jobId: string;
  candidate: BoardCandidate;
  stages: BoardStage[];
  overlay?: boolean;
  dragAttributes?: ReturnType<typeof useDraggable>["attributes"];
  dragListeners?: ReturnType<typeof useDraggable>["listeners"];
  onMoveCandidate: (candidate: BoardCandidate) => void;
}) {
  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-3 shadow-xs",
        overlay && "w-72 shadow-lg ring-1 ring-foreground/10",
      )}
    >
      <div className="flex items-start gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Drag ${candidate.name}`}
          className="mt-0.5 cursor-grab active:cursor-grabbing"
          {...dragAttributes}
          {...dragListeners}
        >
          <GripVertical className="size-3.5" aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1">
          <Link
            href={`/jobs/${jobId}/candidates/${candidate.id}`}
            className="line-clamp-1 text-sm font-medium hover:underline"
          >
            {candidate.name}
          </Link>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{candidate.currentCity}</p>
        </div>
        {!overlay ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Actions for ${candidate.name}`}
                >
                  <MoreHorizontal className="size-3.5" aria-hidden="true" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuLabel>Candidate</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onMoveCandidate(candidate)}
                disabled={stages.length <= 1}
              >
                Move...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <CardFact label="Total" value={`${candidate.totalExperience}y`} />
        <CardFact label="Relevant" value={`${candidate.relevantExperience}y`} />
        <CardFact label="Notice" value={candidate.noticePeriod} />
        <CardFact label="Source" value={candidate.source} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {candidate.assignedUser ? (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="text-[0.65rem]">
                {initials(candidate.assignedUser.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">
              @{candidate.assignedUser.username}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <UserRound className="size-3" aria-hidden="true" />
            Unassigned
          </span>
        )}
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3" aria-hidden="true" />
          {formatDate(candidate.updatedAt)}
        </span>
      </div>
    </article>
  );
}

function CardFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.65rem] font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-xs">{value}</p>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      Updating board...
    </div>
  );
}
