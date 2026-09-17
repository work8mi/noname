import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { chooseIntent, describeIntent, INTENT_LABELS } from "../../src/battle/intents";
import type { IntentContext, IntentEntry } from "../../src/shared/types";

const baseContext: IntentContext = { hp: 3, maxHp: 3, charge: 0, turn: 1 };

describe("意图规划器", () => {
	it("weight <= 0 的条目不参与", () => {
		const entries: IntentEntry[] = [
			{ type: "attack", weight: 0 },
			{ type: "defend", weight: 1 },
		];
		for (let i = 0; i < 20; i++) {
			expect(chooseIntent(entries, baseContext, createRng(`w${i}`)).type).toBe("defend");
		}
	});

	it("when 条件不满足的条目不参与", () => {
		const entries: IntentEntry[] = [
			{ type: "charge", weight: 10, when: ctx => ctx.hp <= 1 },
			{ type: "attack", weight: 1 },
		];
		for (let i = 0; i < 20; i++) {
			expect(chooseIntent(entries, baseContext, createRng(`c${i}`)).type).toBe("attack");
		}
		expect(chooseIntent(entries, { ...baseContext, hp: 1 }, createRng("low")).type).toBe("charge");
	});

	it("全部条件不满足时回退为攻击", () => {
		expect(chooseIntent([], baseContext, createRng("fallback")).type).toBe("attack");
	});

	it("同一 seed 的选择可复现", () => {
		const entries: IntentEntry[] = [
			{ type: "attack", weight: 50 },
			{ type: "defend", weight: 30 },
			{ type: "discard", weight: 20 },
		];
		const a = Array.from({ length: 30 }, (_, i) => chooseIntent(entries, baseContext, createRng(`s${i}`)).type);
		const b = Array.from({ length: 30 }, (_, i) => chooseIntent(entries, baseContext, createRng(`s${i}`)).type);
		expect(a).toEqual(b);
	});

	it("高权重条目出现得更频繁", () => {
		const entries: IntentEntry[] = [
			{ type: "attack", weight: 9 },
			{ type: "defend", weight: 1 },
		];
		const rng = createRng("distribution");
		let attack = 0;
		for (let i = 0; i < 400; i++) {
			if (chooseIntent(entries, baseContext, rng).type === "attack") attack++;
		}
		expect(attack).toBeGreaterThan(300);
	});

	it("describeIntent 显示标签与蓄力加值", () => {
		expect(describeIntent({ type: "attack" })).toBe(INTENT_LABELS.attack);
		expect(describeIntent({ type: "attack" }, 2)).toContain("+2");
		expect(describeIntent({ type: "defend" })).toBe(INTENT_LABELS.defend);
	});
});
