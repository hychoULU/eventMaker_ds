export const EVENT_TYPE_CONFIGS = [
    {
        type: 'Fixed',
        summary: 'F',
        description: "고정된 시점에 등장 하는 이벤트. 발생 조건을 만족 시켰다면, 그 시점에 즉시 호출 한다.Ex) 스토리 이벤트, 퀘스트 종료시 이벤트..."
    },
    {
        type: 'Event',
        summary: 'E',
        description: "Event는 빌드마다 있는 이벤트용. 시즌이 지나면 이벤트 결과를 유지하지 않는다."
    },
    {
        type: 'Random',
        summary: 'R',
        description: "캠페인 타임에 따라 발생 하는 이벤트 풀. 랜덤 이벤트 발생 시점에, 조건을 만족 시켰다면 발생 풀에 넣어서 제비뽑기 한다.Ex) 천색조 이벤트…"
    },
    {
        type: 'Npc',
        summary: 'N',
        description: "NPC와 관련된 고정 이벤트."
    },
    {
        type: 'Tutorial',
        summary: 'T',
        description: "튜토리얼과 관련된 이벤트."
    },
    {
        type: 'Decision',
        summary: 'D',
        description: "사용자의 결정을 요구하는 이벤트.",
        isDecisionFamily: true
    },
    {
        type: 'DecisionResult',
        summary: 'DR',
        description: "Decision의 결과용 이벤트. 다른 이벤트는 일단 넣지 말것",
        isDecisionFamily: true
    }
];

export const EVENT_TYPES = EVENT_TYPE_CONFIGS.map(config => config.type);
export const EVENT_TYPE_ORDER = EVENT_TYPES;

const EVENT_TYPE_CONFIG_BY_TYPE = EVENT_TYPE_CONFIGS.reduce((result, config) => {
    result[config.type] = config;
    return result;
}, {});

function getEventTypeSummary(eventType) {
    if (!eventType) return 'F';

    if (EVENT_TYPE_CONFIG_BY_TYPE[eventType]?.summary) {
        return EVENT_TYPE_CONFIG_BY_TYPE[eventType].summary;
    }

    const upperChars = eventType.match(/[A-Z]/g);
    if (upperChars && upperChars.length > 0) {
        return upperChars.join('');
    }

    return eventType.charAt(0).toUpperCase();
}

export function getEventSummary(eventId) {
    if (!eventId) return "E";
    const match = eventId.match(/^Event_([A-Za-z]+)(\d+)$/);
    if (match && match[1] && match[2]) {
        const eventType = match[1];
        const number = match[2];
        return `${getEventTypeSummary(eventType)}${number}`;
    }

    const parts = eventId.split('_');
    const eventTypeWithNumber = parts[1] || "";
    const eventType = eventTypeWithNumber.replace(/\d+$/, "");
    const numMatch = eventTypeWithNumber.match(/\d+$/);
    return `${getEventTypeSummary(eventType)}${numMatch ? numMatch[0] : "0"}`;
}

export function getEventTypeDescription(eventType) {
    return EVENT_TYPE_CONFIG_BY_TYPE[eventType]?.description || "";
}

export function isDecisionEventType(eventType) {
    return Boolean(EVENT_TYPE_CONFIG_BY_TYPE[eventType]?.isDecisionFamily);
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
