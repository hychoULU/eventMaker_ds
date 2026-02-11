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
    // To avoid replacing parts of IDs (e.g., Event_Fixed1 replacing in Event_Fixed10),
    // we sort keys by length descending.
    const sortedOldIds = Object.keys(idMap).sort((a, b) => b.length - a.length);
    for (const oldId of sortedOldIds) {
        // Use a regex with word boundary on the right to be safer, but splitting/joining is most robust.
        newStr = newStr.split(oldId).join(idMap[oldId]);
    }
    return newStr;
};

/**
 * Re-indexes events, nodes, and choices after an event has been deleted.
 * @param {string} deletedEventId The ID of the event that was deleted.
 * @param {Array} currentEvents Array of all current events.
 * @param {Array} currentNodes Array of all current nodes.
 * @param {Array} currentChoices Array of all current choices.
 * @returns {object} An object containing the new state: { newEvents, newNodes, newChoices }.
 */
export const reindexDataAfterDeletion = (deletedEventId, currentEvents, currentNodes, currentChoices) => {
    const deletedEvent = currentEvents.find(e => e.EventID === deletedEventId);
    if (!deletedEvent) {
        return { newEvents: currentEvents, newNodes: currentNodes, newChoices: currentChoices };
    }

    const { EventType } = deletedEvent;
    const deletedIndex = parseInt(deletedEventId.match(/\d+$/)[0]);

    // 1. Filter out the deleted event and its children
    let newEvents = currentEvents.filter(e => e.EventID !== deletedEventId);
    const nodesToDelete = currentNodes.filter(n => n.LinkedEventID === deletedEventId).map(n => n.NodeID);
    let newNodes = currentNodes.filter(n => n.LinkedEventID !== deletedEventId);
    let newChoices = currentChoices.filter(c => !nodesToDelete.includes(c.LinkedNodeID));

    // 2. Identify events that need re-indexing
    const eventsToReindex = newEvents
        .filter(e => e.EventType === EventType && parseInt(e.EventID.match(/\d+$/)[0]) > deletedIndex)
        .sort((a, b) => parseInt(a.EventID.match(/\d+$/)[0]) - parseInt(b.EventID.match(/\d+$/)[0]));

    if (eventsToReindex.length === 0) {
         return { newEvents, newNodes, newChoices };
    }

    // 3. Build a comprehensive ID map for all changes
    const idMap = {};

    eventsToReindex.forEach(event => {
        const oldEventId = event.EventID;
        const oldIndex = parseInt(oldEventId.match(/\d+$/)[0]);
        const newIndex = oldIndex - 1;
        const newEventId = `Event_${EventType}${newIndex}`;
        idMap[oldEventId] = newEventId;

        const oldEventSummary = getEventSummary(oldEventId);
        const newEventSummary = getEventSummary(newEventId);
        
        const eventNodes = newNodes.filter(n => n.LinkedEventID === oldEventId);
        eventNodes.forEach(node => {
            const oldNodeId = node.NodeID;
            const newNodeId = oldNodeId.replace(`Node${oldEventSummary}`, `Node${newEventSummary}`);
            idMap[oldNodeId] = newNodeId;

            const nodeChoices = newChoices.filter(c => c.LinkedNodeID === oldNodeId);
            nodeChoices.forEach(choice => {
                const oldChoiceId = choice.ChoiceID;
                const newChoiceId = oldChoiceId.replace(`Choice${oldEventSummary}`, `Choice${newEventSummary}`);
                idMap[oldChoiceId] = newChoiceId;
            });
        });
    });

    // 4. Apply the ID map to the entire dataset
    newEvents = newEvents.map(event => {
        const newEventId = idMap[event.EventID] || event.EventID;
        return {
            ...event,
            EventID: newEventId,
            StartNodeID: idMap[event.StartNodeID] || event.StartNodeID,
        };
    });

    newNodes = newNodes.map(node => {
        const newNodeId = idMap[node.NodeID] || node.NodeID;
        const newLinkedEventId = idMap[node.LinkedEventID] || node.LinkedEventID;
        return {
            ...node,
            NodeID: newNodeId,
            LinkedEventID: newLinkedEventId,
            ChoiceIDs: node.ChoiceIDs.map(cid => idMap[cid] || cid),
        };
    });

    newChoices = newChoices.map(choice => {
        const newChoiceId = idMap[choice.ChoiceID] || choice.ChoiceID;
        const newLinkedNodeId = idMap[choice.LinkedNodeID] || choice.LinkedNodeID;
        return {
            ...choice,
            ChoiceID: newChoiceId,
            LinkedNodeID: newLinkedNodeId,
            OnSelectAction: replaceIdsInString(choice.OnSelectAction, idMap),
            ActiveTooltipValue: replaceIdsInString(choice.ActiveTooltipValue, idMap),
        };
    });
    
    return { newEvents, newNodes, newChoices };
};
