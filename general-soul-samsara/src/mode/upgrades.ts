/**
 * 卡牌升级（+）的引擎规则。
 *
 * 升级标记写在牌对象的 `card.storage.rogueUpgraded` 上，战斗准备时由
 * `installPile` 依据单局牌组写入；本技能按牌名追加升级效果。
 */
export const rogue_upgrade_rules = {
	trigger: { player: ["useCardAfter", "respondAfter"], source: "damageBegin3" },
	forced: true,
	popup: false,
	filter(event: any) {
		return Boolean(event.card?.storage?.rogueUpgraded);
	},
	async content(event: any, trigger: any, player: any) {
		const card = trigger.card;
		if (!card?.storage?.rogueUpgraded) return;
		switch (trigger.name) {
			case "damage": {
				if (card.name === "sha") trigger.num += 1;
				return;
			}
			case "useCard": {
				if (card.name === "tao") {
					await player.recover();
				} else if (card.name === "wuzhong") {
					await player.draw({ nodelay: true });
				} else if (card.name === "guohe") {
					for (const target of trigger.targets ?? []) {
						if (target.hasCards?.("he")) await target.randomDiscard({ num: 1, discarder: player, position: "he" });
					}
				} else if (card.name === "shunshou") {
					for (const target of trigger.targets ?? []) {
						if (target.hasCards?.("he")) await player.randomGain({ target, num: 1, position: "he" });
					}
				}
				return;
			}
			case "respond": {
				if (card.name === "shan") await player.draw({ nodelay: true });
				return;
			}
		}
	},
};
