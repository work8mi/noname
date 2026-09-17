import { get } from "noname";
import { LEVEL_SKILL_LEVELS } from "./levels";

/**
 * 逐级技能数值的引擎效果。
 *
 * 只覆盖能用引擎事件钩子干净实现的技能；制衡、鬼才、铁骑仍只作进化门槛。
 * id 命名约定：`rogue_lv_<skillId>_<level>`（与 `levels.ts` 的 `levelSkillIds` 对应）。
 */

/** 判断一张牌是否为指定颜色的牌转化而来的虚拟牌（如武圣 / 奇袭）。 */
function isConvertedFrom(card: any, name: string, color: "red" | "black"): boolean {
	if (!card || card.name !== name || !card.cards?.length) return false;
	return card.cards.some((underlying: any) => get.color(underlying) === color);
}

/** 各技能的等级效果定义。 */
const LEVEL_EFFECTS: Record<string, { 2?: any; 3?: any }> = {
	wusheng: {
		/** Lv2：红色牌当【杀】后可摸 1 张牌。 */
		2: {
			trigger: { player: "useCardAfter" },
			forced: true,
			popup: false,
			filter(event: any) {
				return isConvertedFrom(event.card, "sha", "red");
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
		/** Lv3：红色牌当【杀】使用时伤害 +1。 */
		3: {
			trigger: { source: "damageBegin3" },
			forced: true,
			popup: false,
			filter(event: any) {
				return event.num > 0 && isConvertedFrom(event.card, "sha", "red");
			},
			async content(event: any, trigger: any) {
				trigger.num += 1;
			},
		},
	},
	qixi: {
		/** Lv2：黑色牌当【过河拆桥】后摸 1 张牌。 */
		2: {
			trigger: { player: "useCardAfter" },
			forced: true,
			popup: false,
			filter(event: any) {
				return isConvertedFrom(event.card, "guohe", "black");
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
		/** Lv3：黑色牌当【过河拆桥】时额外随机弃置目标一张牌。 */
		3: {
			trigger: { player: "useCardAfter" },
			forced: true,
			popup: false,
			filter(event: any) {
				return isConvertedFrom(event.card, "guohe", "black");
			},
			async content(event: any, trigger: any, player: any) {
				for (const target of trigger.targets ?? []) {
					if (target.hasCards?.("he")) await target.randomDiscard({ num: 1, discarder: player, position: "he" });
				}
			},
		},
	},
	kurou: {
		/** Lv2：出牌阶段失去体力（苦肉）后摸 1 张牌。 */
		2: {
			trigger: { player: "loseHpAfter" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return player.isPhaseUsing();
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
		/** Lv3：出牌阶段失去体力后额外再摸 1 张牌。 */
		3: {
			trigger: { player: "loseHpAfter" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return player.isPhaseUsing();
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
	},
	guanxing: {
		/** Lv2：准备阶段结束后摸 1 张牌。 */
		2: {
			trigger: { player: "phaseZhunbeiEnd" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return player.hasSkill("guanxing");
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
		/** Lv3：准备阶段结束后额外再摸 1 张牌。 */
		3: {
			trigger: { player: "phaseZhunbeiEnd" },
			forced: true,
			popup: false,
			filter(event: any, player: any) {
				return player.hasSkill("guanxing");
			},
			async content(event: any, trigger: any, player: any) {
				await player.draw({ nodelay: true });
			},
		},
	},
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
	Object.entries(LEVEL_SKILL_LEVELS).flatMap(([skillId, levels]) =>
		levels.filter(level => LEVEL_EFFECTS[skillId]?.[level]).map(level => [`rogue_lv_${skillId}_${level}`, LEVEL_EFFECTS[skillId][level]])
	)
);
