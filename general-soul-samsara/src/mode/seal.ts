/**
 * 封印规则的引擎实现。
 *
 * 敌人的「封印」意图会临时移除玩家的一个主动技能（记录在
 * `player.storage.rogueSealedSkill`），在玩家回合结束时自动恢复。
 */
export const rogue_seal_rule = {
	trigger: { player: "phaseEnd" },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		return Boolean(player.storage.rogueSealedSkill);
	},
	async content(event: any, trigger: any, player: any) {
		const skillId = player.storage.rogueSealedSkill;
		delete player.storage.rogueSealedSkill;
		if (skillId && !player.hasSkill(skillId)) {
			player.addSkill(skillId);
			player.popup("封印解除");
		}
	},
};
