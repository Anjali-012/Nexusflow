import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";

let token: string;
let workflowId: string;

const TEST_USER = {
  name: "Workflow Tester",
  email: `wf-${Date.now()}@nexusflow.io`,
  password: "password123",
  tenantName: "Workflow Tenant",
};

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/nexusflow-test",
  );
  const res = await request(app).post("/auth/register").send(TEST_USER);
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("POST /workflows", () => {
  it("creates a workflow and returns 201", async () => {
    const res = await request(app)
      .post("/workflows")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Workflow",
        description: "Integration test",
        trigger: { type: "manual" },
      });

    expect(res.status).toBe(201);
    expect(res.body.workflow).toHaveProperty("_id");
    expect(res.body.workflow.name).toBe("Test Workflow");
    workflowId = res.body.workflow._id;
  });

  it("returns 401 without token", async () => {
    const res = await request(app).post("/workflows").send({ name: "No Auth" });
    expect(res.status).toBe(401);
  });
});

describe("GET /workflows", () => {
  it("lists workflows for the authenticated tenant", async () => {
    const res = await request(app)
      .get("/workflows")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.workflows)).toBe(true);
    expect(res.body.workflows.length).toBeGreaterThan(0);
  });
});

describe("GET /workflows/:id", () => {
  it("returns a single workflow", async () => {
    const res = await request(app)
      .get(`/workflows/${workflowId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.workflow._id).toBe(workflowId);
  });

  it("returns 404 for non-existent workflow", async () => {
    const res = await request(app)
      .get(`/workflows/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /workflows/:id", () => {
  it("updates workflow name", async () => {
    const res = await request(app)
      .patch(`/workflows/${workflowId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Workflow" });

    expect(res.status).toBe(200);
    expect(res.body.workflow.name).toBe("Updated Workflow");
  });
});

describe("DELETE /workflows/:id", () => {
  it("deletes a workflow", async () => {
    const res = await request(app)
      .delete(`/workflows/${workflowId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
