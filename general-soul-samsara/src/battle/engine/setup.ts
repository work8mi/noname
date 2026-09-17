import { game, lib, _status } from "noname";
import type { Rng } from "../../shared/rng";
import type { BattlePlan, EnemyDef } from "../../shared/types";
import { getTreasure } from "../../data/treasures";
import { installPile } from "./piles";
import { createIntentBadge, injectStyles } from "./ui";

export interface BattleRuntime {
	enemies: any[];
	seed: string;
	over: boolean;
	result?: "victory" | "defeat";
}

/** 词缀到引擎技能的映射；其余词缀由意图执行器处理。 */
const AFFIX_SKILLS: Record<string, string> = {
	tiejia: "rogue_tiejia",
	kuangbao: "rogue_kuangbao",
};

function registerMobs(mobs: readonly EnemyDef[]): void {
	for (const mob of mobs) {
		if (lib.character[mob.id]) continue;
		game.addCharacter(mob.id, {
			sex: "male",
			group: "qun",
			hp: mob.hp,
			skills: mob.affixes.map(affix => AFFIX_SKILLS[affix]).filter(Boolean),
			translate: mob.name,
		});
	}
}

/**
 * 把敌人配置安装到一个玩家座位上。
 *
 * 召唤物由 `game.addPlayerOL` 创建（已 init），此时传入 `init: false`。
 */
export function setupEnemyPlayer(enemy: any, def: EnemyDef, rng: Rng, options: { init?: boolean; summoned?: boolean } = {}): void {
	if (options.init !== false) enemy.init(def.id);
	if (enemy.maxHp !== def.hp) {
		enemy.maxHp = def.hp;
		enemy.hp = def.hp;
		enemy.update();
	}
	enemy.storage ??= {};
	enemy.storage.rogueAffixes = def.affixes;
	enemy.storage.rogueIntents = def.intents;
	enemy.storage.rogueCharge = 0;
	enemy.storage.roguePhases = def.phases ?? [];
	enemy.storage.roguePhaseIndex = 0;
	enemy.storage.rogueDamageBonus = 0;
	if (options.summoned) enemy.storage.rogueSummon = true;
	for (const affix of def.affixes) {
		const skill = AFFIX_SKILLS[affix];
		if (skill) enemy.addSkill(skill);
	}
	installPile(enemy, def.deck.map(name => ({ name })), rng);
	createIntentBadge(enemy);
}

/**
 * 创建一场战斗：清空上一场、建立座位、绑定武将、注入个人牌堆、发初始手牌。
 *
 * 每场战斗是一次独立的引擎对局片段；整局 run 的状态由元层持有。
 */
export async function setupBattle(plan: BattlePlan, rng: Rng, hp?: number): Promise<BattleRuntime> {
	injectStyles();
	registerMobs(plan.enemies);
	game.clearArena();
	game.prepareArena(1 + plan.enemies.length);
	lib.init.onfree?.();

	const [me, ...enemyPlayers] = game.players;
	me.init(plan.playerCharacter);
	if (typeof hp === "number") {
		me.hp = Math.max(1, Math.min(hp, me.maxHp));
		me.update();
	}
	installPile(me, plan.playerDeck, rng);
	me.addSkill("rogue_rule_draw");
	me.addSkill("rogue_upgrade_rules");
	me.addSkill("rogue_curse_rules");
	for (const skillId of plan.skills) {
		if (skillId) me.addSkill(skillId);
	}
	for (const treasureId of plan.treasures) {
		const treasure = getTreasure(treasureId);
		if (treasure?.skillId) me.addSkill(treasure.skillId);
	}

	const enemies: any[] = [];
	for (let i = 0; i < plan.enemies.length; i++) {
		const enemy = enemyPlayers[i];
		setupEnemyPlayer(enemy, plan.enemies[i], rng);
		enemies.push(enemy);
	}

	await game.gameDraw(me, 4, [me]);
	return { enemies, seed: plan.seed, over: false };
}

export function markGameDrawed(): void {
	_status.gameDrawed = true;
}
