import { useCallback } from 'react';
import { getEventSummary, getNodeChoiceLimit } from '../utils/eventHelpers.js';

export const useEventActions = (events, setEvents, nodes, setNodes, choices, setChoices, selectedEventId, setSelectedEventId, setSelectedElement, recordHistory, showToast) => {
    const getSmallestAvailableNodeIndex = React.useCallback((depth) => {
        const existingIndices = nodes
            .filter(n => n.LinkedEventID === selectedEventId && n.depth === depth)
            .map(n => parseInt(n.NodeID.slice(-1)));
        for (let i = 0; i < 10; i++) { if (!existingIndices.includes(i)) return i; }
        return null;
    }, [nodes, selectedEventId]);

    const getSmallestAvailableChoiceIndex = React.useCallback((nodeId) => {
        const node = nodes.find(n => n.NodeID === nodeId);
        const limit = getNodeChoiceLimit(node?.NodeType);
        const prefix = nodeId.replace('Node', 'Choice');
        const existingIndices = choices
            .filter(c => c.LinkedNodeID === nodeId)
            .map(c => {
                const idxStr = c.ChoiceID.replace(prefix, '');
                return parseInt(idxStr);
            })
            .filter(idx => !isNaN(idx));
        for (let i = 0; i < limit; i++) { if (!existingIndices.includes(i)) return i; }
        return null;
    }, [choices, nodes]);

    const createEvent = React.useCallback((type) => {
        recordHistory();
        const existingIndices = events
            .filter(e => e.EventType === type)
            .map(e => parseInt(e.EventID.match(/\d+$/)[0]))
            .sort((a, b) => a - b);
        let newIndex = 0;
        for (const index of existingIndices) {
            if (index === newIndex) {
                newIndex++;
            } else {
                break;
            }
        }
        const id = `Event_${type}${newIndex}`;
        const startId = `Node${getEventSummary(id)}00`;
        const startChoiceId = `Choice${getEventSummary(id)}000`;
        
        const newEvent = { EventID: id, DevComment: "New Event", StartNodeID: startId, StartCondition: "None", TargetUnitCondition: "None", EventScope: "Scene", EventType: type, IsRepeatable: false, CoolDown: 0 };
        if (type === 'Random') {
            newEvent.Weight = 100;
            newEvent.IsAlertShow = false;
        }
        const startNode = { NodeID: startId, DevComment: "Start Point", IllustKey: "", LinkedEventID: id, NodeType: "Normal", ChoiceIDs: [startChoiceId], depth: 0 };
        const startChoice = { ChoiceID: startChoiceId, DevComment: "새 선택지", LinkedNodeID: startId, ActiveCondition: "None", OnSelectAction: "", ActiveTooltipType: "None", ActiveTooltipValue: "" };
        
        setEvents(prev => [...prev, newEvent]);
        setNodes(prev => [...prev, startNode]);
        setChoices(prev => [...prev, startChoice]);
        setSelectedEventId(id); 
        setSelectedElement({ type: 'event', id });
    }, [events, nodes, choices, setEvents, setNodes, setChoices, setSelectedEventId, setSelectedElement, recordHistory, getSmallestAvailableNodeIndex, getEventSummary]);

    const createNode = React.useCallback((depth) => {
        if (!selectedEventId || depth > 9) return;
        const currentDepthCount = nodes.filter(n => n.LinkedEventID === selectedEventId && n.depth === depth).length;
        if (currentDepthCount >= 10) { showToast("Depth limit (10) reached."); return; }
        recordHistory();
        const nodeIdx = getSmallestAvailableNodeIndex(depth);
        const nid = `Node${getEventSummary(selectedEventId)}${depth}${nodeIdx}`;

        const choiceIdx = 0; // Default first choice
        const cid = `Choice${getEventSummary(selectedEventId)}${depth}${nodeIdx}${choiceIdx}`;

        const newNode = { NodeID: nid, DevComment: "지문 내용을 입력하세요.", IllustKey: "", LinkedEventID: selectedEventId, NodeType: "Normal", ChoiceIDs: [cid], depth };
        const newChoice = { ChoiceID: cid, DevComment: "새 선택지", LinkedNodeID: nid, ActiveCondition: "None", OnSelectAction: "", ActiveTooltipType: "None", ActiveTooltipValue: "" };

        setNodes(prev => [...prev, newNode]);
        setChoices(prev => [...prev, newChoice]);
        setSelectedElement({ type: 'node', id: nid });
    }, [nodes, choices, selectedEventId, setNodes, setChoices, setSelectedElement, recordHistory, getSmallestAvailableNodeIndex, getEventSummary, showToast]);

    const createChoice = React.useCallback((nodeId) => {
        const node = nodes.find(n => n.NodeID === nodeId);
        if (!node) return;
        const limit = getNodeChoiceLimit(node.NodeType);
        if (node.ChoiceIDs.length >= limit) return;
        
        recordHistory();
        const idx = getSmallestAvailableChoiceIndex(nodeId);
        if (idx === null) {
            showToast(`Choice limit (${limit}) reached.`);
            return;
        }
        const cid = `Choice${getEventSummary(selectedEventId)}${nodeId.slice(-2)}${idx}`;
        setChoices(prev => [...prev, { ChoiceID: cid, DevComment: "새 선택지", LinkedNodeID: nodeId, ActiveCondition: "None", OnSelectAction: "", ActiveTooltipType: "None", ActiveTooltipValue: "" }]);
        setNodes(prev => prev.map(n => n.NodeID === nodeId ? { ...n, ChoiceIDs: [...n.ChoiceIDs, cid].sort() } : n));
        setSelectedElement({ type: 'choice', id: cid });
    }, [choices, nodes, selectedEventId, setChoices, setNodes, setSelectedElement, recordHistory, getSmallestAvailableChoiceIndex, getEventSummary, showToast]);

    return {
        getSmallestAvailableNodeIndex,
        getSmallestAvailableChoiceIndex,
        createEvent,
        createNode,
        createChoice
    };
};
