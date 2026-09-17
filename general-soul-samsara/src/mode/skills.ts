/**
 * 词缀的引擎技能实现。
 *
 * 这些对象由模式配置的 `skill` 字段注入 `lib.skill`，在敌人 `init` 之前
 * 就必须可用（loadMode 早于 start）。
 */

/** 铁甲：受到伤害 -1。 */
export const rogue_tiejia = {
	trigger: { player: "damageBegin4" },
	forced: true,
	popup: false,
	filter(event: any) {
		return event.num > 0;
	},
	async content(event: any, trigger: any) {
		trigger.num = Math.max(trigger.num - 1, 0);
	},
};

/** 狂暴：体力不高于 2 时造成的伤害 +1。 */
export const rogue_kuangbao = {
	trigger: { source: "damageBegin3" },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		return event.num > 0 && player.hp <= 2;
	},
	async content(event: any, trigger: any) {
		trigger.num += 1;
	},
};
