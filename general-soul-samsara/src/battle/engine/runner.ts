import { game, get } from "noname";
import type { Rng } from "../../shared/rng";
import type { Intent } from "../../shared/types";
import type { BattleRuntime } from "./setup";
import { setupEnemyPlayer } from "./setup";

/** 同时存在的召唤物上限（需求规格 §4.10）。 */
const MAX_SUMMONS = 2;

function hasAffix(enemy: any, affix: string): boolean {
	return Array.isArray(enemy.storage?.rogueAffixes) && enemy.storage.rogueAffixes.includes(affix);
}

function canAct(enemy: any): boolean {
	return enemy.isAlive() && game.me.isAlive();
}

function attackCard(): any {
	return { name: "sha", isCard: true };
}

function damageBonus(enemy: any): number {
	return enemy.storage?.rogueDamageBonus ?? 0;
}

/** 召唤一名新敌人并纳入战斗（阶段 2 的召唤意图）。 */
async function summonEnemy(enemy: any, intent: Intent, runtime: BattleRuntime, rng: Rng): Promise<boolean> {
	if (!intent.summon) return false;
	const summonCount = runtime.enemies.filter(item => item.storage?.rogueSummon).length;
	if (summonCount >= MAX_SUMMONS) return false;
	const anchor = runtime.enemies[0] ?? enemy;
	const summoned = await game.addPlayerOL(anchor, intent.summon.id, undefined, false, { animate: false });
	if (!summoned) return false;
	setupEnemyPlayer(summoned, intent.summon, rng, { init: false, summoned: true });
	runtime.enemies.push(summoned);
	enemy.popup(`召唤 ${intent.summon.name}`);
	return true;
}

/**
 * 执行一个敌人意图。
 *
 * 具体出牌与响应仍由引擎处理；这里只负责把"意图"翻译成动作，
 * 词缀（护盾、吸牌、蓄力）与阶段强化在对应分支里附加。
 */
export async function runIntent(enemy: any, intent: Intent, runtime?: BattleRuntime, rng?: Rng): Promise<void> {
	if (!canAct(enemy)) return;
	switch (intent.type) {
		case "attack": {
			const bonus = damageBonus(enemy);
			const charge = enemy.storage.rogueCharge ?? 0;
			if (charge > 0) {
				enemy.storage.rogueCharge = 0;
				await game.me.damage({ source: enemy, num: 1 + charge + bonus });
			} else if (enemy.canUse(attackCard(), game.me)) {
				await enemy.useCard(attackCard(), game.me);
			} else {
				await game.me.damage({ source: enemy, num: 1 + bonus });
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
			enemy.storage.rogueCharge = (enemy.storage.rogueCharge ?? 0) + (intent.value ?? 1);
			await enemy.draw({ num: 1 });
			break;
		}
		case "discard": {
			await game.me.randomDiscard({ num: 1, discarder: enemy, position: "he" });
			break;
		}
		case "summon": {
			if (runtime && rng && (await summonEnemy(enemy, intent, runtime, rng))) break;
			await enemy.draw({ num: 1 });
			break;
		}
		case "judge": {
			const bonus = damageBonus(enemy);
			const { bool } = await enemy
				.judge({
					judge(card: any) {
						return get.suit(card) === "spade" ? 2 : -0.5;
					},
					judge2(result: any) {
						return result.bool;
					},
				})
				.forResult();
			await game.me.damage({ source: enemy, num: (bool ? 2 : 1) + bonus, nature: "thunder" });
			break;
		}
		case "seal": {
			const actives: string[] = game.me.storage?.rogueActiveSkills ?? [];
			const sealed: string | undefined = game.me.storage?.rogueSealedSkill;
			const candidates = actives.filter(id => game.me.hasSkill(id) && id !== sealed);
			if (candidates.length && rng) {
				const skillId = candidates[rng.int(candidates.length)];
				game.me.removeSkill(skillId);
				game.me.storage.rogueSealedSkill = skillId;
				game.me.popup("封印");
			} else {
				await enemy.draw({ num: 1 });
			}
			break;
		}
		default: {
			// 其余意图暂未使用，保底按普通攻击处理。
			if (enemy.canUse(attackCard(), game.me)) await enemy.useCard(attackCard(), game.me);
			break;
		}
	}
}
