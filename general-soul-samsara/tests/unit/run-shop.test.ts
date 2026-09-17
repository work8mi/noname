import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { CARD_KIND_LABELS, SHOP_CARDS, cardKindLabel, cardPrice, pickGrantedSkill, rollShopCards } from "../../src/run/rewards";
import { createRunState, equipSkill } from "../../src/run/state";
import { getSkillMeta } from "../../src/data/skills";

describe("商店卡牌", () => {
	it("默认抽取 5 张、不重复且可复现", () => {
		const rng = createRng("shop");
		const cards = rollShopCards(rng);
		expect(cards).toHaveLength(5);
		expect(new Set(cards).size).toBe(5);
		expect(rollShopCards(createRng("shop"))).toEqual(cards);
	});

	it("卡池覆盖基本牌 / 锦囊 / 特殊锦囊 / 武器 / 防具", () => {
		const kinds = new Set(SHOP_CARDS.map(card => card.kind));
		expect([...kinds].sort()).toEqual(Object.keys(CARD_KIND_LABELS).sort());
		for (const id of ["taoyuan", "wugu", "huogong", "tiesuo", "zhuge", "bagua", "renwang"]) {
			expect(SHOP_CARDS.some(card => card.id === id), id).toBe(true);
		}
	});

	it("价格与类型标签", () => {
		expect(cardPrice("sha")).toBe(50);
		expect(cardPrice("nanman")).toBe(120);
		expect(cardPrice("taoyuan")).toBe(150);
		expect(cardPrice("unknown-card")).toBe(80);
		expect(cardKindLabel("zhuge")).toBe("武器");
		expect(cardKindLabel("bagua")).toBe("防具");
		expect(cardKindLabel("tiesuo")).toBe("特殊锦囊");
		expect(cardKindLabel("unknown-card")).toBe("卡牌");
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
