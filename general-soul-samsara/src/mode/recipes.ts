import { RECIPES } from "../data/recipes";

/**
 * 融合与进化产物的引擎技能。
 *
 * - 融合直接用 `group` 聚合两个原版技能，机制与原版完全一致（需求规格 §5.3）。
 * - 进化用 `group` 保留原技能，并追加一条自定义触发。
 */
export const RECIPE_SKILLS: Record<string, any> = Object.fromEntries(
	RECIPES.filter(recipe => recipe.kind === "fusion").map(recipe => [recipe.output.id, { group: [...recipe.inputs] }])
);

/** 青龙武圣：武圣 + 杀伤害 +1。 */
RECIPE_SKILLS.rogue_evo_qinglong = {
	group: ["wusheng"],
	trigger: { source: "damageBegin3" },
	forced: true,
	popup: false,
	filter(event: any) {
		return event.card?.name === "sha" && event.num > 0;
	},
	async content(event: any, trigger: any) {
		trigger.num += 1;
	},
};

/** 义绝武圣：武圣 + 杀造成伤害后回复 1。 */
RECIPE_SKILLS.rogue_evo_yijue = {
	group: ["wusheng"],
	trigger: { source: "damageEnd" },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		return event.card?.name === "sha" && event.num > 0 && player.isAlive();
	},
	async content(event: any, trigger: any, player: any) {
		await player.recover();
	},
};

/** 燕人咆哮：咆哮 + 每回合第一张杀伤害 +1。 */
RECIPE_SKILLS.rogue_evo_yanren = {
	group: ["paoxiao"],
	trigger: { player: "phaseBegin", source: "damageBegin3" },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		if (event.name === "phase") return true;
		return event.card?.name === "sha" && event.num > 0 && !player.storage.rogue_yanren_used;
	},
	async content(event: any, trigger: any, player: any) {
		if (trigger.name === "phase") {
			player.storage.rogue_yanren_used = false;
			return;
		}
		player.storage.rogue_yanren_used = true;
		trigger.num += 1;
	},
};

/** 虎啸：咆哮 + 每回合首次使用杀后摸 1。 */
RECIPE_SKILLS.rogue_evo_huxiao = {
	group: ["paoxiao"],
	trigger: { player: ["phaseBegin", "useCardAfter"] },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		if (event.name === "phase") return true;
		return event.card?.name === "sha" && !player.storage.rogue_huxiao_used;
	},
	async content(event: any, trigger: any, player: any) {
		if (trigger.name === "phase") {
			player.storage.rogue_huxiao_used = false;
			return;
		}
		player.storage.rogue_huxiao_used = true;
		await player.draw({ nodelay: true });
	},
};

/** 苦肉·诈降：苦肉 + 失去体力后本回合的杀不可闪避。 */
RECIPE_SKILLS.rogue_evo_zhaxiang = {
	group: ["kurou"],
	trigger: { player: ["phaseBegin", "loseHpAfter", "useCardToPlayered"] },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		if (event.name === "phase") return true;
		if (event.name === "loseHp") return true;
		return event.card?.name === "sha" && Boolean(player.storage.rogue_zhaxiang);
	},
	async content(event: any, trigger: any, player: any) {
		if (trigger.name === "phase") {
			player.storage.rogue_zhaxiang = false;
			return;
		}
		if (trigger.name === "loseHp") {
			player.storage.rogue_zhaxiang = true;
			return;
		}
		trigger.getParent()?.directHit.add(trigger.target);
	},
};

/** 观星·天命：观星 + 每次判定后摸 1。 */
RECIPE_SKILLS.rogue_evo_tianming = {
	group: ["guanxing"],
	trigger: { player: "judgeEnd" },
	forced: true,
	popup: false,
	filter(event: any) {
		return Boolean(event.result?.card);
	},
	async content(event: any, trigger: any, player: any) {
		await player.draw({ nodelay: true });
	},
};
