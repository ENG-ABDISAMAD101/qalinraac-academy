"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StudentShell } from "@/components/student/StudentShell";
import { demoCourses } from "@/lib/demo-data";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const course =
    demoCourses.find((c) => c.id === params.id) ?? demoCourses[0];

  return (
    <StudentShell>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-6 lg:px-8">
        <div className="relative aspect-[21/9] overflow-hidden rounded-[1.5rem]">
          <Image
            src={course.thumbnail}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="card-soft p-6">
          <h1 className="font-display text-3xl font-bold text-primary">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Instructor · {course.instructor}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${course.progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{course.progress}% complete</p>
          <Link
            href={`/student/learn/${course.id}`}
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Continue Learning
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
