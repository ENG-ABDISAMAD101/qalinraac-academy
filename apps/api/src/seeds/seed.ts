import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS } from "@qalinraac/shared";
import { logger } from "../lib/logger.js";
import { AcademySettings } from "../models/AcademySettings.js";
import { Course } from "../models/Course.js";
import { CourseResource } from "../models/CourseResource.js";
import { Enrollment } from "../models/Enrollment.js";
import { InstructorAgreement } from "../models/InstructorAgreement.js";
import { Lesson } from "../models/Lesson.js";
import { Module } from "../models/Module.js";
import { Progress } from "../models/Progress.js";
import { Shareholder } from "../models/Shareholder.js";
import { User } from "../models/User.js";

const SAMPLE_INSTRUCTOR_EMAIL = "instructor@qalinraac.local";
const SAMPLE_STUDENT_EMAIL = "student@qalinraac.local";
const SAMPLE_COURSE_SLUG = "intro-to-qalinraac-lms";

/** Remove legacy demo student / instructor / course data. */
async function removeSampleData() {
  const sampleUsers = await User.find({
    $or: [
      { email: { $in: [SAMPLE_STUDENT_EMAIL, SAMPLE_INSTRUCTOR_EMAIL] } },
      { fullName: { $in: ["Sample Student", "Sample Instructor"] } },
    ],
  })
    .select("_id email fullName")
    .lean();
  const sampleIds = sampleUsers.map((u) => u._id);

  const sampleCourses = await Course.find({
    $or: [
      { slug: SAMPLE_COURSE_SLUG },
      { title: /Intro to Qalinraac LMS/i },
    ],
  })
    .select("_id title slug")
    .lean();
  const courseIds = sampleCourses.map((c) => c._id);

  if (sampleIds.length) {
    await Enrollment.deleteMany({ userId: { $in: sampleIds } });
    await Progress.deleteMany({ userId: { $in: sampleIds } });
    await InstructorAgreement.deleteMany({ instructorId: { $in: sampleIds } });
  }

  if (courseIds.length) {
    await Enrollment.deleteMany({ courseId: { $in: courseIds } });
    await Progress.deleteMany({ courseId: { $in: courseIds } });
    await Lesson.deleteMany({ courseId: { $in: courseIds } });
    await Module.deleteMany({ courseId: { $in: courseIds } });
    await CourseResource.deleteMany({ courseId: { $in: courseIds } });
    await InstructorAgreement.deleteMany({ courseId: { $in: courseIds } });
    await Course.deleteMany({ _id: { $in: courseIds } });
    logger.info(
      `Removed sample course(s): ${sampleCourses.map((c) => c.title).join(", ")}`,
    );
  }

  if (sampleIds.length) {
    await User.deleteMany({ _id: { $in: sampleIds } });
    logger.info(
      `Removed sample users: ${sampleUsers.map((u) => `${u.fullName} <${u.email}>`).join(", ")}`,
    );
  } else {
    logger.info("No sample student/instructor accounts found");
  }
}

async function ensureUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: keyof typeof ROLE_PERMISSIONS;
  phone?: string;
  bio?: string;
}) {
  let user = await User.findOne({ email: input.email });
  if (!user) {
    user = await User.create({
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 10),
      fullName: input.fullName,
      role: input.role,
      permissions: [...ROLE_PERMISSIONS[input.role]],
      phone: input.phone,
      bio: input.bio,
      ...(input.role === "Instructor"
        ? {
            courseLimit: 1,
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
          }
        : {}),
    });
    logger.info(`Seeded ${input.role}: ${input.email}`);
  } else if (user.role !== input.role) {
    user.role = input.role;
    user.permissions = [...ROLE_PERMISSIONS[input.role]];
    await user.save();
  }
  return user;
}

export async function seedDatabase() {
  await removeSampleData();

  const admin = await ensureUser({
    email: "admin@qalinraac.local",
    password: "Admin123!",
    fullName: "Super Admin",
    role: "SuperAdmin",
  });

  const opsAdmin = await ensureUser({
    email: "ops@qalinraac.local",
    password: "Admin123!",
    fullName: "Operations Admin",
    role: "Admin",
    phone: "+252 61 100 2000",
    bio: "Platform operations and support.",
  });

  const finance = await ensureUser({
    email: "finance@qalinraac.local",
    password: "Finance123!",
    fullName: "Finance Officer",
    role: "Finance",
  });

  const academic = await ensureUser({
    email: "academic@qalinraac.local",
    password: "Academic123!",
    fullName: "Academic Officer",
    role: "Academic",
    phone: "+252 61 333 4444",
    bio: "Academic operations lead at Qalinraac Academy.",
  });

  const settings = await AcademySettings.findOne({ key: "default" });
  if (!settings) {
    await AcademySettings.create({
      key: "default",
      academyName: "Qalinraac Academy",
      supportEmail: "support@qalinraac.local",
    });
  }

  const shareholderCount = await Shareholder.countDocuments();
  if (shareholderCount === 0) {
    await Shareholder.create([
      {
        fullName: "Amina Hassan",
        email: "amina.share@qalinraac.local",
        phone: "+252 61 111 2222",
        sharePercent: 25,
        investmentCents: 5000000,
        status: "active",
        createdBy: admin._id,
      },
      {
        fullName: "Omar Guled",
        email: "omar.share@qalinraac.local",
        phone: "+252 61 333 4444",
        sharePercent: 15,
        investmentCents: 2500000,
        status: "active",
        createdBy: admin._id,
      },
    ]);
    logger.info("Seeded shareholders");
  }

  return { admin, opsAdmin, finance, academic };
}
