const ctrl = require("../../controllers/textChatController");
// mock 真正的 service 模块
jest.mock("../../services/textChatService");
const textChatService = require("../../services/textChatService");

describe("TextChatController", () => {
  let req, res;
  beforeEach(() => {
    req = { params:{room:"R1",messageId:"M1"}, query:{}, body:{}, headers:{}, user:{username:'u',role:'admin'} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe("getChatHistory", () => {
    it("成功返回", async () => {
      const fake = [{ id:"1", text:"ok"}];
      textChatService.getHistory.mockResolvedValue(fake);
      await ctrl.getChatHistory(req, res);
      expect(textChatService.getHistory).toHaveBeenCalledWith("R1",50,0);
      expect(res.json).toHaveBeenCalledWith(fake);
    });

    it("失败走 500", async () => {
      textChatService.getHistory.mockRejectedValue(new Error("fail"));
      await ctrl.getChatHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error:"fail" });
    });
  });

  describe("sendMessage", () => {
    it("成功 201 + {status,message}", async () => {
      const m = { id:"X", text:"hi" };
      textChatService.saveMessage.mockResolvedValue(m);
      req.body = { country:"c", text:"t" };
      await ctrl.sendMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ status:"ok", message:m });
    });
  });

  describe("revokeMessage", () => {
    it("成功 revocation", async () => {
      textChatService.getMessageById.mockResolvedValue({ id:"M1", username:"u" });
      textChatService.revokeMessage.mockResolvedValue(true);
      await ctrl.revokeMessage(req, res);
      expect(textChatService.revokeMessage).toHaveBeenCalledWith("M1");
      expect(res.json).toHaveBeenCalledWith({ status:"revoked" });
    });
  });
}); 