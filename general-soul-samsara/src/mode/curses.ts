import { get } from "noname";
import { CURSES, isCurse } from "../data/curses";

/**
 * 诅咒牌的引擎定义与结算规则。
 *
 * 诅咒牌不可主动使用（`enable: false`），只能通过事件获得、通过删牌净化；
 * 效果由 `rogue_curse_rules` 在对应时机检查手牌后结算。
 */

const curseCardTemplate = {
	type: "trick",
	enable: false,
	filter: () => false,
	content: () => {},
};

/** 注入 `lib.card` 的卡牌定义。 */
export const CURSE_CARDS: Record<string, any> = Object.fromEntries(
	CURSES.map(curse => [curse.id, { ...curseCardTemplate }])
);

/** 注入 `lib.translate` 的名称与描述。 */
export const CURSE_TRANSLATE: Record<string, string> = Object.fromEntries(
	CURSES.flatMap(curse => [
		[curse.id, curse.name],
		[`${curse.id}_info`, curse.description],
	])
);

export const rogue_curse_rules = {
	trigger: { player: ["phaseBegin", "phaseJieshuBegin", "phaseJudgeBegin", "recoverBegin"] },
	forced: true,
	popup: false,
	filter(event: any, player: any) {
		if (event.name === "phase" || event.name === "recover") return true;
		return player.countCards("h", (card: any) => isCurse(card.name)) > 0;
	},
	async content(event: any, trigger: any, player: any) {
		switch (trigger.name) {
			case "phase": {
				player.storage.rogue_no_heal = player.countCards("h", { name: "rogue_curse_jinliao" }) > 0;
				return;
			}
			case "recover": {
				if (player.storage.rogue_no_heal) trigger.cancel();
				return;
			}
			case "phaseJieshu": {
				const count = player.countCards("h", { name: "rogue_curse_du" });
				for (let i = 0; i < count; i++) await player.loseHp();
				return;
			}
			case "phaseJudge": {
				if (player.countCards("h", { name: "rogue_curse_lebu" })) {
					const { bool } = await player
						.judge({
							judge(card: any) {
								return get.suit(card) === "heart" ? 1 : -1;
							},
							judge2(result: any) {
								return result.bool;
							},
						})
						.forResult();
					if (!bool) player.skip("phaseUse");
				}
				if (player.countCards("h", { name: "rogue_curse_bingliang" })) {
					const { bool } = await player
						.judge({
							judge(card: any) {
								return get.suit(card) === "club" ? 1 : -1;
							},
							judge2(result: any) {
								return result.bool;
							},
						})
						.forResult();
					if (!bool) player.skip("phaseDraw");
				}
				return;
			}
		}
	},
};
