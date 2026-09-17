/**
 * 逐级技能数值的等级清单（纯数据，供流程与测试使用）。
 *
 * 实际引擎效果定义在 `level-effects.ts`；两者通过 `rogue_lv_<skill>_<level>`
 * 的命名约定对应。
 */
export const LEVEL_SKILL_LEVELS: Readonly<Record<string, readonly (2 | 3)[]>> = {
	wusheng: [2, 3],
	qixi: [2, 3],
	kurou: [2, 3],
	guanxing: [2, 3],
	paoxiao: [2, 3],
	jianxiong: [2, 3],
	kongcheng: [2, 3],
	yiji: [2, 3],
	fankui: [2, 3],
};

/** 返回某技能在指定等级需要安装的引擎技能 id。 */
export function levelSkillIds(skillId: string, level: number): string[] {
	const levels = LEVEL_SKILL_LEVELS[skillId];
	if (!levels) return [];
	const result: string[] = [];
	for (const item of levels) {
		if (level >= item) result.push(`rogue_lv_${skillId}_${item}`);
	}
	return result;
}
