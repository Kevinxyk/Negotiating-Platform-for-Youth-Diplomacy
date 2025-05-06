// File: my-backend/test/scoring.test.js
"use strict";

const request = require("supertest");
const app     = require("../server");

describe("Scoring Module", () => {
  const room      = "testRoom";
  const judge     = "judge1";
  const user      = "user1";
  const judgeRole = "judge";
  const sysRole   = "sys";
  const scoreData = {
    judgeId: judge,
    role: judgeRole,
    targetUserId: user,
    dimensionScores: {
      strategy: 10,
      communication: 10,
      innovation: 10,
      teamwork: 10,
      materialUsage: 10
    },
    comments: "Excellent"
  };

  it("should forbid submitting score without role header", async () => {
    const res = await request(app)
      .post(`/api/score/${room}`)
      .send(scoreData);
    expect(res.statusCode).toBe(403);
  });

  it("should allow judge to submit score", async () => {
    const res = await request(app)
      .post(`/api/score/${room}`)
      .set("x-user-role", judgeRole)
      .send(scoreData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      judgeId: judge,
      targetUserId: user,
      comments: "Excellent"
    });
  });

  it("should get aggregated scores", async () => {
    const res = await request(app)
      .get(`/api/score/${room}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const rec = res.body.find(r => r.targetUserId === user);
    expect(rec).toBeDefined();
    expect(parseFloat(rec.avgScore)).toBeCloseTo(10.00);
  });

  it("should get user score history", async () => {
    const res = await request(app)
      .get(`/api/score/${room}/history/${user}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      judgeId: judge,
      targetUserId: user,
      comments: "Excellent"
    });
  });

  it("should get ranking", async () => {
    const res = await request(app)
      .get(`/api/score/${room}/ranking`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].targetUserId).toBe(user);
  });

  it("should require sys role for AI score", async () => {
    const resFail = await request(app)
      .post(`/api/score/${room}/ai`);
    expect(resFail.statusCode).toBe(403);
  });

  it("should allow sys to compute AI score", async () => {
    const res = await request(app)
      .post(`/api/score/${room}/ai`)
      .set("x-user-role", sysRole);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ roomId: room });
    expect(parseFloat(res.body.aiScore)).toBeCloseTo(10.00);
  });
});
