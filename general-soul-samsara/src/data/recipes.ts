/**
 * 技能融合与进化的配方表（需求规格 §5.4）。
 *
 * 产物的 `id` 同时是引擎技能 id 与槽位 id；展示名与描述通过模式 translate 注入。
 */
export interface RecipeOutput {
	id: string;
	name: string;
	description: string;
	tags: string[];
}

export interface RecipeDef {
	id: string;
	kind: "fusion" | "evolution";
	/** 需要的技能 id（融合为两个，进化为一个）。 */
	inputs: string[];
	output: RecipeOutput;
	/** 进化需要输入技能达到的等级（Q19：Lv2 为进化门槛）。 */
	minLevel?: number;
}

export const RECIPES: readonly RecipeDef[] = [
	{
		id: "shenwei",
		kind: "fusion",
		inputs: ["wusheng", "tieqi"],
		output: {
			id: "rogue_fusion_shenwei",
			name: "神威",
			description: "红牌当【杀】；【杀】指定目标后判定，红色则不可闪避。",
			tags: ["杀", "控制"],
		},
	},
	{
		id: "kuanggu",
		kind: "fusion",
		inputs: ["kurou", "jianxiong"],
		output: {
			id: "rogue_fusion_kuanggu",
			name: "狂骨",
			description: "失去体力后摸牌；受到伤害后获得伤害牌。",
			tags: ["卖血", "过牌"],
		},
	},
	{
		id: "sishi",
		kind: "fusion",
		inputs: ["kurou", "fankui"],
		output: {
			id: "rogue_fusion_sishi",
			name: "死士",
			description: "失去体力后摸牌；受到伤害后获得来源一张牌。",
			tags: ["卖血", "控制"],
		},
	},
	{
		id: "tianming_guicai",
		kind: "fusion",
		inputs: ["guanxing", "guicai"],
		output: {
			id: "rogue_fusion_tianming_guicai",
			name: "天命鬼才",
			description: "观星；判定时可直接打出牌改判。",
			tags: ["判定", "过牌"],
		},
	},
	{
		id: "qice",
		kind: "fusion",
		inputs: ["zhiheng", "qixi"],
		output: {
			id: "rogue_fusion_qice",
			name: "奇策",
			description: "弃 X 张牌后摸 X 张；黑色牌当【过河拆桥】。",
			tags: ["过牌", "控制"],
		},
	},
	{
		id: "moulue",
		kind: "fusion",
		inputs: ["zhiheng", "yiji"],
		output: {
			id: "rogue_fusion_moulue",
			name: "谋略",
			description: "弃 X 张牌后摸 X 张；受到伤害后摸 2 张牌。",
			tags: ["过牌", "卖血"],
		},
	},
	{
		id: "qinglong_wusheng",
		kind: "evolution",
		inputs: ["wusheng"],
		minLevel: 2,
		output: {
			id: "rogue_evo_qinglong",
			name: "青龙武圣",
			description: "红牌当【杀】；你使用【杀】造成的伤害 +1。",
			tags: ["杀", "爆发"],
		},
	},
	{
		id: "yijue_wusheng",
		kind: "evolution",
		inputs: ["wusheng"],
		minLevel: 2,
		output: {
			id: "rogue_evo_yijue",
			name: "义绝武圣",
			description: "红牌当【杀】；你使用【杀】造成伤害后回复 1 点体力。",
			tags: ["杀", "回复"],
		},
	},
	{
		id: "yanren_paoxiao",
		kind: "evolution",
		inputs: ["paoxiao"],
		minLevel: 2,
		output: {
			id: "rogue_evo_yanren",
			name: "燕人咆哮",
			description: "使用【杀】无次数限制；每回合第一张【杀】伤害 +1。",
			tags: ["多刀", "杀"],
		},
	},
	{
		id: "huxiao_paoxiao",
		kind: "evolution",
		inputs: ["paoxiao"],
		minLevel: 2,
		output: {
			id: "rogue_evo_huxiao",
			name: "虎啸",
			description: "使用【杀】无次数限制；每回合首次使用【杀】后摸 1 张牌。",
			tags: ["多刀", "过牌"],
		},
	},
	{
		id: "zhaxiang_kurou",
		kind: "evolution",
		inputs: ["kurou"],
		minLevel: 2,
		output: {
			id: "rogue_evo_zhaxiang",
			name: "苦肉·诈降",
			description: "失去体力后摸牌；失去体力后，本回合的【杀】不可闪避。",
			tags: ["卖血", "爆发"],
		},
	},
	{
		id: "tianming_guanxing",
		kind: "evolution",
		inputs: ["guanxing"],
		minLevel: 2,
		output: {
			id: "rogue_evo_tianming",
			name: "观星·天命",
			description: "观星；每次判定后摸 1 张牌。",
			tags: ["判定", "过牌"],
		},
	},
];

/** 注入 `lib.translate` 的产物名称与描述。 */
export const RECIPE_TRANSLATE: Record<string, string> = Object.fromEntries(
	RECIPES.flatMap(recipe => [
		[recipe.output.id, recipe.output.name],
		[`${recipe.output.id}_info`, recipe.output.description],
	])
);

export function getRecipe(id: string): RecipeDef | undefined {
	return RECIPES.find(recipe => recipe.id === id);
}

export function getRecipeOutput(id: string): RecipeOutput | undefined {
	return RECIPES.find(recipe => recipe.output.id === id)?.output;
}
