/**
 * 1v1 黑名单：无法在 1vN 下按原版执行的技能与卡牌，不入任何掉落池、商店与敌人配置。
 *
 * 主公技（依赖同势力响应）默认全部排除；本表只列出标包范围内的具体 id。
 */
export const BLACKLISTED_SKILLS: readonly string[] = ["lijian", "hujia", "jijiang", "jiuyuan", "huangtian"];

export const BLACKLISTED_CARDS: readonly string[] = ["jiedao"];

export function isSkillBlacklisted(id: string): boolean {
	return BLACKLISTED_SKILLS.includes(id);
}

export function isCardBlacklisted(id: string): boolean {
	return BLACKLISTED_CARDS.includes(id);
}
