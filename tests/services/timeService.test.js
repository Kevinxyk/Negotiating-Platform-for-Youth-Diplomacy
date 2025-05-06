const ts = require("../../services/timeService");
// 拿到全局 timeEvents，测试里做 clear & 断言
const { timeEvents, scheduleEvent, pauseEvent, resumeEvent, getFixedTimeData } = ts;
const { timeData } = require("../../data/timeData");

describe("TimeService", () => {
  beforeEach(() => {
    Object.keys(timeEvents).forEach(k => delete timeEvents[k]);
  });

  it("scheduleEvent", () => {
    const cb = () => {};
    expect(scheduleEvent("e1", { t:1 }, cb)).toBe(true);
    expect(timeEvents.e1).toEqual({ timeInfo:{ t:1 }, callback:cb, paused:false });
  });

  it("pauseEvent / resumeEvent", () => {
    scheduleEvent("e2", {}, () => {});
    expect(pauseEvent("e2")).toBe(true);
    expect(timeEvents.e2.paused).toBe(true);
    expect(resumeEvent("e2")).toBe(true);
    expect(timeEvents.e2.paused).toBe(false);
  });

  it("getFixedTimeData", () => {
    expect(getFixedTimeData()).toEqual(timeData);
  });
}); 