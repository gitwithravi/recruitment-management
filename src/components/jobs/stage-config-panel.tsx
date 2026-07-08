"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Pencil, Plus, Trash2, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addJobStageAction,
  deleteJobStageAction,
  renameJobStageAction,
  reorderJobStagesAction,
  type StageFormState,
} from "@/features/jobs/actions";
import type { JobDetail } from "@/features/jobs/queries";
import { cn } from "@/lib/utils";

type Stage = JobDetail["stages"][number];

type StageConfigPanelProps = {
  jobId: string;
  stages: Stage[];
  canManageJobs: boolean;
};

const emptyStageState: StageFormState = { errors: {} };

export function StageConfigPanel({
  jobId,
  stages: initialStages,
  canManageJobs,
}: StageConfigPanelProps) {
  const [stages, setStages] = React.useState(initialStages);
  const [reorderError, setReorderError] = React.useState<string | null>(null);
  const [renameStage, setRenameStage] = React.useState<Stage | null>(null);
  const [deleteStage, setDeleteStage] = React.useState<Stage | null>(null);
  const [addState, setAddState] = React.useState<StageFormState>(emptyStageState);
  const [renameState, setRenameState] = React.useState<StageFormState>(emptyStageState);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isAdding, startAddTransition] = React.useTransition();
  const [isRenaming, startRenameTransition] = React.useTransition();
  const [isDeleting, startDeleteTransition] = React.useTransition();
  const [isReordering, startReorderTransition] = React.useTransition();
  const addFormRef = React.useRef<HTMLFormElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddStage = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);

      startAddTransition(async () => {
        const result = await addJobStageAction(jobId, emptyStageState, formData);
        setAddState(result);
        if (!result.generic && Object.keys(result.errors).length === 0) {
          addFormRef.current?.reset();
        }
      });
    },
    [jobId],
  );

  const handleRenameStage = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!renameStage) return;

      const formData = new FormData(event.currentTarget);
      startRenameTransition(async () => {
        const result = await renameJobStageAction(jobId, renameStage.id, emptyStageState, formData);
        setRenameState(result);
        if (!result.generic && Object.keys(result.errors).length === 0) {
          setRenameStage(null);
          setRenameState(emptyStageState);
        }
      });
    },
    [jobId, renameStage],
  );

  const handleDeleteStage = React.useCallback(() => {
    if (!deleteStage) return;

    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteJobStageAction(jobId, deleteStage.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteStage(null);
    });
  }, [deleteStage, jobId]);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = stages.findIndex((stage) => stage.id === active.id);
      const newIndex = stages.findIndex((stage) => stage.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const nextStages = arrayMove(stages, oldIndex, newIndex).map((stage, index) => ({
        ...stage,
        position: index + 1,
      }));
      const previousStages = stages;

      setStages(nextStages);
      setReorderError(null);

      startReorderTransition(async () => {
        const result = await reorderJobStagesAction(
          jobId,
          nextStages.map((stage) => stage.id),
        );
        if (result.error) {
          setStages(previousStages);
          setReorderError(result.error);
        }
      });
    },
    [jobId, stages],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Stages</CardTitle>
              <CardDescription>
                {canManageJobs
                  ? "Rename, add, reorder, and delete empty stages for this job."
                  : "Users can view the job workflow but cannot configure stages."}
              </CardDescription>
            </div>
            <Badge variant="secondary">{stages.length} stages</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {canManageJobs ? (
            <form ref={addFormRef} onSubmit={handleAddStage} className="rounded-lg border p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="stage-name">Add stage</Label>
                  <Input
                    id="stage-name"
                    name="name"
                    placeholder="Technical Interview"
                    maxLength={80}
                    disabled={isAdding}
                    aria-invalid={Boolean(addState.errors.name) || undefined}
                  />
                </div>
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" aria-hidden="true" />
                      Add stage
                    </>
                  )}
                </Button>
              </div>
              {addState.errors.name ? (
                <p className="mt-3 text-xs text-destructive">{addState.errors.name}</p>
              ) : null}
              {addState.generic ? (
                <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {addState.generic}
                </p>
              ) : null}
            </form>
          ) : null}

          {reorderError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {reorderError}
            </p>
          ) : null}

          {stages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Workflow className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium">No stages configured</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Add at least one stage before candidates can be placed on this job board.
              </p>
            </div>
          ) : canManageJobs ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map((stage) => stage.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={cn("space-y-2", isReordering && "opacity-70")}>
                  {stages.map((stage) => (
                    <SortableStageRow
                      key={stage.id}
                      stage={stage}
                      canManageJobs={canManageJobs}
                      onRename={() => {
                        setRenameState(emptyStageState);
                        setRenameStage(stage);
                      }}
                      onDelete={() => {
                        setDeleteError(null);
                        setDeleteStage(stage);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-2">
              {stages.map((stage) => (
                <StageRow
                  key={stage.id}
                  stage={stage}
                  canManageJobs={false}
                  dragAttributes={undefined}
                  dragListeners={undefined}
                  setActivatorNodeRef={undefined}
                  onRename={undefined}
                  onDelete={undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(renameStage)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameStage(null);
            setRenameState(emptyStageState);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename stage</DialogTitle>
            <DialogDescription>
              Update this stage name for the current job workflow.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenameStage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-stage-name">Stage name</Label>
              <Input
                id="rename-stage-name"
                name="name"
                defaultValue={renameStage?.name ?? ""}
                maxLength={80}
                required
                disabled={isRenaming}
                aria-invalid={Boolean(renameState.errors.name) || undefined}
              />
              {renameState.errors.name ? (
                <p className="text-xs text-destructive">{renameState.errors.name}</p>
              ) : null}
            </div>

            {renameState.generic ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {renameState.generic}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
              <Button type="submit" disabled={isRenaming}>
                {isRenaming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteStage)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteStage(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete stage</DialogTitle>
            <DialogDescription>
              Delete &quot;{deleteStage?.name}&quot; from this job. Only empty stages can be
              deleted.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDeleteStage}>
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                "Delete stage"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SortableStageRow({
  stage,
  canManageJobs,
  onRename,
  onDelete,
}: {
  stage: Stage;
  canManageJobs: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "relative z-10 opacity-70")}
    >
      <StageRow
        stage={stage}
        canManageJobs={canManageJobs}
        dragAttributes={attributes}
        dragListeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
        onRename={onRename}
        onDelete={onDelete}
      />
    </div>
  );
}

function StageRow({
  stage,
  canManageJobs,
  dragAttributes,
  dragListeners,
  setActivatorNodeRef,
  onRename,
  onDelete,
}: {
  stage: Stage;
  canManageJobs: boolean;
  dragAttributes: ReturnType<typeof useSortable>["attributes"] | undefined;
  dragListeners: ReturnType<typeof useSortable>["listeners"] | undefined;
  setActivatorNodeRef: ReturnType<typeof useSortable>["setActivatorNodeRef"] | undefined;
  onRename: (() => void) | undefined;
  onDelete: (() => void) | undefined;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {canManageJobs ? (
          <Button
            ref={setActivatorNodeRef}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Drag ${stage.name}`}
            className="cursor-grab active:cursor-grabbing"
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {stage.position}. {stage.name}
          </p>
          <p className="text-xs text-muted-foreground">{stage.candidateCount} candidates</p>
        </div>
      </div>

      {canManageJobs ? (
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onRename}>
            <Pencil className="size-4" aria-hidden="true" />
            Rename
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={stage.candidateCount > 0}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  );
}
