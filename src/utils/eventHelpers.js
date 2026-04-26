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

const LEGACY_NODE_TYPE_EXPEDITION_QUEST = 'ExpeditionQuest';

export function normalizeNodeType(nodeType) {
    return nodeType === LEGACY_NODE_TYPE_EXPEDITION_QUEST ? NODE_TYPE_DECISION_QUEST : nodeType;
}

export function isDecisionQuestNodeType(nodeType) {
    return normalizeNodeType(nodeType) === NODE_TYPE_DECISION_QUEST;
}

export function getNodeChoiceLimit(nodeType) {
    return isDecisionQuestNodeType(nodeType) ? 50 : 3;
}
