import type { DeckCard } from "../shared/types";

/** 通用 20 张模板（概要设计 §6.1）。 */
export const GENERIC_DECK: readonly DeckCard[] = [
	{ name: "sha", count: 8 },
	{ name: "shan", count: 5 },
	{ name: "tao", count: 3 },
	{ name: "jiu", count: 1 },
	{ name: "wuzhong", count: 1 },
	{ name: "guohe", count: 1 },
	{ name: "shunshou", count: 1 },
];

/** 武将微调后的初始卡组（概要设计 §6.1）。 */
export const CHARACTER_DECKS: Readonly<Record<string, readonly DeckCard[]>> = {
	zhaoyun: [
		{ name: "sha", count: 7 },
		{ name: "shan", count: 7 },
		{ name: "tao", count: 3 },
		{ name: "jiu", count: 1 },
		{ name: "wuzhong", count: 1 },
		{ name: "guohe", count: 1 },
	],
	guanyu: [
		{ name: "sha", count: 9 },
		{ name: "shan", count: 4 },
		{ name: "tao", count: 3 },
		{ name: "jiu", count: 1 },
		{ name: "wuzhong", count: 1 },
		{ name: "guohe", count: 1 },
		{ name: "shunshou", count: 1 },
	],
	zhangfei: [
		{ name: "sha", count: 10 },
		{ name: "shan", count: 4 },
		{ name: "tao", count: 3 },
		{ name: "jiu", count: 1 },
		{ name: "wuzhong", count: 1 },
		{ name: "guohe", count: 1 },
	],
	caocao: [
		{ name: "sha", count: 7 },
		{ name: "shan", count: 5 },
		{ name: "tao", count: 3 },
		{ name: "jiu", count: 1 },
		{ name: "wuzhong", count: 2 },
		{ name: "guohe", count: 1 },
		{ name: "shunshou", count: 1 },
	],
	zhugeliang: [
		{ name: "sha", count: 6 },
		{ name: "shan", count: 6 },
		{ name: "tao", count: 3 },
		{ name: "jiu", count: 1 },
		{ name: "wuzhong", count: 2 },
		{ name: "guohe", count: 1 },
		{ name: "shunshou", count: 1 },
	],
};

/** 把 {牌名, 数量} 展开为卡牌 id 列表；数量非法时抛错。 */
export function expandDeck(cards: readonly DeckCard[]): string[] {
	const result: string[] = [];
	for (const { name, count } of cards) {
		if (!Number.isInteger(count) || count < 0) throw new Error(`非法的卡牌数量：${name} x${count}`);
		for (let i = 0; i < count; i++) result.push(name);
	}
	return result;
}

export function deckSize(cards: readonly DeckCard[]): number {
	return cards.reduce((sum, card) => sum + card.count, 0);
}

export function getCharacterDeck(characterId: string): string[] {
	const template = CHARACTER_DECKS[characterId] ?? GENERIC_DECK;
	return expandDeck(template);
}
