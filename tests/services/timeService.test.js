const ts = require("../../services/timeService");
// 拿到全局 timeEvents，测试里做 clear & 断言
const { timeEvents, scheduleEvent, pauseEvent, resumeEvent, getFixedTimeData } = ts;
const { timeData } = require("../../data/timeData");

describe("TimeService", () => {
  beforeEach(() => {
    Object.values(timeEvents).forEach(ev => ev.interval && clearInterval(ev.interval));
    Object.keys(timeEvents).forEach(k => delete timeEvents[k]);
  });

  it("scheduleEvent", () => {
    const cb = () => {};
    const ev = scheduleEvent("e1", { durationSec:1, label:"t" }, cb);
    expect(ev.callback).toBe(cb);
    expect(ev.paused).toBe(false);
    expect(ev.timeInfo.remainingSec).toBe(1);
    expect(ev).toBe(timeEvents.e1);
    clearInterval(ev.interval);
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