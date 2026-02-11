import { getEventSummary } from './eventHelpers.js';

/**
 * Updates all references to old IDs within a given string based on a provided ID map.
 * This is used to update properties like OnSelectAction and ActiveTooltipValue.
 * @param {string} str The string to update.
 * @param {object} idMap A map of oldId -> newId.
 * @returns {string} The updated string.
 */
const replaceIdsInString = (str, idMap) => {
    if (!str) return str;
    let newStr = str;
    const sortedOldIds = Object.keys(idMap).sort((a, b) => b.length - a.length);
    for (const oldId of sortedOldIds) {
        newStr = newStr.split(oldId).join(idMap[oldId]);
    }
    return newStr;
};

/**
 * Re-indexes all data associated with an event drag-and-drop operation.
 * Handles both reordering within the same type and moving to a different type.
 * @param {string} draggedEventId The ID of the event being dragged.
 * @param {string|null} targetEventId The ID of the event being dropped on, or null if dropped on a category.
 * @param {string} newType The target event type (e.g., 'Fixed', 'Random').
 * @param {Array} allEvents The complete list of events.
 * @param {Array} allNodes The complete list of nodes.
 * @param {Array} allChoices The complete list of choices.
 * @returns {{newEvents: Array, newNodes: Array, newChoices: Array, updatedSelectedEventId: string}}
 */
export const reindexDataAfterDrag = (draggedEventId, targetEventId, newType, allEvents, allNodes, allChoices) => {
    // 1. Create a mutable copy of the events array
    const reorderedEvents = JSON.parse(JSON.stringify(allEvents));

    // 2. Find and remove the dragged event
    const draggedEventIndex = reorderedEvents.findIndex(e => e.EventID === draggedEventId);
    if (draggedEventIndex === -1) return { newEvents: allEvents, newNodes: allNodes, newChoices: allChoices, updatedSelectedEventId: draggedEventId };
    const [draggedEvent] = reorderedEvents.splice(draggedEventIndex, 1);
    
    const originalType = draggedEvent.EventType;
    draggedEvent.EventType = newType;

    // 3. Find the correct insertion index and insert the event
    let targetIndex = -1;
    if (targetEventId) {
        targetIndex = reorderedEvents.findIndex(e => e.EventID === targetEventId);
    }

    if (targetIndex !== -1) {
        reorderedEvents.splice(targetIndex, 0, draggedEvent);
    } else {
        let lastIndexOfType = -1;
        for (let i = reorderedEvents.length - 1; i >= 0; i--) {
            if (reorderedEvents[i].EventType === newType) {
                lastIndexOfType = i;
                break;
            }
        }
        reorderedEvents.splice(lastIndexOfType + 1, 0, draggedEvent);
    }

    // 4. Build the ID map based on the new order
    const idMap = {};
    const typeCounters = {};

    reorderedEvents.forEach(event => {
        const eventType = event.EventType;
        typeCounters[eventType] = (typeCounters[eventType] || 0);
        
        const oldEventId = event.EventID;
        const newEventId = `Event_${eventType}${typeCounters[eventType]}`;
        
        if (oldEventId !== newEventId) {
            idMap[oldEventId] = newEventId;
        }
        
        typeCounters[eventType]++;
    });

    // 5. Build child ID maps
    allEvents.forEach(event => {
        const oldEventId = event.EventID;
        const newEventId = idMap[oldEventId];
        if (newEventId) {
            const oldEventSummary = getEventSummary(oldEventId);
            const newEventSummary = getEventSummary(newEventId);

            allNodes.filter(n => n.LinkedEventID === oldEventId).forEach(node => {
                const oldNodeId = node.NodeID;
                const newNodeId = oldNodeId.replace(`Node${oldEventSummary}`, `Node${newEventSummary}`);
                idMap[oldNodeId] = newNodeId;

                allChoices.filter(c => c.LinkedNodeID === oldNodeId).forEach(choice => {
                    const oldChoiceId = choice.ChoiceID;
                    const newChoiceId = oldChoiceId.replace(`Choice${oldEventSummary}`, `Choice${newEventSummary}`);
                    idMap[oldChoiceId] = newChoiceId;
                });
            });
        }
    });

    // 6. Apply the mappings to a deep copy of the original data
    let newEvents = JSON.parse(JSON.stringify(allEvents));
    let newNodes = JSON.parse(JSON.stringify(allNodes));
    let newChoices = JSON.parse(JSON.stringify(allChoices));
    
    newEvents = newEvents.map(e => {
        const wasDragged = e.EventID === draggedEventId;
        const needsTypeChange = wasDragged && originalType !== newType;
        return {
            ...e,
            EventID: idMap[e.EventID] || e.EventID,
            EventType: needsTypeChange ? newType : e.EventType,
            StartNodeID: idMap[e.StartNodeID] || e.StartNodeID
        };
    }).sort((a, b) => {
        const typeA = a.EventType, typeB = b.EventType;
        const indexA = parseInt(a.EventID.match(/\d+$/)[0]);
        const indexB = parseInt(b.EventID.match(/\d+$/)[0]);
        const typeOrder = ['Fixed', 'Random', 'Npc'];
        if(typeA !== typeB) return typeOrder.indexOf(typeA) - typeOrder.indexOf(typeB);
        return indexA - indexB;
    });

    newNodes = newNodes.map(n => ({
        ...n,
        NodeID: idMap[n.NodeID] || n.NodeID,
        LinkedEventID: idMap[n.LinkedEventID] || n.LinkedEventID,
        ChoiceIDs: n.ChoiceIDs.map(cid => idMap[cid] || cid)
    }));
    
    newChoices = newChoices.map(c => ({
        ...c,
        ChoiceID: idMap[c.ChoiceID] || c.ChoiceID,
        LinkedNodeID: idMap[c.LinkedNodeID] || c.LinkedNodeID,
        OnSelectAction: replaceIdsInString(c.OnSelectAction, idMap),
        ActiveTooltipValue: replaceIdsInString(c.ActiveTooltipValue, idMap)
    }));

    return {
        newEvents,
        newNodes,
        newChoices,
        updatedSelectedEventId: idMap[draggedEventId] || draggedEventId
    };
};
