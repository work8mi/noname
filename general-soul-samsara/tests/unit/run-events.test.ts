import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { EVENTS, applyEventEffects, rollEvent } from "../../src/run/events";
import { createRunState } from "../../src/run/state";

describe("事件表", () => {
	it("4 个事件、每个 3 个选项、章节分布正确", () => {
		expect(EVENTS).toHaveLength(4);
		for (const event of EVENTS) {
			expect(event.options, event.id).toHaveLength(3);
			expect(event.chapter, event.id).toBeGreaterThanOrEqual(1);
			expect(event.options.every(option => option.effects.length > 0), event.id).toBe(true);
		}
		expect(EVENTS.filter(event => event.chapter === 1).map(event => event.id)).toEqual(["taoyuan", "qingmei"]);
		expect(EVENTS.filter(event => event.chapter === 2).map(event => event.id)).toEqual(["sangu", "huarong"]);
	});
});

describe("事件效果结算", () => {
	it("即时效果：金币、回复、伤害、加牌", () => {
		const state = createRunState("seed");
		state.hp = 2;
		const pending = applyEventEffects(state, [
			{ kind: "gold", value: 50 },
			{ kind: "heal", value: 1 },
			{ kind: "cards", cards: ["tao", "tao"] },
		]);
		expect(state.gold).toBe(150);
		expect(state.hp).toBe(3);
		expect(state.deck.filter(card => card.id === "tao")).toHaveLength(5);
		expect(pending.removals).toBe(0);
		expect(pending.enemyHpBonus).toBe(0);
	});

	it("待处理效果：删牌、技能、敌人强化", () => {
		const state = createRunState("seed");
		const pending = applyEventEffects(state, [
			{ kind: "remove", value: 1 },
			{ kind: "skill", skillId: "guanxing" },
			{ kind: "enemy-hp", value: 2 },
		]);
		expect(pending.removals).toBe(1);
		expect(pending.skillId).toBe("guanxing");
		expect(pending.enemyHpBonus).toBe(2);
	});

	it("伤害可以终结单局", () => {
		const state = createRunState("seed");
		applyEventEffects(state, [{ kind: "damage", value: 99 }]);
		expect(state.hp).toBe(0);
		expect(state.finished).toBe(true);
	});

	it("技能效果可以只给类型", () => {
		const state = createRunState("seed");
		const pending = applyEventEffects(state, [{ kind: "skill", skillKind: "passive" }]);
		expect(pending.skillKind).toBe("passive");
		expect(pending.skillId).toBeUndefined();
	});
});

describe("事件抽取", () => {
	it("排除已触发的事件且可复现", () => {
		const first = rollEvent(1, [], createRng("event"));
		expect(first).toBeDefined();
		expect(rollEvent(1, [], createRng("event"))?.id).toBe(first?.id);
		const second = rollEvent(1, [first!.id], createRng("event-2"));
		expect(second?.id).not.toBe(first?.id);
	});

	it("事件用尽时返回 undefined", () => {
		const used = EVENTS.map(event => event.id);
		expect(rollEvent(2, used, createRng("none"))).toBeUndefined();
	});

	it("章节 1 只抽到章节 1 的事件", () => {
		for (let i = 0; i < 20; i++) {
			expect(rollEvent(1, [], createRng(`c${i}`))?.chapter).toBe(1);
		}
	});
});
