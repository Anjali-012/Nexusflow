import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";

const TEST_USER = {
  name: "Test User",
  email: `test-${Date.now()}@nexusflow.io`,
  password: "password123",
  tenantName: "Test Tenant",
};

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/nexusflow-test",
  );
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("POST /auth/register", () => {
  it("registers a new user and returns 201", async () => {
    const res = await request(app).post("/auth/register").send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it("returns 400 on duplicate email", async () => {
    const res = await request(app).post("/auth/register").send(TEST_USER);
    expect(res.status).toBe(400);
  });

  it("returns 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "missing@test.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("logs in with correct credentials and returns token", async () => {
    const res = await request(app).post("/auth/login").send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("returns 401 with wrong password", async () => {
    const res = await request(app).post("/auth/login").send({
      email: TEST_USER.email,
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 with non-existent email", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "nobody@nexusflow.io",
      password: "password123",
    });
    expect(res.status).toBe(401);
  });
});
