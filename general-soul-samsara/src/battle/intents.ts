import type { Rng } from "../shared/rng";
import type { Intent, IntentContext, IntentEntry, IntentType } from "../shared/types";

/**
 * 按权重抽取敌人意图；条件不满足的条目不参与。
 *
 * 全部条目不满足时回退为普通攻击，保证敌人回合永远有动作。
 */
export function chooseIntent(entries: readonly IntentEntry[], context: IntentContext, rng: Rng): Intent {
	const candidates = entries.filter(entry => entry.weight > 0 && (!entry.when || entry.when(context)));
	if (!candidates.length) return { type: "attack" };
	const total = candidates.reduce((sum, entry) => sum + entry.weight, 0);
	let roll = rng.next() * total;
	for (const entry of candidates) {
		roll -= entry.weight;
		if (roll < 0) return { type: entry.type, value: entry.value };
	}
	const last = candidates[candidates.length - 1];
	return { type: last.type, value: last.value };
}

export const INTENT_LABELS: Record<IntentType, string> = {
	attack: "攻击",
	defend: "防御",
	charge: "蓄力",
	discard: "弃牌",
	judge: "判定",
	summon: "召唤",
	seal: "封印",
};

/** 意图的展示文本（含蓄力加值）。 */
export function describeIntent(intent: Intent, charge = 0): string {
	const label = INTENT_LABELS[intent.type];
	if (intent.type === "attack" && charge > 0) return `${label}（蓄力 +${charge}）`;
	if (typeof intent.value === "number" && intent.value !== 1 && intent.type !== "attack") {
		return `${label} ${intent.value}`;
	}
	return label;
}
