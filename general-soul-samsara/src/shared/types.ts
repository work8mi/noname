/** 敌人意图类型。 */
export type IntentType = "attack" | "defend" | "charge" | "discard" | "judge" | "summon" | "seal";

export interface Intent {
	type: IntentType;
	/** 攻击类意图的伤害参数（例如蓄力后的加值）。 */
	value?: number;
	/** 召唤类意图要生成的敌人。 */
	summon?: EnemyDef;
}

export interface IntentContext {
	hp: number;
	maxHp: number;
	charge: number;
	turn: number;
}

export interface IntentEntry {
	type: IntentType;
	weight: number;
	/** 仅当条件满足时参与抽取。 */
	when?: (context: IntentContext) => boolean;
	value?: number;
	/** 召唤类意图的目标配置。 */
	summon?: EnemyDef;
}

/** 敌人词缀。 */
export type AffixId = "tiejia" | "kuangbao" | "hudun" | "xipai" | "yaoshu" | "zhaohuan";

export interface EnemyDef {
	/** 内部 id（同时用于注册武将）。 */
	id: string;
	name: string;
	hp: number;
	affixes: AffixId[];
	intents: IntentEntry[];
	/** 敌方牌表（卡牌 id 列表，抽空后重洗）。 */
	deck: string[];
	/** 多阶段首领：体力比例跌破阈值时切换意图并获得强化。 */
	phases?: EnemyPhase[];
}

export interface EnemyPhase {
	/** 阶段展示名（切换时弹出）。 */
	label: string;
	/** 当前体力比例 ≤ 该值时进入此阶段。 */
	threshold: number;
	intents: IntentEntry[];
	/** 进入阶段后攻击的额外伤害。 */
	damageBonus?: number;
}

export type SkillQuality = "common" | "rare" | "legendary";

export interface SkillMeta {
	id: string;
	name: string;
	kind: "active" | "passive";
	tags: string[];
	quality: SkillQuality;
	/** Lv2、Lv3 的强化说明（M0 仅展示，数值后续接入）。 */
	levels: [string, string];
}

export interface DeckCard {
	name: string;
	count: number;
}

/** 单局牌组里的一张牌。 */
export interface DeckEntry {
	name: string;
	upgraded?: boolean;
}

/** 通用槽内技能的战斗配置。 */
export interface SkillSlotPlan {
	id: string;
	level: number;
}

/** 一场战斗的配置。 */
export interface BattlePlan {
	playerCharacter: string;
	playerDeck: DeckEntry[];
	enemies: EnemyDef[];
	seed: string;
	/** 本场战斗生效的宝物（引擎技能在开战时安装）。 */
	treasures: string[];
	/** 通用槽内的技能（含融合/进化产物与等级），开战时安装到玩家身上。 */
	skills: SkillSlotPlan[];
	/** 主动槽技能 id（供敌人「封印」意图选取目标）。 */
	activeSkills: string[];
}
