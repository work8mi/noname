import { game, ui } from "noname";
import type { Rng } from "../../shared/rng";
import { createPile, drawFromPile, type Pile } from "../piles";

/**
 * 个人牌堆的引擎接线。
 *
 * 引擎没有 `card.owner`，所以抽到的牌统一打上 `card.storage.rogueOwner`；
 * 弃牌堆里属于该玩家的牌在洗回时被回收（引擎的全局洗牌与个人牌堆无关）。
 */
export function stampOwner(card: any, player: any): void {
	if (!card.storage) card.storage = {};
	card.storage.rogueOwner = player.playerid;
}

export function getPile(player: any): Pile<any> | undefined {
	return player.storage?.roguePile;
}

/** 把公共弃牌堆里属于该玩家的牌移回其弃牌堆。 */
export function reclaimOwnDiscards(player: any): void {
	const pile = getPile(player);
	if (!pile) return;
	const owner = player.playerid;
	for (const node of Array.from(ui.discardPile.childNodes) as any[]) {
		if (node?.storage?.rogueOwner !== owner) continue;
		node.remove();
		pile.discard.push(node);
	}
}

/**
 * 为玩家安装个人牌堆，并覆写 `getTopCards`。
 *
 * 引擎的 `draw` / `gameDraw` 会优先调用 `player.getTopCards`，因此个人牌堆
 * 天然覆盖摸牌与初始手牌，且永不触发全局疲劳。
 */
export function installPile(player: any, cardIds: readonly string[], rng: Rng): Pile<any> {
	const cards = cardIds.map(name => game.createCard({ name }));
	for (const card of cards) stampOwner(card, player);
	const pile = createPile(cards, rng);
	player.storage ??= {};
	player.storage.roguePile = pile;
	player.getTopCards = (num: number): any[] => {
		const current = getPile(player);
		if (!current) return [];
		if (!current.draw.length) reclaimOwnDiscards(player);
		return drawFromPile(current, num, rng);
	};
	return pile;
}
