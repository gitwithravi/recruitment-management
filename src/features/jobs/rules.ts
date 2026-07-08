export function assertStageDeleteAllowed(candidateCount: number) {
  if (candidateCount > 0) {
    throw new Error("Stage cannot be deleted while candidates exist in it.");
  }
}
