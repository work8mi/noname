import { game } from "noname";
import type { Intent } from "../../shared/types";

function hasAffix(enemy: any, affix: string): boolean {
	return Array.isArray(enemy.storage?.rogueAffixes) && enemy.storage.rogueAffixes.includes(affix);
}

function canAct(enemy: any): boolean {
	return enemy.isAlive() && game.me.isAlive();
}

function attackCard(): any {
	return { name: "sha", isCard: true };
}

/**
 * 执行一个敌人意图。
 *
 * 具体出牌与响应仍由引擎处理；这里只负责把"意图"翻译成动作，
 * 词缀（护盾、吸牌、蓄力）在对应分支里附加效果。
 */
export async function runIntent(enemy: any, intent: Intent): Promise<void> {
	if (!canAct(enemy)) return;
	switch (intent.type) {
		case "attack": {
			const charge = enemy.storage.rogueCharge ?? 0;
			if (charge > 0) {
				enemy.storage.rogueCharge = 0;
				await game.me.damage({ source: enemy, num: 1 + charge });
			} else if (enemy.canUse(attackCard(), game.me)) {
				await enemy.useCard(attackCard(), game.me);
			} else {
				await game.me.damage({ source: enemy, num: 1 });
			}
			if (hasAffix(enemy, "xipai")) {
				await game.me.randomDiscard({ num: 1, discarder: enemy, position: "he" });
			}
			break;
		}
		case "defend": {
			await enemy.draw({ num: 2 });
			if (hasAffix(enemy, "hudun")) await enemy.changeHujia(1);
			break;
		}
		case "charge": {
			enemy.storage.rogueCharge = (enemy.storage.rogueCharge ?? 0) + 1;
			await enemy.draw({ num: 1 });
			break;
		}
		case "discard": {
			await game.me.randomDiscard({ num: 1, discarder: enemy, position: "he" });
			break;
		}
		default: {
			// judge / summon / seal 尚未接入（M0.3），临时按普通攻击处理。
			if (enemy.canUse(attackCard(), game.me)) await enemy.useCard(attackCard(), game.me);
			break;
		}
	}
}
