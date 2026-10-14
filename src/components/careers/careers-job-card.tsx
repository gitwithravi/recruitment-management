import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { CareersJobMeta } from "@/components/careers/careers-job-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicJobListItem } from "@/features/careers/queries";

export function CareersJobCard({ job }: { job: PublicJobListItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{job.title}</CardTitle>
        <CareersJobMeta job={job} />
        <CardDescription>{job.excerpt || "No description provided."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button nativeButton={false} render={<Link href={`/careers/${job.id}`} />}>
          <BriefcaseBusiness className="size-4" aria-hidden="true" />
          View and apply
        </Button>
      </CardContent>
    </Card>
  );
}
