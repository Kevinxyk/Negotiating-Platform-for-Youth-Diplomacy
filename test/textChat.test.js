// File: my-backend/test/textChat.test.js
"use strict";

const request = require("supertest");
const app     = require("../server");
let testMsgId;

describe("Text Chat Module", () => {
  const room = "default";

  it("should GET initial history with system message", async () => {
    const res = await request(app)
      .get(`/api/chat/${room}/messages`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].text).toMatch(/欢迎进入聊天室/);
  });

  it("should POST a new message", async () => {
    const res = await request(app)
      .post(`/api/chat/${room}/send`)
      .send({ username: "Tester", country: "Testland", role: "delegate", text: "Hello Test" });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("ok");
  });

  it("should GET include the new message", async () => {
    const res = await request(app)
      .get(`/api/chat/${room}/messages`)
      .query({ limit: 10, offset: 0 });
    const msgs = res.body;
    const msg = msgs.find(m => m.username === "Tester" && m.text === "Hello Test");
    expect(msg).toBeDefined();
    testMsgId = msg.id;
  });

  it("should summarize by user", async () => {
    const res = await request(app)
      .get(`/api/chat/${room}/summary/user`);
    expect(res.statusCode).toBe(200);
    expect(res.body.Tester).toBeGreaterThanOrEqual(1);
  });

  it("should summarize by hour", async () => {
    const res = await request(app)
      .get(`/api/chat/${room}/summary/time`)
      .query({ interval: "hour" });
    expect(res.statusCode).toBe(200);
    expect(typeof res.body).toBe("object");
  });

  it("should search messages by keyword", async () => {
    const res = await request(app)
      .get(`/api/chat/${room}/search`)
      .query({ keyword: "Hello" });
    expect(res.statusCode).toBe(200);
    expect(res.body.some(m => m.text.includes("Hello"))).toBe(true);
  });

  it("should allow admin to revoke a message", async () => {
    const res = await request(app)
      .post(`/api/chat/${room}/message/${testMsgId}/revoke`)
      .set("x-user-role", "admin");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("revoked");
  });

  it("should not include revoked message in history", async () => {
    const res = await request(app)
      .get(`/api/chat/${room}/messages`);
    expect(res.body.find(m => m.id === testMsgId)).toBeUndefined();
  });
});
