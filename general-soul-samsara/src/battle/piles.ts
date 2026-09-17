import type { Rng } from "../shared/rng";

/** 通用牌堆：抽牌堆 + 弃牌堆，抽空时把弃牌堆洗回。 */
export interface Pile<T> {
	draw: T[];
	discard: T[];
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
	const result = items.slice();
	for (let i = result.length - 1; i > 0; i--) {
		const j = rng.int(i + 1);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function createPile<T>(items: readonly T[], rng: Rng): Pile<T> {
	return { draw: shuffle(items, rng), discard: [] };
}

/**
 * 从牌堆抽牌；抽牌堆空时先把弃牌堆洗回。
 *
 * 两堆都空时返回已抽到的牌（少于 num），**不触发疲劳**。
 */
export function drawFromPile<T>(pile: Pile<T>, num: number, rng: Rng): T[] {
	const result: T[] = [];
	while (result.length < num) {
		if (!pile.draw.length) {
			if (!pile.discard.length) break;
			pile.draw = shuffle(pile.discard, rng);
			pile.discard = [];
		}
		const card = pile.draw.pop();
		if (card === undefined) break;
		result.push(card);
	}
	return result;
}

export function returnToDiscard<T>(pile: Pile<T>, cards: readonly T[]): void {
	pile.discard.push(...cards);
}

export function pileSize<T>(pile: Pile<T>): number {
	return pile.draw.length + pile.discard.length;
}
