import { createApp, h, ref, type VNode } from "vue";
import { lib, ui } from "noname";
import type { Rng } from "../shared/rng";
import type { SkillMeta } from "../shared/types";
import { NODE_LABELS, type ChapterMap, type MapNode } from "../run/map";
import type { EventOption, RunEventDef } from "../run/events";
import { addCard, addGold, addTreasure, equipSkill, hasSkill, heal, removeCardAt, upgradeCardAt, type RunCard, type RunState } from "../run/state";
import { availableSkillPool, cardPrice, removeCardPrice, rollShopCards, skillPrice } from "../run/rewards";
import { QUALITY_LABELS, getTreasure, rollTreasure, treasurePrice, type TreasureDef } from "../data/treasures";
import { isUpgradable, upgradeEffect } from "../data/upgrades";

export interface MetaUI {
	start(hasSave: boolean): Promise<"new" | "continue">;
	chooseNode(map: ChapterMap, state: RunState): Promise<MapNode>;
	offerReward(offers: SkillMeta[], gold: number, state: RunState): Promise<SkillMeta | undefined>;
	offerTreasure(treasure: TreasureDef, state: RunState): Promise<void>;
	chooseEventOption(def: RunEventDef, state: RunState): Promise<EventOption>;
	promptRemoveCard(state: RunState, title: string): Promise<boolean>;
	openShop(state: RunState, rng: Rng): Promise<void>;
	openRest(state: RunState): Promise<void>;
	showChapterClear(chapter: number, state: RunState): Promise<void>;
	showRunResult(result: "victory" | "defeat", state: RunState): Promise<void>;
	setVisible(visible: boolean): void;
	/** 调试用：按当前 view 状态强制重绘（状态被外部修改后）。 */
	refresh(): void;
	dispose(): void;
}

type Resolver<T> = (value: T) => void;

type View =
	| { kind: "start"; hasSave: boolean; resolve: Resolver<"new" | "continue"> }
	| { kind: "map"; map: ChapterMap; state: RunState; resolve: Resolver<MapNode> }
	| { kind: "reward"; offers: SkillMeta[]; gold: number; state: RunState; resolve: Resolver<SkillMeta | undefined> }
	| { kind: "treasure"; treasure: TreasureDef; state: RunState; resolve: Resolver<void> }
	| { kind: "event"; def: RunEventDef; state: RunState; resolve: Resolver<EventOption> }
	| { kind: "shop"; state: RunState; rng: Rng; resolve: Resolver<void> }
	| { kind: "rest"; state: RunState; resolve: Resolver<void> }
	| { kind: "chapter"; chapter: number; state: RunState; resolve: Resolver<void> }
	| { kind: "result"; result: "victory" | "defeat"; state: RunState; resolve: Resolver<void> };

interface SlotPrompt {
	skill: SkillMeta;
	price: number;
	complete: (index: number) => void;
}

interface DeckPrompt {
	title: string;
	/** true 时为升级选择器，否则为删除选择器。 */
	upgrade?: boolean;
	/** 不可选的牌（升级选择器用于过滤已升级或不可升级的牌）。 */
	filter?: (card: RunCard, index: number) => boolean;
	complete: (index: number) => void;
	cancel: () => void;
}

const view = ref<View>({ kind: "start", hasSave: false, resolve: () => {} });
/** 外部修改状态后的重绘计数（调试/测试用）。 */
const tick = ref(0);
const slotPrompt = ref<SlotPrompt | null>(null);
const deckPrompt = ref<DeckPrompt | null>(null);
const deckView = ref(false);
const slotView = ref(false);
const treasureView = ref(false);
const shopOffers = ref<Array<{ skill: SkillMeta; price: number }>>([]);
const shopCards = ref<string[]>([]);
const shopTreasure = ref<{ treasure: TreasureDef; price: number } | null>(null);

/** 商店卡牌升级服务价格。 */
const UPGRADE_PRICE = 75;

function cardName(id: string): string {
	return (lib.translate as Record<string, string>)[id] ?? id;
}

function currentState(): RunState | null {
	return view.value.kind === "start" ? null : view.value.state;
}

function button(text: string, onClick?: () => void, disabled = false): VNode {
	return h("div", { class: ["rogue-button", disabled ? "rogue-disabled" : ""], onClick: disabled ? undefined : onClick }, text);
}

function skillCard(skill: SkillMeta, onPick: () => void, disabled = false, price?: number): VNode {
	return h("div", { class: ["rogue-card", disabled ? "rogue-disabled" : ""], onClick: disabled ? undefined : onPick }, [
		h("div", { class: "rogue-card-name" }, skill.name),
		h("div", { class: "rogue-card-kind" }, `${skill.kind === "active" ? "主动" : "被动"}${price === undefined ? "" : ` · ${price} 金币`}`),
		h("div", { class: "rogue-card-tags" }, skill.tags.join(" / ")),
	]);
}

function renderLayer(content: VNode): VNode {
	return h("div", { class: "rogue-layer" }, content);
}

function renderSlotPrompt(prompt: SlotPrompt): VNode {
	const state = currentState();
	if (!state) return h("div");
	const slots = prompt.skill.kind === "active" ? state.slots.active : state.slots.passive;
	return h("div", { class: "rogue-panel" }, [
		h("div", { class: "rogue-title" }, prompt.skill.name),
		h("div", { class: "rogue-subtitle" }, `${prompt.skill.kind === "active" ? "主动" : "被动"}槽已满，选择要替换的槽位`),
		h(
			"div",
			{ class: "rogue-card-row" },
			slots.map((slot, index) =>
				h("div", { class: "rogue-card", onClick: () => prompt.complete(index) }, [
					h("div", { class: "rogue-card-name" }, slot ? cardName(slot.id) : "空槽"),
					h("div", { class: "rogue-card-kind" }, `槽位 ${index + 1}`),
				])
			)
		),
		button("放弃", () => {
			slotPrompt.value = null;
		}),
	]);
}

function renderDeckPrompt(prompt: DeckPrompt): VNode {
	const state = currentState();
	if (!state) return h("div");
	return h("div", { class: "rogue-panel" }, [
		h("div", { class: "rogue-title" }, prompt.title),
		h(
			"div",
			{ class: "rogue-card-row" },
			state.deck.map((card, index) => {
				const disabled = Boolean(prompt.filter && !prompt.filter(card, index));
				const label = `${cardName(card.id)}${card.upgraded ? "+" : ""}`;
				return h(
					"div",
					{ class: ["rogue-card", disabled ? "rogue-disabled" : ""], onClick: disabled ? undefined : () => prompt.complete(index) },
					[
						h("div", { class: "rogue-card-name" }, label),
						prompt.upgrade && !card.upgraded && isUpgradable(card.id) ? h("div", { class: "rogue-card-tags" }, upgradeEffect(card.id)) : null,
					]
				);
			})
		),
		button("返回", () => prompt.cancel()),
	]);
}

function renderDeckView(): VNode {
	const state = currentState();
	if (!state) return h("div");
	const groups = new Map<string, { card: RunCard; count: number }>();
	for (const card of state.deck) {
		const key = `${card.id}${card.upgraded ? "+" : ""}`;
		const entry = groups.get(key);
		if (entry) entry.count++;
		else groups.set(key, { card, count: 1 });
	}
	return h("div", { class: "rogue-panel" }, [
		h("div", { class: "rogue-title" }, "牌组"),
		h("div", { class: "rogue-stats" }, `共 ${state.deck.length} 张`),
		h(
			"div",
			{ class: "rogue-card-row" },
			[...groups.values()].map(({ card, count }) =>
				h("div", { class: "rogue-card" }, [
					h("div", { class: "rogue-card-name" }, `${cardName(card.id)}${card.upgraded ? "+" : ""}`),
					h("div", { class: "rogue-card-kind" }, `x${count}`),
				])
			)
		),
		button("返回", () => {
			deckView.value = false;
		}),
	]);
}

function renderTreasureView(): VNode {
	const state = currentState();
	if (!state) return h("div");
	return h("div", { class: "rogue-panel" }, [
		h("div", { class: "rogue-title" }, "宝物"),
		h("div", { class: "rogue-stats" }, `共 ${state.treasures.length} 件`),
		state.treasures.length
			? h(
					"div",
					{ class: "rogue-card-row" },
					state.treasures.map(id => {
						const treasure = getTreasure(id);
						return h("div", { class: "rogue-card" }, [
							h("div", { class: "rogue-card-name" }, treasure?.name ?? id),
							h("div", { class: "rogue-card-kind" }, treasure ? QUALITY_LABELS[treasure.quality] : ""),
							h("div", { class: "rogue-card-tags" }, treasure?.description ?? ""),
						]);
					})
				)
			: h("div", { class: "rogue-subtitle" }, "尚未获得宝物"),
		button("返回", () => {
			treasureView.value = false;
		}),
	]);
}

function renderTreasureOffer(current: Extract<View, { kind: "treasure" }>): VNode {
	const treasure = current.treasure;
	return h("div", { class: "rogue-panel" }, [
		h("div", { class: "rogue-title" }, "获得宝物"),
		h("div", { class: "rogue-card" }, [
			h("div", { class: "rogue-card-name" }, treasure.name),
			h("div", { class: "rogue-card-kind" }, QUALITY_LABELS[treasure.quality]),
			h("div", { class: "rogue-card-tags" }, treasure.description),
		]),
		h("div", { class: "rogue-button-row" }, [
			button("领取", () => {
				addTreasure(current.state, treasure.id);
				current.resolve();
			}),
			button("放弃", () => current.resolve()),
		]),
	]);
}

function renderSlotView(): VNode {
	const state = currentState();
	if (!state) return h("div");
	const rows = [
		...state.slots.active.map((slot, index) => ({ label: `主动 ${index + 1}`, slot })),
		...state.slots.passive.map((slot, index) => ({ label: `被动 ${index + 1}`, slot })),
	];
	return h("div", { class: "rogue-panel" }, [
		h("div", { class: "rogue-title" }, "通用技能槽"),
		h(
			"div",
			{ class: "rogue-card-row" },
			rows.map(row =>
				h("div", { class: "rogue-card" }, [
					h("div", { class: "rogue-card-name" }, row.slot ? cardName(row.slot.id) : "空槽"),
					h("div", { class: "rogue-card-kind" }, row.label),
				])
			)
		),
		button("返回", () => {
			slotView.value = false;
		}),
	]);
}

function renderView(current: View): VNode {
	switch (current.kind) {
		case "start":
			return h("div", { class: "rogue-panel" }, [
				h("div", { class: "rogue-title" }, "将魂轮回"),
				h("div", { class: "rogue-subtitle" }, "M0.2 地图与构筑原型"),
				current.hasSave ? button("继续单局", () => current.resolve("continue")) : null,
				button("新开一局", () => current.resolve("new")),
			]);
		case "map":
			return h("div", { class: "rogue-panel rogue-panel-wide" }, [
				h("div", { class: "rogue-title" }, `第 ${current.state.chapter} 章`),
				h(
					"div",
					{ class: "rogue-stats" },
					`体力 ${current.state.hp}/${current.state.maxHp}　金币 ${current.state.gold}　牌组 ${current.state.deck.length} 张`
				),
				h("div", { class: "rogue-button-row" }, [
					button("查看牌组", () => {
						deckView.value = true;
					}),
					button("查看技能", () => {
						slotView.value = true;
					}),
					button("查看宝物", () => {
						treasureView.value = true;
					}),
				]),
				...current.map.layers.map((layer, layerIndex) =>
					h("div", { class: ["rogue-row", layerIndex === current.state.layer ? "rogue-row-current" : ""] }, [
						h("div", { class: "rogue-layer-label" }, `第 ${layerIndex + 1} 层`),
						...layer.map(node => {
							const selectable = layerIndex === current.state.layer;
							const cleared = layerIndex < current.state.layer;
							return h(
								"div",
								{
									class: ["rogue-node", selectable ? "rogue-node-current" : "", cleared ? "rogue-node-cleared" : ""],
									onClick: selectable ? () => current.resolve(node) : undefined,
								},
								NODE_LABELS[node.type]
							);
						}),
					])
				),
			]);
		case "reward":
			return h("div", { class: "rogue-panel" }, [
				h("div", { class: "rogue-title" }, "战斗胜利"),
				h("div", { class: "rogue-subtitle" }, current.gold > 0 ? `获得 ${current.gold} 金币，选择一项技能` : "选择一项技能"),
				h(
					"div",
					{ class: "rogue-card-row" },
					current.offers.map(skill => skillCard(skill, () => pickRewardSkill(current, skill)))
				),
				button("跳过", () => current.resolve(undefined)),
			]);
		case "treasure":
			return renderTreasureOffer(current);
		case "event":
			return h("div", { class: "rogue-panel" }, [
				h("div", { class: "rogue-title" }, current.def.name),
				h("div", { class: "rogue-description" }, current.def.description),
				...current.def.options.map(option =>
					h("div", { class: "rogue-option", onClick: () => current.resolve(option) }, [
						h("div", { class: "rogue-option-label" }, option.label),
						h("div", { class: "rogue-option-detail" }, option.detail),
					])
				),
			]);
		case "shop":
			return h("div", { class: "rogue-panel" }, [
				h("div", { class: "rogue-title" }, "商店"),
				h("div", { class: "rogue-stats" }, `金币 ${current.state.gold}`),
				h("div", { class: "rogue-section" }, "卡牌"),
				h(
					"div",
					{ class: "rogue-card-row" },
					shopCards.value.map(id => {
						const price = cardPrice(id);
						const disabled = current.state.gold < price;
						return h(
							"div",
							{ class: ["rogue-card", disabled ? "rogue-disabled" : ""], onClick: disabled ? undefined : () => buyCard(current, id, price) },
							[h("div", { class: "rogue-card-name" }, cardName(id)), h("div", { class: "rogue-card-kind" }, `卡牌 · ${price} 金币`)]
						);
					})
				),
				h("div", { class: "rogue-section" }, "技能"),
				h(
					"div",
					{ class: "rogue-card-row" },
					shopOffers.value.map(item => {
						const disabled = current.state.gold < item.price || hasSkill(current.state, item.skill.id);
						return skillCard(item.skill, () => buySkill(current, item), disabled, item.price);
					})
				),
				h("div", { class: "rogue-section" }, "宝物"),
				shopTreasure.value
					? h(
							"div",
							{ class: "rogue-card-row" },
							[
								h(
									"div",
									{
										class: ["rogue-card", current.state.gold < shopTreasure.value.price ? "rogue-disabled" : ""],
										onClick: current.state.gold < shopTreasure.value.price ? undefined : () => buyTreasure(current),
									},
									[
										h("div", { class: "rogue-card-name" }, shopTreasure.value.treasure.name),
										h("div", { class: "rogue-card-kind" }, `${QUALITY_LABELS[shopTreasure.value.treasure.quality]} · ${shopTreasure.value.price} 金币`),
										h("div", { class: "rogue-card-tags" }, shopTreasure.value.treasure.description),
									]
								),
							]
						)
					: h("div", { class: "rogue-subtitle" }, "宝物已售罄"),
				h("div", { class: "rogue-button-row" }, [
					button(
						`删牌（${removeCardPrice(current.state)} 金币）`,
						() => buyRemove(current),
						current.state.gold < removeCardPrice(current.state) || current.state.deck.length <= 1
					),
					button("升级（75 金币）", () => buyUpgrade(current), current.state.gold < UPGRADE_PRICE || !hasUpgradable(current.state)),
					button("刷新（25 金币）", () => refreshShop(current), current.state.gold < 25),
					button("离开", () => current.resolve()),
				]),
			]);
		case "rest":
			return h("div", { class: "rogue-panel" }, [
				h("div", { class: "rogue-title" }, "休整"),
				h("div", { class: "rogue-stats" }, `体力 ${current.state.hp}/${current.state.maxHp}`),
				h("div", { class: "rogue-button-row" }, [
					button("回复 2 点体力", () => {
						heal(current.state, 2);
						current.resolve();
					}),
					button("升级一张牌", () => promptUpgrade(current.state, () => current.resolve()), !hasUpgradable(current.state)),
					button("离开", () => current.resolve()),
				]),
			]);
		case "chapter":
			return h("div", { class: "rogue-panel" }, [
				h("div", { class: "rogue-title" }, `第 ${current.chapter} 章完成`),
				h("div", { class: "rogue-stats" }, `体力 ${current.state.hp}/${current.state.maxHp}　金币 ${current.state.gold}　宝物 ${current.state.treasures.length}`),
				button("进入下一章", () => current.resolve()),
			]);
		case "result":
			return h("div", { class: "rogue-panel" }, [
				h("div", { class: "rogue-title" }, current.result === "victory" ? "章节通关" : "轮回终结"),
				h("div", { class: "rogue-stats" }, `战斗 ${current.state.battleCount} 场　金币 ${current.state.gold}`),
				button("重新开始", () => window.location.reload()),
			]);
	}
}

function pickRewardSkill(current: Extract<View, { kind: "reward" }>, skill: SkillMeta): void {
	if (hasSkill(current.state, skill.id)) return;
	const result = equipSkill(current.state, skill);
	if (result.needReplace) {
		slotPrompt.value = {
			skill,
			price: 0,
			complete: index => {
				equipSkill(current.state, skill, index);
				slotPrompt.value = null;
				current.resolve(skill);
			},
		};
		return;
	}
	current.resolve(result.ok ? skill : undefined);
}

function buyCard(current: Extract<View, { kind: "shop" }>, id: string, price: number): void {
	if (current.state.gold < price) return;
	addGold(current.state, -price);
	addCard(current.state, id);
	shopCards.value = shopCards.value.filter(card => card !== id);
}

function buyTreasure(current: Extract<View, { kind: "shop" }>): void {
	const slot = shopTreasure.value;
	if (!slot) return;
	if (current.state.gold < slot.price || current.state.treasures.includes(slot.treasure.id)) return;
	addGold(current.state, -slot.price);
	addTreasure(current.state, slot.treasure.id);
	shopTreasure.value = null;
}

function buySkill(current: Extract<View, { kind: "shop" }>, item: { skill: SkillMeta; price: number }): void {
	const { skill, price } = item;
	if (current.state.gold < price || hasSkill(current.state, skill.id)) return;
	const charge = () => {
		addGold(current.state, -price);
		shopOffers.value = shopOffers.value.filter(entry => entry.skill.id !== skill.id);
	};
	const result = equipSkill(current.state, skill);
	if (result.needReplace) {
		slotPrompt.value = {
			skill,
			price,
			complete: index => {
				equipSkill(current.state, skill, index);
				charge();
				slotPrompt.value = null;
			},
		};
		return;
	}
	if (result.ok) charge();
}

function buyRemove(current: Extract<View, { kind: "shop" }>): void {
	const price = removeCardPrice(current.state);
	if (current.state.gold < price || current.state.deck.length <= 1) return;
	promptDelete(current.state, () => addGold(current.state, -price));
}

function buyUpgrade(current: Extract<View, { kind: "shop" }>): void {
	if (current.state.gold < UPGRADE_PRICE || !hasUpgradable(current.state)) return;
	promptUpgrade(current.state, () => addGold(current.state, -UPGRADE_PRICE));
}

function promptDelete(state: RunState, onDone: () => void): void {
	deckPrompt.value = {
		title: "选择要删除的牌",
		complete: index => {
			removeCardAt(state, index);
			deckPrompt.value = null;
			onDone();
		},
		cancel: () => {
			deckPrompt.value = null;
		},
	};
}

/** 卡牌升级服务：休整免费、商店收费。 */
function promptUpgrade(state: RunState, onDone: () => void): void {
	deckPrompt.value = {
		title: "选择要升级的牌",
		upgrade: true,
		filter: card => isUpgradable(card.id) && !card.upgraded,
		complete: index => {
			upgradeCardAt(state, index);
			deckPrompt.value = null;
			onDone();
		},
		cancel: () => {
			deckPrompt.value = null;
		},
	};
}

function hasUpgradable(state: RunState): boolean {
	return state.deck.some(card => isUpgradable(card.id) && !card.upgraded);
}

function refreshShop(current: Extract<View, { kind: "shop" }>): void {
	if (current.state.gold < 25) return;
	addGold(current.state, -25);
	rollShopStock(current.state, current.rng);
}

/** 重新生成商店货架：技能、卡牌、宝物（价格在生成时固定）。 */
function rollShopStock(state: RunState, rng: Rng): void {
	shopOffers.value = pickShopOffers(state, rng).map(skill => ({ skill, price: skillPrice(skill, rng) }));
	shopCards.value = rollShopCards(rng);
	const treasure = rollTreasure(rng, state.treasures, ["common", "rare", "legendary"]);
	shopTreasure.value = treasure ? { treasure, price: treasurePrice(treasure, rng) } : null;
}

export function pickShopOffers(state: RunState, rng: Rng): SkillMeta[] {
	const pool = availableSkillPool(state);
	const offers: SkillMeta[] = [];
	while (offers.length < 2 && pool.length) {
		offers.push(pool.splice(rng.int(pool.length), 1)[0]);
	}
	return offers;
}

export function mountMetaUI(): MetaUI {
	ui.arena.style.display = "none";
	const container = ui.create.div("#rogue-meta", ui.window);
	const app = createApp({
		render: () => {
			void tick.value;
			if (slotPrompt.value) return renderLayer(renderSlotPrompt(slotPrompt.value));
			if (deckPrompt.value) return renderLayer(renderDeckPrompt(deckPrompt.value));
			if (deckView.value) return renderLayer(renderDeckView());
			if (slotView.value) return renderLayer(renderSlotView());
			if (treasureView.value) return renderLayer(renderTreasureView());
			return renderLayer(renderView(view.value));
		},
	});
	app.mount(container);

	return {
		start(hasSave) {
			return new Promise(resolve => {
				view.value = { kind: "start", hasSave, resolve };
			});
		},
		chooseNode(map, state) {
			return new Promise(resolve => {
				view.value = { kind: "map", map, state, resolve };
			});
		},
		offerReward(offers, gold, state) {
			return new Promise(resolve => {
				view.value = { kind: "reward", offers, gold, state, resolve };
			});
		},
		offerTreasure(treasure, state) {
			return new Promise(resolve => {
				view.value = { kind: "treasure", treasure, state, resolve };
			});
		},
		chooseEventOption(def, state) {
			return new Promise(resolve => {
				view.value = { kind: "event", def, state, resolve };
			});
		},
		promptRemoveCard(state, title) {
			return new Promise(resolve => {
				deckPrompt.value = {
					title,
					complete: index => {
						removeCardAt(state, index);
						deckPrompt.value = null;
						resolve(true);
					},
					cancel: () => {
						deckPrompt.value = null;
						resolve(false);
					},
				};
			});
		},
		openShop(state, rng) {
			return new Promise(resolve => {
				rollShopStock(state, rng);
				view.value = { kind: "shop", state, rng, resolve };
			});
		},
		openRest(state) {
			return new Promise(resolve => {
				view.value = { kind: "rest", state, resolve };
			});
		},
		showChapterClear(chapter, state) {
			return new Promise(resolve => {
				view.value = { kind: "chapter", chapter, state, resolve };
			});
		},
		showRunResult(result, state) {
			return new Promise(resolve => {
				view.value = { kind: "result", result, state, resolve };
			});
		},
		setVisible(visible: boolean) {
			container.style.display = visible ? "" : "none";
		},
		refresh() {
			tick.value++;
		},
		dispose() {
			app.unmount();
			container.remove();
		},
	};
}
