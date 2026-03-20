const { getEventSummary } = require('./src/utils/eventHelpers.js');

const events = [{ EventID: 'Event_Fixed0', EventType: 'Fixed', StartNodeID: 'NodeF000' }];
const nodes = [{ NodeID: 'NodeF000', LinkedEventID: 'Event_Fixed0', ChoiceIDs: ['ChoiceF0000'] }];
const choices = [{ ChoiceID: 'ChoiceF0000', LinkedNodeID: 'NodeF000', OnSelectAction: 'ShowNextNode_NodeF000_100', ActiveTooltipValue: '' }];

const clipboard = {
    type: 'event',
    event: events[0],
    nodes: nodes,
    choices: choices
};

const selectedEventId = 'Event_Fixed0';
const targetType = events.find(e => e.EventID === selectedEventId)?.EventType || 'Fixed';

const existingIndices = events
    .filter(e => e.EventType === targetType)
    .map(e => parseInt(e.EventID.match(/\d+$/)[0]))
    .sort((a, b) => a - b);

let newIndex = 0;
for (const index of existingIndices) {
    if (index === newIndex) newIndex++; else break;
}

const newEventId = `Event_${targetType}${newIndex}`;
const newEventSummary = getEventSummary(newEventId);
const oldEventSummary = getEventSummary(clipboard.event.EventID);

console.log('newEventId:', newEventId);
console.log('newEventSummary:', newEventSummary);
console.log('oldEventSummary:', oldEventSummary);

const idMap = {};
idMap[clipboard.event.EventID] = newEventId;

const newNodes = clipboard.nodes.map(node => {
    const oldNodeId = node.NodeID;
    const newNodeId = oldNodeId.replace(`Node${oldEventSummary}`, `Node${newEventSummary}`);
    idMap[oldNodeId] = newNodeId;
    return {
        ...node,
        NodeID: newNodeId,
        LinkedEventID: newEventId,
        ChoiceIDs: []
    };
});

const newChoices = clipboard.choices.map(choice => {
    const oldChoiceId = choice.ChoiceID;
    const newChoiceId = oldChoiceId.replace(`Choice${oldEventSummary}`, `Choice${newEventSummary}`);
    idMap[oldChoiceId] = newChoiceId;
    
    const oldLinkedNodeId = choice.LinkedNodeID;
    const newLinkedNodeId = idMap[oldLinkedNodeId];

    const parentNode = newNodes.find(n => n.NodeID === newLinkedNodeId);
    if(parentNode) parentNode.ChoiceIDs.push(newChoiceId);

    return {
        ...choice,
        ChoiceID: newChoiceId,
        LinkedNodeID: newLinkedNodeId,
    };
});

const replaceIdsInString = (str) => {
    if (!str) return str;
    let newStr = str;
    for (const oldId in idMap) {
        newStr = newStr.split(oldId).join(idMap[oldId]);
    }
    return newStr;
};

newChoices.forEach(choice => {
    choice.OnSelectAction = replaceIdsInString(choice.OnSelectAction);
    choice.ActiveTooltipValue = replaceIdsInString(choice.ActiveTooltipValue);
});

const newEvent = {
    ...clipboard.event,
    EventID: newEventId,
    EventType: targetType,
    StartNodeID: idMap[clipboard.event.StartNodeID] || ""
};

console.log("newEvent:", newEvent);
console.log("newNodes:", JSON.stringify(newNodes, null, 2));
console.log("newChoices:", JSON.stringify(newChoices, null, 2));
