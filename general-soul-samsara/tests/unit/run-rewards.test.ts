import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { availableSkillPool, removeCardPrice, rollEliteGold, rollGold, rollSkillOffers, skillPrice } from "../../src/run/rewards";
import { createRunState, equipSkill } from "../../src/run/state";
import { getSkillMeta } from "../../src/data/skills";

describe("奖励与经济", () => {
	it("普通战金币 15-25，精英战 40-60", () => {
		const rng = createRng("gold");
		for (let i = 0; i < 100; i++) {
			const gold = rollGold(rng);
			expect(gold).toBeGreaterThanOrEqual(15);
			expect(gold).toBeLessThanOrEqual(25);
			const elite = rollEliteGold(rng);
			expect(elite).toBeGreaterThanOrEqual(40);
			expect(elite).toBeLessThanOrEqual(60);
		}
	});

	it("三选一不重复且不包含已持有技能", () => {
		const state = createRunState("seed");
		equipSkill(state, getSkillMeta("wusheng")!);
		const rng = createRng("offers");
		for (let i = 0; i < 50; i++) {
			const offers = rollSkillOffers(state, rng);
			expect(offers).toHaveLength(3);
			expect(new Set(offers.map(skill => skill.id)).size).toBe(3);
			expect(offers.some(skill => skill.id === "wusheng")).toBe(false);
		}
	});

	it("无标签时也能抽满三选一", () => {
		const state = createRunState("seed");
		expect(rollSkillOffers(state, createRng("fresh"))).toHaveLength(3);
	});

	it("可用技能池排除黑名单与已持有", () => {
		const state = createRunState("seed");
		const pool = availableSkillPool(state);
		expect(pool.length).toBe(12);
		expect(pool.some(skill => skill.id === "lijian")).toBe(false);
	});

	it("价格区间与删牌递增", () => {
		const rng = createRng("price");
		const active = getSkillMeta("wusheng")!;
		const passive = getSkillMeta("paoxiao")!;
		expect(skillPrice(active, rng)).toBeGreaterThanOrEqual(100);
		expect(skillPrice(active, rng)).toBeLessThanOrEqual(150);
		expect(skillPrice(passive, rng)).toBeGreaterThanOrEqual(120);
		expect(skillPrice(passive, rng)).toBeLessThanOrEqual(180);
		const state = createRunState("seed");
		expect(removeCardPrice(state)).toBe(75);
		state.battleCount = 2;
		expect(removeCardPrice(state)).toBe(125);
	});
});
