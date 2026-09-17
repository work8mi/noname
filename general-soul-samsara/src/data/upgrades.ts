/** 可升级卡牌的强化说明（概要设计 §6.3）。 */
export const UPGRADE_EFFECTS: Readonly<Record<string, string>> = {
	sha: "伤害 +1",
	shan: "闪避成功后摸 1 张牌",
	tao: "回复 2 点体力",
	wuzhong: "摸 3 张牌",
	guohe: "额外随机弃置目标一张牌",
	shunshou: "额外随机获得目标一张牌",
};

export function isUpgradable(cardId: string): boolean {
	return cardId in UPGRADE_EFFECTS;
}

export function upgradeEffect(cardId: string): string | undefined {
	return UPGRADE_EFFECTS[cardId];
}
