import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { cardPrice, pickGrantedSkill, rollShopCards } from "../../src/run/rewards";
import { createRunState, equipSkill } from "../../src/run/state";
import { getSkillMeta } from "../../src/data/skills";

describe("商店卡牌", () => {
	it("随机 3 张不重复且可复现", () => {
		const rng = createRng("shop");
		const cards = rollShopCards(rng);
		expect(cards).toHaveLength(3);
		expect(new Set(cards).size).toBe(3);
		expect(rollShopCards(createRng("shop"))).toEqual(cards);
	});

	it("价格表覆盖常见卡牌并带默认值", () => {
		expect(cardPrice("sha")).toBe(50);
		expect(cardPrice("nanman")).toBe(120);
		expect(cardPrice("unknown-card")).toBe(80);
	});
});

describe("事件奖励技能", () => {
	it("优先指定技能", () => {
		const state = createRunState("seed");
		expect(pickGrantedSkill(state, createRng("grant"), "guanxing")?.id).toBe("guanxing");
	});

	it("已拥有指定技能时按类型回退", () => {
		const state = createRunState("seed");
		equipSkill(state, getSkillMeta("guanxing")!);
		const granted = pickGrantedSkill(state, createRng("grant"), "guanxing", "active");
		expect(granted).toBeDefined();
		expect(granted?.id).not.toBe("guanxing");
	});

	it("按类型随机时只返回该类型", () => {
		const state = createRunState("seed");
		for (let i = 0; i < 10; i++) {
			expect(pickGrantedSkill(state, createRng(`kind-${i}`), undefined, "passive")?.kind).toBe("passive");
		}
	});
});
