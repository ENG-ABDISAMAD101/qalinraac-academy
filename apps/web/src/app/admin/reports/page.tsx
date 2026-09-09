"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { demoAdminReports } from "@/lib/admin-demo-data";

export default function AdminReportsPage() {
  const { students, instructors, courses, support } = demoAdminReports;

  return (
    <AdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Operational Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Students, instructors, courses, and support — no financial reports
          </p>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-bold">Student report</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total students", students.total],
              ["New registrations", students.newRegistrations],
              ["Active students", students.active],
              ["Completed courses", students.completedCourses],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Instructor report</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Total instructors", instructors.total],
              ["Active instructors", instructors.active],
              ["Published courses", instructors.publishedCourses],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Course report</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total courses", courses.total],
              ["Active courses", courses.active],
              ["Pending courses", courses.pending],
              ["Archived courses", courses.archived],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Support report</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total tickets", support.total],
              ["Open tickets", support.open],
              ["Closed tickets", support.closed],
              ["Avg response (hrs)", support.avgResponseHours],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
