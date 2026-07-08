import Link from "next/link";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CandidateListItem } from "@/features/candidates/queries";

type CandidatesTableProps = {
  jobId: string;
  candidates: CandidateListItem[];
};

export function CandidatesTable({ jobId, candidates }: CandidatesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Candidate</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Experience</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead className="pr-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => (
          <TableRow key={candidate.id}>
            <TableCell className="pl-4">
              <div className="space-y-1">
                <Link
                  href={`/jobs/${jobId}/candidates/${candidate.id}`}
                  className="font-medium hover:underline"
                >
                  {candidate.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {candidate.email} · {candidate.phone}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{candidate.currentStage.name}</Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {candidate.relevantExperience} / {candidate.totalExperience} yrs
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{candidate.currentCity}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {candidate.assignedUser ? `@${candidate.assignedUser.username}` : "Unassigned"}
              </span>
            </TableCell>
            <TableCell className="pr-4 text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/jobs/${jobId}/candidates/${candidate.id}`} />}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Download resume for ${candidate.name}`}
                  nativeButton={false}
                  render={<Link href={`/jobs/${jobId}/candidates/${candidate.id}/resume`} />}
                >
                  <Download className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
