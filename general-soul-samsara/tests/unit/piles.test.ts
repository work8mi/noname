import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { createPile, drawFromPile, pileSize, returnToDiscard, shuffle } from "../../src/battle/piles";

describe("牌堆", () => {
	it("createPile 洗牌且不丢牌", () => {
		const rng = createRng("pile");
		const pile = createPile([1, 2, 3, 4, 5], rng);
		expect(pile.draw).toHaveLength(5);
		expect([...pile.draw].sort()).toEqual([1, 2, 3, 4, 5]);
		expect(pile.discard).toHaveLength(0);
	});

	it("抽牌数量正确", () => {
		const rng = createRng("draw");
		const pile = createPile([1, 2, 3, 4, 5], rng);
		const drawn = drawFromPile(pile, 3, rng);
		expect(drawn).toHaveLength(3);
		expect(pileSize(pile)).toBe(2);
		expect([...drawn, ...pile.draw, ...pile.discard]).toHaveLength(5);
	});

	it("抽牌堆空时把弃牌堆洗回", () => {
		const rng = createRng("wash");
		const pile = createPile([1, 2], rng);
		const first = drawFromPile(pile, 2, rng);
		returnToDiscard(pile, first);
		expect(pile.draw).toHaveLength(0);
		const second = drawFromPile(pile, 2, rng);
		expect(second).toHaveLength(2);
		expect([...second].sort()).toEqual([1, 2]);
	});

	it("两堆皆空时返回已抽到的牌且不报错（不触发疲劳）", () => {
		const rng = createRng("empty");
		const pile = createPile([1], rng);
		expect(drawFromPile(pile, 1, rng)).toEqual([1]);
		expect(drawFromPile(pile, 2, rng)).toEqual([]);
	});

	it("shuffle 是确定性排列且不修改原数组", () => {
		const rng = createRng("shuffle");
		const source = [1, 2, 3, 4, 5, 6];
		const once = shuffle(source, rng);
		const twice = shuffle(source, createRng("shuffle"));
		expect(once).toEqual(twice);
		expect(source).toEqual([1, 2, 3, 4, 5, 6]);
	});
});
