/**
 * 逐级技能数值（需求规格 §5.3）。
 *
 * 只覆盖能用引擎事件钩子干净实现的技能效果；其余技能的 Lv2/Lv3
 * 仍作为进化门槛使用，数值效果待后续接入（见等级说明表）。
 */
export const LEVEL_SKILLS: Record<string, { 2?: any; 3?: any }> = {
	paoxiao: {
		/** Lv2：使用【杀】造成伤害后摸 1。 */
		2: {
			trigger: { source: "damageEnd" },
			forced: true,
			popup: false,
			filter(event: any) {
				return event.card?.name === "sha" && event.num > 0;
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
		/** Lv3：每回合第一张【杀】伤害 +1。 */
		3: {
			trigger: { player: "phaseBegin", source: "damageBegin3" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				if (event.name === "phase") return true;
				return event.card?.name === "sha" && event.num > 0 && !player.storage.rogue_lv_paoxiao_used;
			},
			async content(event: any, trigger: any, player: any) {
				if (trigger.name === "phase") {
					player.storage.rogue_lv_paoxiao_used = false;
					return;
				}
				player.storage.rogue_lv_paoxiao_used = true;
				trigger.num += 1;
			},
		},
	},
	jianxiong: {
		/** Lv2：受到伤害后额外摸 1。 */
		2: {
			trigger: { player: "damageEnd" },
			forced: true,
			popup: false,
			filter(event: any) {
				return event.num > 0;
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
		/** Lv3：受到伤害后回复 1。 */
		3: {
			trigger: { player: "damageEnd" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return event.num > 0 && player.isAlive();
			},
			async content(event: any, trigger: any, player: any) {
				await player.recover();
			},
		},
	},
	kongcheng: {
		/** Lv2：无手牌时受到的伤害 -1。 */
		2: {
			trigger: { player: "damageBegin4" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return event.num > 0 && !player.countCards("h");
			},
			async content(event: any, trigger: any) {
				trigger.num = Math.max(0, trigger.num - 1);
			},
		},
		/** Lv3：无手牌时每回合首次受到的伤害为 0。 */
		3: {
			trigger: { player: ["phaseBegin", "damageBegin4"] },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				if (event.name === "phase") return true;
				return event.num > 0 && !player.countCards("h") && !player.storage.rogue_lv_kongcheng_used;
			},
			async content(event: any, trigger: any, player: any) {
				if (trigger.name === "phase") {
					player.storage.rogue_lv_kongcheng_used = false;
					return;
				}
				player.storage.rogue_lv_kongcheng_used = true;
				trigger.num = 0;
			},
		},
	},
	yiji: {
		/** Lv2：受伤摸牌后额外摸 1（合计 3 张）。 */
		2: {
			trigger: { player: "damageEnd" },
			forced: true,
			popup: false,
			filter(event: any) {
				return event.num > 0;
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
		/** Lv3：受伤摸牌后回复 1。 */
		3: {
			trigger: { player: "damageEnd" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return event.num > 0 && player.isAlive();
			},
			async content(event: any, trigger: any, player: any) {
				await player.recover();
			},
		},
	},
	fankui: {
		/** Lv2：受到伤害后额外随机获得来源一张牌。 */
		2: {
			trigger: { player: "damageEnd" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return event.num > 0 && event.source && event.source !== player && event.source.hasCards?.("he");
			},
			async content(event: any, trigger: any, player: any) {
				await player.randomGain({ target: trigger.source, num: 1, position: "he" });
			},
		},
		/** Lv3：受到伤害后回复 1。 */
		3: {
			trigger: { player: "damageEnd" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return event.num > 0 && player.isAlive();
			},
			async content(event: any, trigger: any, player: any) {
				await player.recover();
			},
		},
	},
};

/** 生成注入 `lib.skill` 的等级技能表（id 形如 rogue_lv_<skill>_<level>）。 */
export const LEVEL_SKILL_DEFS: Record<string, any> = Object.fromEntries(
	Object.entries(LEVEL_SKILLS).flatMap(([skillId, levels]) =>
		([2, 3] as const).filter(level => levels[level]).map(level => [`rogue_lv_${skillId}_${level}`, levels[level]])
	)
);

/** 返回某技能在指定等级需要安装的引擎技能 id。 */
export function levelSkillIds(skillId: string, level: number): string[] {
	const result: string[] = [];
	if (level >= 2 && LEVEL_SKILLS[skillId]?.[2]) result.push(`rogue_lv_${skillId}_2`);
	if (level >= 3 && LEVEL_SKILLS[skillId]?.[3]) result.push(`rogue_lv_${skillId}_3`);
	return result;
}
