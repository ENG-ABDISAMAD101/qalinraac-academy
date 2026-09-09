import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS } from "@qalinraac/shared";
import { logger } from "../lib/logger.js";
import { AcademySettings } from "../models/AcademySettings.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Lesson } from "../models/Lesson.js";
import { Module } from "../models/Module.js";
import { InstructorAgreement } from "../models/InstructorAgreement.js";
import { User } from "../models/User.js";

export async function seedDatabase() {
  const adminEmail = "admin@qalinraac.local";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      email: adminEmail,
      passwordHash: await bcrypt.hash("Admin123!", 10),
      fullName: "Super Admin",
      role: "SuperAdmin",
      permissions: [...ROLE_PERMISSIONS.SuperAdmin],
    });
    logger.info(`Seeded SuperAdmin: ${adminEmail}`);
  }

  const instructorEmail = "instructor@qalinraac.local";
  let instructor = await User.findOne({ email: instructorEmail });
  if (!instructor) {
    instructor = await User.create({
      email: instructorEmail,
      passwordHash: await bcrypt.hash("Instructor123!", 10),
      fullName: "Sample Instructor",
      role: "Instructor",
      permissions: [...ROLE_PERMISSIONS.Instructor],
      courseLimit: 1,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    });
    logger.info(`Seeded Instructor: ${instructorEmail}`);
  } else {
    if (instructor.courseLimit == null) {
      instructor.courseLimit = 1;
      await instructor.save();
    }
  }

  const studentEmail = "student@qalinraac.local";
  let student = await User.findOne({ email: studentEmail });
  if (!student) {
    student = await User.create({
      email: studentEmail,
      passwordHash: await bcrypt.hash("Student123!", 10),
      fullName: "Sample Student",
      role: "Student",
      permissions: [...ROLE_PERMISSIONS.Student],
    });
    logger.info(`Seeded Student: ${studentEmail}`);
  }

  const financeEmail = "finance@qalinraac.local";
  let finance = await User.findOne({ email: financeEmail });
  if (!finance) {
    finance = await User.create({
      email: financeEmail,
      passwordHash: await bcrypt.hash("Finance123!", 10),
      fullName: "Finance Officer",
      role: "Finance",
      permissions: [...ROLE_PERMISSIONS.Finance],
    });
    logger.info(`Seeded Finance: ${financeEmail}`);
  }

  const academicEmail = "academic@qalinraac.local";
  let academic = await User.findOne({ email: academicEmail });
  if (!academic) {
    academic = await User.create({
      email: academicEmail,
      passwordHash: await bcrypt.hash("Academic123!", 10),
      fullName: "Academic Officer",
      role: "Academic",
      permissions: [...ROLE_PERMISSIONS.Academic],
      phone: "+252 61 333 4444",
      bio: "Academic operations lead at Qalinraac Academy.",
    });
    logger.info(`Seeded Academic: ${academicEmail}`);
  } else if (academic.role !== "Academic") {
    academic.role = "Academic";
    academic.permissions = [...ROLE_PERMISSIONS.Academic];
    await academic.save();
  }

  const settings = await AcademySettings.findOne({ key: "default" });
  if (!settings) {
    await AcademySettings.create({
      key: "default",
      academyName: "Qalinraac Academy",
      supportEmail: "support@qalinraac.local",
    });
  }

  const courseSlug = "intro-to-qalinraac-lms";
  let course = await Course.findOne({ slug: courseSlug });
  if (!course) {
    course = await Course.create({
      title: "Intro to Qalinraac LMS",
      slug: courseSlug,
      description:
        "Orientation course for Qalinraac Academy — platform basics, learning flow, and credentials.",
      status: "published",
      instructorIds: [instructor._id],
      priceCents: 0,
      currency: "USD",
      createdBy: admin._id,
      publishedAt: new Date(),
    });

    const mod = await Module.create({
      courseId: course._id,
      title: "Getting Started",
      description: "Welcome and first steps",
      order: 1,
    });

    await Lesson.create([
      {
        courseId: course._id,
        moduleId: mod._id,
        title: "Welcome to Qalinraac Academy",
        content:
          "<p>Welcome. This academy runs as a single-tenant LMS. Complete lessons to unlock certificate requests.</p>",
        order: 1,
        durationMinutes: 10,
      },
      {
        courseId: course._id,
        moduleId: mod._id,
        title: "How learning works",
        content:
          "<p>Enroll, complete lessons, take quizzes, submit assignments, then request your certificate.</p>",
        order: 2,
        durationMinutes: 15,
      },
    ]);

    logger.info(`Seeded course: ${course.title}`);
  }

  const existingEnroll = await Enrollment.findOne({
    userId: student._id,
    courseId: course._id,
  });
  if (!existingEnroll) {
    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "active",
      progressPercent: 0,
      unlockedAt: new Date(),
    });
    logger.info("Seeded student enrollment");
  }

  const agreementCount = await InstructorAgreement.countDocuments();
  if (agreementCount === 0) {
    await InstructorAgreement.create({
      courseId: course._id,
      courseTitle: course.title,
      courseDescription: course.description,
      description:
        "Instructor partnership agreement for delivering and maintaining this course on Qalinraac Academy. Revenue share and content standards apply.",
      fileUrl: "/agreement-sample.pdf",
      fileName: "instructor-agreement.pdf",
      instructorId: instructor._id,
      isActive: true,
      version: "2026.1",
      createdBy: admin._id,
    });
    logger.info("Seeded instructor agreement");
  }

  return { admin, instructor, student, finance, course };
}
