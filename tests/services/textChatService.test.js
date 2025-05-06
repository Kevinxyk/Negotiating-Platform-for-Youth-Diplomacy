const TextChatService = require("../../services/textChatService");
// 这里拿到真实的 messages 数组，才能 beforeEach 清空
const { messages }   = require("../../services/textChatService");
const { messages: initialMsgs } = require("../../data/messages");

describe("TextChatService", () => {
  beforeEach(() => {
    messages.length = 0;
  });

  it("getHistory 初次返回系统消息", async () => {
    const msgs = await TextChatService.getHistory("roomA", 50, 0);
    expect(Array.isArray(msgs)).toBe(true);
    expect(msgs[0].text).toMatch(/欢迎进入聊天室/);
  });

  it("saveMessage & getHistory & revokeMessage", async () => {
    const payload = { username:"u", country:"c", role:"r", text:"hello" };
    const m = await TextChatService.saveMessage("roomA", payload);
    let h = await TextChatService.getHistory("roomA", 10, 0);
    expect(h.some(x => x.id === m.id)).toBe(true);

    const ok = await TextChatService.revokeMessage(m.id);
    expect(ok).toBe(true);
    h = await TextChatService.getHistory("roomA", 10, 0);
    expect(h.find(x => x.id === m.id).revoked).toBe(true);
  });
}); 