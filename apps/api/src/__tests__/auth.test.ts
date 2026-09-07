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
import { createApp } from "../app.js";
import { connectMongo, disconnectMongo } from "../db/mongoose.js";

describe("auth", () => {
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

  it("registers and returns tokens", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "learner@example.com",
      password: "Password123!",
      fullName: "Test Learner",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe("learner@example.com");
    expect(res.body.data.user.role).toBe("Student");
  });

  it("logs in and returns /me", async () => {
    await request(app).post("/api/v1/auth/register").send({
      email: "login@example.com",
      password: "Password123!",
      fullName: "Login User",
    });

    const login = await request(app).post("/api/v1/auth/login").send({
      email: "login@example.com",
      password: "Password123!",
    });

    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeDefined();

    const me = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${login.body.data.accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("login@example.com");
  });

  it("refreshes and logs out", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send({
      email: "refresh@example.com",
      password: "Password123!",
      fullName: "Refresh User",
    });

    const refresh = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: reg.body.data.refreshToken,
    });

    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toBeDefined();

    const logout = await request(app).post("/api/v1/auth/logout").send({
      refreshToken: refresh.body.data.refreshToken,
    });
    expect(logout.status).toBe(200);

    const reuse = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: refresh.body.data.refreshToken,
    });
    expect(reuse.status).toBe(401);
  });

  it("rejects invalid login", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "nobody@example.com",
      password: "wrong",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
