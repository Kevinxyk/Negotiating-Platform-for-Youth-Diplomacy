const request = require("supertest");
// 从 tests/integration 向上两级到 my-backend，然后加载 app.js
const app     = require("../../app");
// 同理加载 services 下的 scoreService
const svc     = require("../../services/scoreService");

describe("Scoring Module (integration)", () => {
  const room     = "testRoom";
  const judgeId  = "judge1";
  const user     = "user1";
  const sysRole  = "sys";
  const scoreData = {
    judgeId:      judgeId,
    targetUserId: user,
    comments:     "Excellent",
    score:        10
  };

  beforeEach(async () => {
    await svc.clearRoomScores(room);
  });

  it("judge 提分 201", async () => {
    const res = await request(app)
      .post(`/api/score/${room}`)
      .set("x-user-role", judgeId)
      .send(scoreData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      judgeId,
      targetUserId: user,
      comments:     "Excellent"
    });
  });

  it("GET /api/score/:room 聚合", async () => {
    const res = await request(app).get(`/api/score/${room}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const rec = res.body.find(r => r.targetUserId === user);
    expect(rec).toBeDefined();
    expect(parseFloat(rec.avgScore)).toBeCloseTo(10.00);
  });

  it("GET /api/score/:room/history/:user", async () => {
    const res = await request(app).get(`/api/score/${room}/history/${user}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      judgeId,
      targetUserId: user,
      comments:     "Excellent"
    });
  });

  it("GET /api/score/:room/ranking", async () => {
    const res = await request(app).get(`/api/score/${room}/ranking`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].targetUserId).toBe(user);
  });

  it("sys 调用 AI 评分", async () => {
    const res = await request(app)
      .get(`/api/score/${room}/ai`)
      .set("x-user-role", sysRole);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ roomId: room });
    expect(parseFloat(res.body.aiScore)).toBeCloseTo(10.00);
  });
});