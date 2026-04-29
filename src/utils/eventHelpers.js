export function getEventSummary(eventId) {
    if (!eventId) return "E";
    const match = eventId.match(/_(Random|Fixed|Npc|Tutorial|Decision)(\d+)/);
    if (match && match[1] && match[2]) {
        const typeChar = match[1].charAt(0);
        const number = match[2];
        return `${typeChar}${number}`;
    }
    // Fallback for safety
    const parts = eventId.split('_');
    const typeChar = parts[1] ? parts[1].charAt(0) : "F";
    const numMatch = parts[1]?.match(/\d+/);
    return `${typeChar}${numMatch ? numMatch[0] : "0"}`;
}

export const NODE_TYPE_DECISION_QUEST = 'DecisionQuest';
export const NODE_TYPE_DECISION_END = 'DecisionEnd';

export const TOOLTIP_TYPE_NONE = 'None';
export const TOOLTIP_TYPE_SHOW_ACTION = 'ShowAction';
export const TOOLTIP_TYPE_SHOW_CHOICE_ACTION = 'ShowChoiceAction';
export const TOOLTIP_TYPE_PROBABILITY = 'Probability';
export const TOOLTIP_TYPE_SHOW_DECISION_REWARD = 'ShowDecisionReward';

const LEGACY_NODE_TYPE_EXPEDITION_QUEST = 'ExpeditionQuest';

export function normalizeNodeType(nodeType) {
    return nodeType === LEGACY_NODE_TYPE_EXPEDITION_QUEST ? NODE_TYPE_DECISION_QUEST : nodeType;
}

export function isDecisionQuestNodeType(nodeType) {
    return normalizeNodeType(nodeType) === NODE_TYPE_DECISION_QUEST;
}

export function isDecisionEndNodeType(nodeType) {
    return normalizeNodeType(nodeType) === NODE_TYPE_DECISION_END;
}

export function getNodeChoiceLimit(nodeType) {
    return isDecisionQuestNodeType(nodeType) ? 50 : 3;
}

export function normalizeChoiceTooltipType(tooltipType, parentNodeType) {
    if (tooltipType === TOOLTIP_TYPE_SHOW_DECISION_REWARD && !isDecisionEndNodeType(parentNodeType)) {
        return TOOLTIP_TYPE_SHOW_ACTION;
    }
    return tooltipType || TOOLTIP_TYPE_NONE;
}

export function getChoiceTooltipOptions(parentNodeType) {
    const options = [
        TOOLTIP_TYPE_NONE,
        TOOLTIP_TYPE_SHOW_ACTION,
        TOOLTIP_TYPE_SHOW_CHOICE_ACTION,
        TOOLTIP_TYPE_PROBABILITY
    ];

    return isDecisionEndNodeType(parentNodeType)
        ? [...options, TOOLTIP_TYPE_SHOW_DECISION_REWARD]
        : options;
}

export function normalizeChoicesForParentNodeTypes(choices, nodes) {
    const nodeTypeById = nodes.reduce((result, node) => {
        result[node.NodeID] = node.NodeType;
        return result;
    }, {});

    return choices.map(choice => {
        const activeTooltipType = normalizeChoiceTooltipType(
            choice.ActiveTooltipType,
            nodeTypeById[choice.LinkedNodeID]
        );

        return activeTooltipType === choice.ActiveTooltipType
            ? choice
            : { ...choice, ActiveTooltipType: activeTooltipType };
    });
}
