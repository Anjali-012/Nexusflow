import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";

let tokenA: string;
let tokenB: string;
let workflowIdA: string;

const USER_A = {
  name: "Tenant A",
  email: `tenant-a-${Date.now()}@nexusflow.io`,
  password: "password123",
  tenantName: "Tenant A Corp",
};

const USER_B = {
  name: "Tenant B",
  email: `tenant-b-${Date.now()}@nexusflow.io`,
  password: "password123",
  tenantName: "Tenant B Corp",
};

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/nexusflow-test",
  );

  const resA = await request(app).post("/auth/register").send(USER_A);
  tokenA = resA.body.token;

  const resB = await request(app).post("/auth/register").send(USER_B);
  tokenB = resB.body.token;

  const wfRes = await request(app)
    .post("/workflows")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ name: "Tenant A Workflow", trigger: { type: "manual" } });

  workflowIdA = wfRes.body.workflow._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("Tenant Isolation", () => {
  it("Tenant B cannot read Tenant A workflow", async () => {
    const res = await request(app)
      .get(`/workflows/${workflowIdA}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it("Tenant B cannot update Tenant A workflow", async () => {
    const res = await request(app)
      .patch(`/workflows/${workflowIdA}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "Hacked" });

    expect(res.status).toBe(404);
  });

  it("Tenant B cannot delete Tenant A workflow", async () => {
    const res = await request(app)
      .delete(`/workflows/${workflowIdA}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it("Tenant B workflow list does not include Tenant A workflows", async () => {
    const res = await request(app)
      .get("/workflows")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    const ids = res.body.workflows.map((w: any) => w._id);
    expect(ids).not.toContain(workflowIdA);
  });
});
