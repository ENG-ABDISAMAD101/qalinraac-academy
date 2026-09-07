import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { ROLE_PERMISSIONS } from "@qalinraac/shared";
import bcrypt from "bcryptjs";
import { createApp } from "../app.js";
import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Module } from "../models/Module.js";
import { Lesson } from "../models/Lesson.js";
import { Enrollment } from "../models/Enrollment.js";

async function createUser(opts: {
  email: string;
  role: keyof typeof ROLE_PERMISSIONS;
  password?: string;
}) {
  return User.create({
    email: opts.email,
    passwordHash: await bcrypt.hash(opts.password ?? "Password123!", 10),
    fullName: opts.email.split("@")[0],
    role: opts.role,
    permissions: [...ROLE_PERMISSIONS[opts.role]],
  });
}

async function login(app: ReturnType<typeof createApp>, email: string) {
  const res = await request(app).post("/api/v1/auth/login").send({
    email,
    password: "Password123!",
  });
  return res.body.data.accessToken as string;
}

describe("courses enrollments certificates finance", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION ?? "7.0.14";
    mongo = await MongoMemoryServer.create();
    await connectMongo(mongo.getUri());
  }, 600_000);

  afterAll(async () => {
    await disconnectMongo().catch(() => undefined);
    if (mongo) await mongo.stop();
  });

  afterEach(async () => {
    if (mongoose.connection.readyState !== 1) return;
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  });

  it("creates course, enrolls student, completes and requests certificate", async () => {
    const admin = await createUser({
      email: "admin@test.local",
      role: "SuperAdmin",
    });
    const student = await createUser({
      email: "student@test.local",
      role: "Student",
    });
    const adminToken = await login(app, admin.email);
    const studentToken = await login(app, student.email);

    const courseRes = await request(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Course",
        description: "For tests",
        priceCents: 0,
      });
    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.data._id as string;

    await request(app)
      .post(`/api/v1/courses/${courseId}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const modRes = await request(app)
      .post(`/api/v1/courses/${courseId}/modules`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Module 1" });
    expect(modRes.status).toBe(201);
    const moduleId = modRes.body.data._id as string;

    const lessonRes = await request(app)
      .post(`/api/v1/courses/${courseId}/modules/${moduleId}/lessons`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Lesson 1", content: "<p>Hello</p>" });
    expect(lessonRes.status).toBe(201);
    const lessonId = lessonRes.body.data._id as string;

    const enrollRes = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ courseId });
    expect(enrollRes.status).toBe(201);

    await request(app)
      .post("/api/v1/progress/complete")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ courseId, lessonId })
      .expect(200);

    await Enrollment.findOneAndUpdate(
      { userId: student._id, courseId },
      { progressPercent: 100, status: "completed" },
    );

    const certRes = await request(app)
      .post("/api/v1/certificates/request")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ courseId });
    expect(certRes.status).toBe(201);
    expect(certRes.body.data.status).toBe("pending");

    const issueRes = await request(app)
      .post(`/api/v1/certificates/${certRes.body.data._id}/issue`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        filePath: "uploads/cert.pdf",
        fileUrl: "/uploads/cert.pdf",
      });
    expect(issueRes.status).toBe(200);
    expect(issueRes.body.data.status).toBe("issued");
  });

  it("creates invoice and marks paid via manual payment", async () => {
    const finance = await createUser({
      email: "finance@test.local",
      role: "Finance",
    });
    const student = await createUser({
      email: "payer@test.local",
      role: "Student",
    });
    const token = await login(app, finance.email);

    const invoiceRes = await request(app)
      .post("/api/v1/finance/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: String(student._id),
        amountCents: 2500,
        currency: "USD",
        description: "Tuition",
      });
    expect(invoiceRes.status).toBe(201);
    const invoiceId = invoiceRes.body.data._id as string;

    const payRes = await request(app)
      .post("/api/v1/finance/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoiceId, provider: "manual" });
    expect(payRes.status).toBe(201);
    expect(payRes.body.data.payment.status).toBe("succeeded");

    const getInv = await request(app)
      .get(`/api/v1/finance/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getInv.body.data.status).toBe("paid");
  });

  it("returns report summary and excel export", async () => {
    const admin = await createUser({
      email: "reports@test.local",
      role: "SuperAdmin",
    });
    const token = await login(app, admin.email);

    await Course.create({
      title: "R",
      slug: "r-course",
      description: "",
      status: "published",
      instructorIds: [admin._id],
      createdBy: admin._id,
      priceCents: 0,
    });

    const summary = await request(app)
      .get("/api/v1/reports/summary")
      .set("Authorization", `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body.data.users).toBeGreaterThanOrEqual(1);
    expect(summary.body.data.charts).toBeDefined();

    const excel = await request(app)
      .get("/api/v1/reports/export/excel")
      .set("Authorization", `Bearer ${token}`);
    expect(excel.status).toBe(200);
    expect(excel.headers["content-type"]).toContain("spreadsheetml");
  });

  it("lists seeded structural models", async () => {
    const admin = await createUser({ email: "struct@test.local", role: "Admin" });
    const course = await Course.create({
      title: "S",
      slug: "s-course",
      description: "",
      status: "draft",
      instructorIds: [admin._id],
      createdBy: admin._id,
      priceCents: 0,
    });
    const mod = await Module.create({
      courseId: course._id,
      title: "M",
      order: 1,
    });
    await Lesson.create({
      courseId: course._id,
      moduleId: mod._id,
      title: "L",
      content: "<p>x</p>",
      order: 1,
    });
    expect(await Lesson.countDocuments()).toBe(1);
  });
});
