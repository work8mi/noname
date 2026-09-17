import { RECIPES, type RecipeDef } from "../data/recipes";
import { slotList, type RunSkill, type RunState } from "./state";

export interface OwnedSkillSlot {
	kind: "active" | "passive";
	index: number;
	skill: RunSkill;
}

/** 在通用槽中查找技能。 */
export function findSkillSlot(state: RunState, skillId: string): OwnedSkillSlot | undefined {
	for (const kind of ["active", "passive"] as const) {
		const list = slotList(state, kind);
		const index = list.findIndex(skill => skill?.id === skillId);
		if (index >= 0) return { kind, index, skill: list[index] as RunSkill };
	}
	return undefined;
}

/** 配方是否可用：输入齐全、等级达标、产物未拥有。 */
export function canApplyRecipe(state: RunState, recipe: RecipeDef): boolean {
	const slots = recipe.inputs.map(input => findSkillSlot(state, input));
	if (slots.some(slot => !slot)) return false;
	if (recipe.minLevel && slots.some(slot => (slot as OwnedSkillSlot).skill.level < recipe.minLevel)) return false;
	return !findSkillSlot(state, recipe.output.id);
}

export function availableRecipes(state: RunState): RecipeDef[] {
	return RECIPES.filter(recipe => canApplyRecipe(state, recipe));
}

/**
 * 执行配方：消耗输入技能，把产物放入第一个输入所在的槽位。
 *
 * 进化保留输入技能的等级；融合产物固定 1 级。
 */
export function applyRecipe(state: RunState, recipe: RecipeDef): boolean {
	if (!canApplyRecipe(state, recipe)) return false;
	const first = findSkillSlot(state, recipe.inputs[0]) as OwnedSkillSlot;
	for (const input of recipe.inputs) {
		const slot = findSkillSlot(state, input);
		if (slot) slotList(state, slot.kind)[slot.index] = null;
	}
	slotList(state, first.kind)[first.index] = {
		id: recipe.output.id,
		level: recipe.kind === "evolution" ? first.skill.level : 1,
	};
	return true;
}
