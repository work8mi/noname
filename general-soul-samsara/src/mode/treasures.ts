import { get } from "noname";

/**
 * 宝物与规则修正的引擎技能。
 *
 * 与 mode/skills.ts 一样，这些对象由模式配置注入 `lib.skill`，
 * 在战斗准备阶段按 `state.treasures` 安装到玩家身上。
 */

/** 规则：每回合摸 3 张（玉玺的 +1 在此合并计算，避免触发顺序问题）。 */
export const rogue_rule_draw = {
	trigger: { player: "phaseDrawBegin2" },
	forced: true,
	popup: false,
	filter(event: any) {
		return !event.numFixed;
	},
	async content(event: any, trigger: any, player: any) {
		trigger.num = 3 + (player.hasSkill("rogue_yuxi") ? 1 : 0);
	},
};

/** 咆哮令：每回合首次使用【杀】后摸 1。 */
export const rogue_paoxiaoling = {
	trigger: { player: ["phaseBegin", "useCardAfter"] },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		if (event.name === "phaseBegin") return true;
		return event.card?.name === "sha" && !player.storage.rogue_paoxiaoling_used && event.getParent()?.type === "phase";
	},
	async content(event: any, trigger: any, player: any) {
		if (trigger.name === "phaseBegin") {
			player.storage.rogue_paoxiaoling_used = false;
			return;
		}
		player.storage.rogue_paoxiaoling_used = true;
		await player.draw({ nodelay: true });
	},
};

/** 集智符：每使用一张锦囊牌摸 1。 */
export const rogue_jizhifu = {
	trigger: { player: "useCardAfter" },
	forced: true,
	popup: false,
	filter(event: any) {
		return get.type(event.card) === "trick";
	},
	async content(event: any, trigger: any, player: any) {
		await player.draw({ nodelay: true });
	},
};

/** 枭姬令：每使用一张装备牌摸 1。 */
export const rogue_xiaoji = {
	trigger: { player: "useCardAfter" },
	forced: true,
	popup: false,
	filter(event: any) {
		return get.type(event.card) === "equip";
	},
	async content(event: any, trigger: any, player: any) {
		await player.draw({ nodelay: true });
	},
};

/** 八卦阵：每回合首次受到伤害时判定，红色则防止此伤害。 */
export const rogue_bagua = {
	trigger: { player: ["phaseBegin", "damageBegin3"] },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		if (event.name === "phaseBegin") return true;
		return event.num > 0 && !player.storage.rogue_bagua_used;
	},
	async content(event: any, trigger: any, player: any) {
		if (trigger.name === "phaseBegin") {
			player.storage.rogue_bagua_used = false;
			return;
		}
		player.storage.rogue_bagua_used = true;
		const { bool } = await player
			.judge({
				judge(card: any) {
					return get.color(card) === "red" ? 2 : -0.5;
				},
				judge2(result: any) {
					return result.bool;
				},
			})
			.forResult();
		if (bool) trigger.num = 0;
	},
};

/** 青龙偃月刀：每回合第一张【杀】伤害 +1；击杀角色后回复 1 点体力。 */
export const rogue_qinglong = {
	trigger: { player: "phaseBegin", source: ["damageBegin3", "dieAfter"] },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		if (event.name === "phaseBegin") return true;
		if (event.name === "dieAfter") return true;
		return event.num > 0 && event.card?.name === "sha" && !player.storage.rogue_qinglong_used;
	},
	async content(event: any, trigger: any, player: any) {
		if (trigger.name === "phaseBegin") {
			player.storage.rogue_qinglong_used = false;
			return;
		}
		if (trigger.name === "dieAfter") {
			if (player.isAlive()) await player.recover();
			return;
		}
		player.storage.rogue_qinglong_used = true;
		trigger.num += 1;
	},
};

/** 玉玺：手牌上限 +1（摸牌 +1 已并入 rogue_rule_draw）。 */
export const rogue_yuxi = {
	mod: {
		maxHandcard(player: any, num: number) {
			return num + 1;
		},
	},
};

/** 诸葛连弩：出杀次数 +2，但【杀】造成的伤害 -1。 */
export const rogue_zhugeliannu = {
	mod: {
		cardUsable(card: any, player: any, num: number) {
			if (card.name === "sha") return num + 2;
		},
	},
	trigger: { source: "damageBegin3" },
	forced: true,
	popup: false,
	filter(event: any) {
		return event.num > 0 && event.card?.name === "sha";
	},
	async content(event: any, trigger: any) {
		trigger.num = Math.max(0, trigger.num - 1);
	},
};

export const TREASURE_SKILLS: Record<string, any> = {
	rogue_rule_draw,
	rogue_paoxiaoling,
	rogue_jizhifu,
	rogue_xiaoji,
	rogue_bagua,
	rogue_qinglong,
	rogue_yuxi,
	rogue_zhugeliannu,
};
