import type { SkillMeta } from "../shared/types";

/** M0.1 的 6 个通用技能（3 主动 + 3 被动），实现全部复用标包。 */
export const M01_SKILLS: readonly SkillMeta[] = [
	{
		id: "wusheng",
		name: "武圣",
		kind: "active",
		tags: ["杀", "爆发"],
		quality: "common",
		levels: ["红色牌当【杀】使用或打出时可以摸一张牌。", "红色牌当【杀】使用时伤害 +1。"],
	},
	{
		id: "kurou",
		name: "苦肉",
		kind: "active",
		tags: ["卖血", "爆发"],
		quality: "common",
		levels: ["失去 2 点体力，摸 3 张牌。", "失去 1 点体力即可摸 3 张牌。"],
	},
	{
		id: "zhiheng",
		name: "制衡",
		kind: "active",
		tags: ["过牌"],
		quality: "common",
		levels: ["弃置 X 张牌后可多摸 1 张。", "弃置 X 张牌后额外获得 1 点护甲。"],
	},
	{
		id: "paoxiao",
		name: "咆哮",
		kind: "passive",
		tags: ["多刀"],
		quality: "common",
		levels: ["使用【杀】造成伤害后摸 1 张牌。", "每回合第一张【杀】伤害 +1。"],
	},
	{
		id: "jianxiong",
		name: "奸雄",
		kind: "passive",
		tags: ["卖血", "过牌"],
		quality: "common",
		levels: ["获得伤害牌时可额外摸 1 张牌。", "获得伤害牌时可回复 1 点体力。"],
	},
	{
		id: "kongcheng",
		name: "空城",
		kind: "passive",
		tags: ["防御"],
		quality: "common",
		levels: ["无手牌时受到的伤害 -1。", "无手牌时每回合首次受到的伤害为 0。"],
	},
];

/** M0.3 追加的 6 个通用技能（第一批 12 个的其余部分）。 */
export const M03_SKILLS: readonly SkillMeta[] = [
	{
		id: "guanxing",
		name: "观星",
		kind: "active",
		tags: ["判定", "过牌"],
		quality: "rare",
		levels: ["准备阶段多看 1 张牌。", "准备阶段可多调整 2 张牌。"],
	},
	{
		id: "tieqi",
		name: "铁骑",
		kind: "active",
		tags: ["杀", "控制"],
		quality: "rare",
		levels: ["判定为红色时【杀】伤害 +1。", "判定为红色时不可被闪避且摸 1 张牌。"],
	},
	{
		id: "qixi",
		name: "奇袭",
		kind: "active",
		tags: ["控制", "过牌"],
		quality: "rare",
		levels: ["黑色牌当【过河拆桥】后可摸 1 张牌。", "黑色牌当【过河拆桥】时可拆 2 张牌。"],
	},
	{
		id: "fankui",
		name: "反馈",
		kind: "passive",
		tags: ["卖血", "控制"],
		quality: "rare",
		levels: ["获得来源一张牌时可改为获得两张。", "获得来源两张牌时可回复 1 点体力。"],
	},
	{
		id: "guicai",
		name: "鬼才",
		kind: "passive",
		tags: ["判定"],
		quality: "rare",
		levels: ["改判后可摸 1 张牌。", "改判后可令此次判定结果颜色由你决定。"],
	},
	{
		id: "yiji",
		name: "遗计",
		kind: "passive",
		tags: ["卖血", "过牌"],
		quality: "rare",
		levels: ["受伤摸 2 张牌时可改为摸 3 张。", "受伤摸牌后可额外回复 1 点体力。"],
	},
];

export const ALL_GENERAL_SKILLS: readonly SkillMeta[] = [...M01_SKILLS, ...M03_SKILLS];

export function getSkillMeta(id: string): SkillMeta | undefined {
	return ALL_GENERAL_SKILLS.find(skill => skill.id === id);
}

/** M0.1 的 3 个主动技能与 3 个被动技能。 */
export function getSlotSkills(): { active: SkillMeta[]; passive: SkillMeta[] } {
	return {
		active: M01_SKILLS.filter(skill => skill.kind === "active"),
		passive: M01_SKILLS.filter(skill => skill.kind === "passive"),
	};
}
