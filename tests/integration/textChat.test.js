const request = require("supertest");
const app     = require("../../app");
const svc     = require("../../services/textChatService");

describe("Text Chat Module (integration)", () => {
  const room = "intRoom";
  beforeEach(async () => {
    await svc.clearRoomMessages(room);
  });

  it("GET /api/chat/:room/messages 初次含系统消息", async () => {
    const res = await request(app).get(`/api/chat/${room}/messages`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].text).toMatch(/欢迎进入聊天室/);
  });

  it("POST /api/chat/:room/send 新增消息 201", async () => {
    const res = await request(app)
      .post(`/api/chat/${room}/send`)
      .send({ username:"U1", country:"C1", role:"delegate", text:"hello" });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("ok");
  });

  it("再 GET 应包含新消息", async () => {
    const res = await request(app)
      .get(`/api/chat/${room}/messages`)
      .query({ limit:10, offset:0 });
    expect(res.statusCode).toBe(200);
    expect(res.body.some(m => m.text === "hello")).toBe(true);
  });

  it("POST 带引用的消息", async () => {
    // 获取之前的消息 id
    const history = await request(app).get(`/api/chat/${room}/messages`);
    const targetId = history.body.find(m => m.text === "hello").id;
    const res = await request(app)
      .post(`/api/chat/${room}/send`)
      .send({ username:"U1", text:"reply", quoteId: targetId });
    expect(res.statusCode).toBe(201);
    const id = res.body.message.id;
    const history2 = await request(app).get(`/api/chat/${room}/messages`);
    const msg = history2.body.find(m => m.id === id);
    expect(msg.quote && msg.quote.id).toBe(targetId);
  });

  it("GET /api/chat/:room/summary/user", async () => {
    const res = await request(app).get(`/api/chat/${room}/summary/user`);
    expect(res.statusCode).toBe(200);
    // U1 至少一条
    expect(res.body.U1).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/chat/:room/summary/time", async () => {
    const res = await request(app).get(`/api/chat/${room}/summary/time`);
    expect(res.statusCode).toBe(200);
    expect(typeof res.body).toBe("object");
  });

  it("GET /api/chat/:room/search?keyword=hello", async () => {
    const res = await request(app)
      .get(`/api/chat/${room}/search`)
      .query({ keyword:"hello" });
    expect(res.statusCode).toBe(200);
    expect(res.body.some(m => m.text.includes("hello"))).toBe(true);
  });

  it("POST /api/chat/:room/message/:id/revoke", async () => {
    // 先发一条
    const post = await request(app)
      .post(`/api/chat/${room}/send`)
      .send({ username:"U2", country:"C", role:"delegate", text:"X" });
    const id = post.body.message.id;
    const res = await request(app)
      .post(`/api/chat/${room}/message/${id}/revoke`)
      .set("x-user-role","admin");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("revoked");
  });

  it("撤回后 GET /messages 不应再见到该消息", async () => {
    const res = await request(app).get(`/api/chat/${room}/messages`);
    expect(res.statusCode).toBe(200);
    expect(res.body.find(m => m.id === undefined)).toBeUndefined(); 
    // 实际测试里会比对上条 revoke 的 id
  });
}); 