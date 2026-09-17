import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { availableSkillPool, MAX_SALES_PER_CHAPTER, removeCardPrice, rollBossGold, rollEliteGold, rollGold, rollSkillOffers, salesLeft, sellPrice, skillPrice } from "../../src/run/rewards";
import { createRunState, equipSkill } from "../../src/run/state";
import { getSkillMeta } from "../../src/data/skills";

describe("奖励与经济", () => {
	it("金币区间：普通 20-30、精英 50-70、首领 100-140", () => {
		const rng = createRng("gold");
		for (let i = 0; i < 100; i++) {
			const gold = rollGold(rng);
			expect(gold).toBeGreaterThanOrEqual(20);
			expect(gold).toBeLessThanOrEqual(30);
			const elite = rollEliteGold(rng);
			expect(elite).toBeGreaterThanOrEqual(50);
			expect(elite).toBeLessThanOrEqual(70);
			const boss = rollBossGold(rng);
			expect(boss).toBeGreaterThanOrEqual(100);
			expect(boss).toBeLessThanOrEqual(140);
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

describe("售卖卡牌", () => {
	it("回收价：基本牌 15、其他 30、诅咒与未知 10", () => {
		expect(sellPrice("sha")).toBe(15);
		expect(sellPrice("tao")).toBe(15);
		expect(sellPrice("wuzhong")).toBe(30);
		expect(sellPrice("zhuge")).toBe(30);
		expect(sellPrice("rogue_curse_du")).toBe(10);
	});

	it("每章次数上限与剩余次数", () => {
		const state = createRunState("seed");
		expect(salesLeft(state)).toBe(MAX_SALES_PER_CHAPTER);
		state.salesUsed = MAX_SALES_PER_CHAPTER;
		expect(salesLeft(state)).toBe(0);
		state.salesUsed = MAX_SALES_PER_CHAPTER + 2;
		expect(salesLeft(state)).toBe(0);
	});
});
