# In-app notifications — exact messages

Notifications are stored in MongoDB (`Notification`) and shown in each portal’s header bell and Notifications page. They are **not** push notifications.

Shape:

| Field   | Description                          |
|---------|--------------------------------------|
| `title` | Bold headline in the UI              |
| `body`  | Supporting sentence under the title  |
| `type`  | Category string (filter / styling)   |
| `meta`  | Optional IDs for deep links          |

Below, `{…}` means a dynamic value from the database.

---

## Student

Where the student sees them: header bell · `/student/notifications` · dashboard recent list (if wired).

### Enrollment & access

| When | Type | Title | Body (exact) |
|------|------|-------|----------------|
| Enrolls (paid course, payment still needed) | `enrollment` | Enrollment confirmed | `Enrolled in {course.title}. Payment required to unlock.` |
| Enrolls (free / already unlocked) | `enrollment` | Enrollment confirmed | `You are enrolled in {course.title}.` |
| Checkout / payment unlocks course | `enrollment` | Course unlocked | `“{course.title}” is now active in your courses.` |
| Invoice marked paid | `finance` | Payment received | `Your invoice is paid and enrollment is unlocked.` |
| Super Admin approves activation | `enrollment` | Course activated | `Your course has been activated. You can start learning.` |

### Certificates

| When | Type | Title | Body (exact) |
|------|------|-------|----------------|
| Student submits request | `certificate` | Certificate requested | `Your certificate request is pending admin review.` |
| Academic / admin approves | `certificate` | Certificate approved | `Your certificate was approved and is being processed.` |
| Marked ready | `certificate` | Certificate ready | `Your course certificate is ready to download.` |
| File issued | `certificate` | Certificate issued | `Your course certificate is ready to download.` |
| Rejected | `certificate` | Certificate rejected | `{reason}` (admin/academic text as entered) |

### Technical support

| When | Type | Title | Body (exact) |
|------|------|-------|----------------|
| Staff replies on ticket | `support` | Support reply | `New reply on “{ticket.subject}”.` |
| Ticket marked resolved | `support` | Ticket resolved | `Your support ticket “{ticket.subject}” has been marked resolved.` |

### Not implemented for students yet

No `createNotification` for: assignment feedback, quiz results, course announcements, or generic “course” updates to the student.

---

## Instructor

| When | Type | Title | Body (exact) |
|------|------|-------|----------------|
| Academic replies on course discussion | `course` | Academic replied on your course | `{reply text}` (first 140 chars) |
| Course status → published | `course` | Course published | `“{course.title}” is now published.` **or** `“{course.title}” was approved and is now published.` |
| Course status → draft | `course` | Course set to draft | `“{course.title}” was moved to draft by Academic.` |
| Changes requested | `course` | Course changes requested | `{reason}` **or** `Academic requested changes on “{course.title}”. The course is back in draft.` |
| Course rejected | `course` | Course rejected | `{reason}` |
| Agreement created | `system` | Instructor agreement updated | `A new agreement “{title}” is available to view and download.` |
| Agreement updated | `system` | Instructor agreement updated | `Agreement “{courseTitle}” was updated.` |
| Withdrawal paid | `payment` | Withdrawal completed | `Your withdrawal of ${amount} has been paid.` |
| Withdrawal rejected | `payment` | Withdrawal rejected | `Your withdrawal was rejected: {reason}` |

---

## Super Admin / Academic (ops)

| When | Type | Title | Body (exact) | Recipient |
|------|------|-------|----------------|-----------|
| Academic requests student activation | `enrollment` | Student activation request | `{student.fullName} → {course.title} needs Super Admin approval.` | Super Admin(s) |
| Activation rejected | `enrollment` | Activation rejected | `{reason}` | Academic who requested |

---

## Research

| When | Type | Title | Body (exact) |
|------|------|-------|----------------|
| Project review status changes | `research` | Research review update | `Your project status is now {status}.` |

---

## Example — how it looks in the UI

**Title:** Course unlocked  
**Body:** “Html and Css” is now active in your courses.

**Title:** Support reply  
**Body:** New reply on “Login page error”.

**Title:** Certificate rejected  
**Body:** Name on certificate does not match profile. (whatever staff typed)

---

## Source files

- `apps/api/src/modules/notifications/notifications.service.ts` — `createNotification`
- `apps/api/src/modules/enrollments/enrollments.service.ts`
- `apps/api/src/modules/finance/finance.service.ts`
- `apps/api/src/modules/certificates/certificates.service.ts`
- `apps/api/src/modules/academic/academic.service.ts`
- `apps/api/src/modules/admin/admin-portal.service.ts`
- `apps/api/src/modules/finance/finance-portal.service.ts`
- `apps/api/src/modules/research/research.service.ts`
