export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Qalinraac Academy LMS API",
    version: "0.1.0",
    description: "Single-tenant Enterprise LMS API (modular monolith)",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        tags: ["System"],
        security: [],
        responses: { "200": { description: "API is healthy" } },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register student",
        tags: ["Auth"],
        security: [],
        responses: { "201": { description: "Registered" } },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login",
        tags: ["Auth"],
        security: [],
        responses: { "200": { description: "Tokens issued" } },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Refresh tokens",
        tags: ["Auth"],
        security: [],
        responses: { "200": { description: "New tokens" } },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout / revoke refresh",
        tags: ["Auth"],
        security: [],
        responses: { "200": { description: "Logged out" } },
      },
    },
    "/auth/me": {
      get: {
        summary: "Current user",
        tags: ["Auth"],
        responses: { "200": { description: "User profile" } },
      },
    },
    "/users": {
      get: {
        summary: "List users",
        tags: ["Users"],
        responses: { "200": { description: "User list" } },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Get user",
        tags: ["Users"],
        responses: { "200": { description: "User" } },
      },
      patch: {
        summary: "Update user",
        tags: ["Users"],
        responses: { "200": { description: "Updated user" } },
      },
    },
    "/courses": {
      get: {
        summary: "List courses",
        tags: ["Courses"],
        responses: { "200": { description: "Courses" } },
      },
      post: {
        summary: "Create course",
        tags: ["Courses"],
        responses: { "201": { description: "Created" } },
      },
    },
    "/courses/{id}": {
      get: {
        summary: "Get course with modules/lessons",
        tags: ["Courses"],
        responses: { "200": { description: "Course detail" } },
      },
      patch: {
        summary: "Update course",
        tags: ["Courses"],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete course",
        tags: ["Courses"],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/courses/{id}/publish": {
      post: {
        summary: "Publish course",
        tags: ["Courses"],
        responses: { "200": { description: "Published" } },
      },
    },
    "/enrollments": {
      post: {
        summary: "Enroll in course",
        tags: ["Enrollments"],
        responses: { "201": { description: "Enrolled" } },
      },
    },
    "/enrollments/mine": {
      get: {
        summary: "My enrollments",
        tags: ["Enrollments"],
        responses: { "200": { description: "My courses" } },
      },
    },
    "/progress/complete": {
      post: {
        summary: "Mark lesson complete",
        tags: ["Progress"],
        responses: { "200": { description: "Progress updated" } },
      },
    },
    "/files/upload": {
      post: {
        summary: "Upload file",
        tags: ["Files"],
        responses: { "201": { description: "File asset" } },
      },
    },
    "/quizzes": {
      get: {
        summary: "List quizzes",
        tags: ["Quizzes"],
        responses: { "200": { description: "Quizzes" } },
      },
      post: {
        summary: "Create quiz",
        tags: ["Quizzes"],
        responses: { "201": { description: "Created" } },
      },
    },
    "/quizzes/{id}/attempt": {
      post: {
        summary: "Attempt quiz (auto-grade MCQ)",
        tags: ["Quizzes"],
        responses: { "201": { description: "Attempt result" } },
      },
    },
    "/assignments": {
      get: {
        summary: "List assignments",
        tags: ["Assignments"],
        responses: { "200": { description: "Assignments" } },
      },
      post: {
        summary: "Create assignment",
        tags: ["Assignments"],
        responses: { "201": { description: "Created" } },
      },
    },
    "/certificates/request": {
      post: {
        summary: "Request certificate after completion",
        tags: ["Certificates"],
        responses: { "201": { description: "Pending request" } },
      },
    },
    "/certificates/{id}/issue": {
      post: {
        summary: "Upload path/url and issue certificate",
        tags: ["Certificates"],
        responses: { "200": { description: "Issued" } },
      },
    },
    "/research": {
      get: {
        summary: "List research projects",
        tags: ["Research"],
        responses: { "200": { description: "Projects" } },
      },
      post: {
        summary: "Create research project",
        tags: ["Research"],
        responses: { "201": { description: "Created" } },
      },
    },
    "/finance/invoices": {
      get: {
        summary: "List invoices",
        tags: ["Finance"],
        responses: { "200": { description: "Invoices" } },
      },
      post: {
        summary: "Create invoice",
        tags: ["Finance"],
        responses: { "201": { description: "Created" } },
      },
    },
    "/finance/payments": {
      post: {
        summary: "Create payment (Stripe/Waafi stub)",
        tags: ["Finance"],
        responses: { "201": { description: "Payment" } },
      },
    },
    "/notifications": {
      get: {
        summary: "My notifications",
        tags: ["Notifications"],
        responses: { "200": { description: "Notifications" } },
      },
    },
    "/reports/summary": {
      get: {
        summary: "Summary stats JSON",
        tags: ["Reports"],
        responses: { "200": { description: "Stats" } },
      },
    },
    "/admin/settings": {
      get: {
        summary: "Get academy settings",
        tags: ["Admin"],
        responses: { "200": { description: "Settings" } },
      },
      patch: {
        summary: "Update academy settings",
        tags: ["Admin"],
        responses: { "200": { description: "Updated" } },
      },
    },
    "/admin/audit-logs": {
      get: {
        summary: "List audit logs",
        tags: ["Admin"],
        responses: { "200": { description: "Audit logs" } },
      },
    },
  },
};
