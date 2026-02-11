import React, { useEffect, useCallback, useMemo } from 'react';

import { initGoogleApis, executeAfterAuth, uploadToDrive, loadFromDrive } from './utils/DriveApi.js';
import Icon from './components/Icon.js';
import PropField from './components/PropField.js';
import { getEventSummary } from './utils/eventHelpers.js';
import { useEventActions } from './hooks/useEventActions.js';
import { useGlobalStates } from './hooks/useGlobalStates.js';
import { reindexDataAfterDrag } from './utils/eventDragDrop.js';
import { reindexDataAfterDeletion } from './utils/eventReindexing.js';

const App = () => {
    const {
        events, setEvents, nodes, setNodes, choices, setChoices, selectedEventId, setSelectedEventId,
        selectedElement, setSelectedElement, viewMode, setViewMode, deleteModal, setDeleteModal,
        showImportModal, setShowImportModal, importText, setImportText, toast, setToast,
        gapiInitialized, setGapiInitialized, gisInited, setGisInited, editingNodeCommentId, setEditingNodeCommentId,
        editingChoiceCommentId, setEditingChoiceCommentId, editingEventCommentId, setEditingEventCommentId,
        editingWeightData, setEditingWeightData, tempValue, setTempValue, tooltip, setTooltip,
        draggingChoiceId, setDraggingChoiceId, dropTargetId, setDropTargetId, ctxMenu, setCtxMenu,
        clipboard, setClipboard, collapsedSections, setCollapsedSections, searchQuery, setSearchQuery,
        canvasRef, elementRefs, editingElementRef, hasAutoLoaded, undoStack, setUndoStack, redoStack, setRedoStack,
        showToast, recordHistory
    } = useGlobalStates();

    const [draggingEventId, setDraggingEventId] = React.useState(null);

    const {
        createEvent,
        createNode,
        createChoice
    } = useEventActions(events, setEvents, nodes, setNodes, choices, setChoices, selectedEventId, setSelectedEventId, setSelectedElement, recordHistory, showToast);

    const handleLoadFromDrive = React.useCallback(() => {
        executeAfterAuth(() => loadFromDrive(setEvents, setNodes, setChoices, setSelectedEventId, showToast, recordHistory, gapiInitialized, gisInited), showToast, gapiInitialized, gisInited);
    }, [setEvents, setNodes, setChoices, setSelectedEventId, showToast, recordHistory, gapiInitialized, gisInited]);

    // Google API Initialization
    React.useEffect(() => {
        return initGoogleApis(setGapiInitialized, setGisInited, showToast, handleLoadFromDrive);
    }, [setGapiInitialized, setGisInited, showToast]);

    // Auto-load from Drive on init
    React.useEffect(() => {
        if (gapiInitialized && gisInited && !hasAutoLoaded.current) {
            console.log("🚀 페이지 로드 완료: 구글 드라이브에서 파일 불러오기 시도");
            hasAutoLoaded.current = true;
            handleLoadFromDrive();
        }
    }, [gapiInitialized, gisInited, hasAutoLoaded, handleLoadFromDrive]);

    const handleUploadToDrive = React.useCallback(() => {
        executeAfterAuth(() => uploadToDrive(events, nodes, choices, showToast), showToast, gapiInitialized, gisInited);
    }, [events, nodes, choices, showToast, gapiInitialized, gisInited]);

    const saveDevComment = React.useCallback(() => {
        if (editingNodeCommentId) {
            const node = nodes.find(n => n.NodeID === editingNodeCommentId);
            if (node && tempValue !== node.DevComment) {
                recordHistory();
                setNodes(prev => prev.map(n => n.NodeID === editingNodeCommentId ? {...n, DevComment: tempValue} : n));
            }
            setEditingNodeCommentId(null);
            setTempValue("");
        } else if (editingChoiceCommentId) {
            const choice = choices.find(c => c.ChoiceID === editingChoiceCommentId);
            if (choice && tempValue !== choice.DevComment) {
                recordHistory();
                setChoices(prev => prev.map(c => c.ChoiceID === editingChoiceCommentId ? {...c, DevComment: tempValue} : c));
            }
            setEditingChoiceCommentId(null);
            setTempValue("");
        } else if (editingEventCommentId) {
            const event = events.find(e => e.EventID === editingEventCommentId);
            if (event && tempValue !== event.DevComment) {
                recordHistory();
                setEvents(prev => prev.map(e => e.EventID === editingEventCommentId ? {...e, DevComment: tempValue} : e));
            }
            setEditingEventCommentId(null);
            setTempValue("");
        }
    }, [editingNodeCommentId, editingChoiceCommentId, editingEventCommentId, tempValue, nodes, choices, events, recordHistory, setNodes, setChoices, setEvents]);

    const performUndo = React.useCallback(() => {
        if (undoStack.length === 0) return;
        const prevSnapshot = JSON.parse(undoStack[undoStack.length - 1]);
        setRedoStack(prev => [...prev, JSON.stringify({ events, nodes, choices })]);
        setUndoStack(prev => prev.slice(0, -1));
        setEvents(prevSnapshot.events); setNodes(prevSnapshot.nodes); setChoices(prevSnapshot.choices);
        showToast("Undo Successful");
    }, [undoStack, events, nodes, choices, showToast, setEvents, setNodes, setChoices, setRedoStack, setUndoStack]);

    const performRedo = React.useCallback(() => {
        if (redoStack.length === 0) return;
        const nextSnapshot = JSON.parse(redoStack[redoStack.length - 1]);
        setUndoStack(prev => [...prev, JSON.stringify({ events, nodes, choices })]);
        setRedoStack(prev => prev.slice(0, -1));
        setEvents(nextSnapshot.events); setNodes(nextSnapshot.nodes); setChoices(nextSnapshot.choices);
        showToast("Redo Successful");
    }, [redoStack, events, nodes, choices, showToast, setEvents, setNodes, setChoices, setRedoStack, setUndoStack]);

    const handleCopy = React.useCallback(() => {
        if (selectedElement && selectedElement.type === 'event') {
            const eventToCopy = events.find(e => e.EventID === selectedElement.id);
            if (eventToCopy) {
                const nodesToCopy = nodes.filter(n => n.LinkedEventID === eventToCopy.EventID);
                const nodeIdsToCopy = nodesToCopy.map(n => n.NodeID);
                const choicesToCopy = choices.filter(c => nodeIdsToCopy.includes(c.LinkedNodeID));
                
                setClipboard({
                    type: 'event',
                    event: JSON.parse(JSON.stringify(eventToCopy)),
                    nodes: JSON.parse(JSON.stringify(nodesToCopy)),
                    choices: JSON.parse(JSON.stringify(choicesToCopy)),
                });
                showToast("Event copied!");
            }
        }
    }, [selectedElement, events, nodes, choices, showToast, setClipboard]);

    const handlePaste = React.useCallback(() => {
        if (!clipboard || clipboard.type !== 'event') return;

        recordHistory();

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

        setEvents(prev => [...prev, newEvent]);
        setNodes(prev => [...prev, ...newNodes]);
        setChoices(prev => [...prev, ...newChoices]);
        setSelectedEventId(newEventId);
        showToast("Event pasted!");

    }, [clipboard, events, nodes, choices, selectedEventId, recordHistory, showToast, getEventSummary, setEvents, setNodes, setChoices, setSelectedEventId]);
    
    const handleEventDragStart = (e, eventId) => {
        setDraggingEventId(eventId);
        e.dataTransfer.setData("text/plain", eventId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleEventDragOver = (e) => {
        e.preventDefault();
    };

    const handleEventDrop = (e, targetEventId, targetType) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedEventId = draggingEventId;
        if (!draggedEventId || draggedEventId === targetEventId) {
            setDraggingEventId(null);
            return;
        }

        recordHistory();
        const { newEvents, newNodes, newChoices, updatedSelectedEventId } = reindexDataAfterDrag(
            draggedEventId,
            targetEventId,
            targetType,
            events,
            nodes,
            choices
        );

        setEvents(newEvents);
        setNodes(newNodes);
        setChoices(newChoices);
        setSelectedEventId(updatedSelectedEventId);
        showToast("Event moved successfully!");
        setDraggingEventId(null);
    };

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdCtrl = isMac ? e.metaKey : e.ctrlKey;

            const activeEl = document.activeElement;
            const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
            const isTextSelected = window.getSelection().toString() !== '';

            const canDoEventAction = selectedElement && selectedElement.type === 'event' && !isInputActive && !isTextSelected;

            if (cmdCtrl) {
                if (e.key.toLowerCase() === 'z') {
                    if (e.shiftKey) performRedo();
                    else performUndo();
                    e.preventDefault();
                } else if (e.key.toLowerCase() === 'y') {
                    performRedo();
                    e.preventDefault();
                } else if (e.key.toLowerCase() === 's') {
                    handleUploadToDrive();
                    e.preventDefault();
                } else if (e.key.toLowerCase() === 'c') {
                    if (canDoEventAction) {
                        handleCopy();
                        e.preventDefault();
                    }
                } else if (e.key.toLowerCase() === 'v') {
                    if (canDoEventAction) {
                        handlePaste();
                        e.preventDefault();
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [performUndo, performRedo, handleUploadToDrive, handleCopy, handlePaste, selectedElement]);

    const onChoiceDragStart = (e, choiceId) => { setDraggingChoiceId(choiceId); e.dataTransfer.setData("choiceId", choiceId); };

    const onNodeDragOver = (e, nodeId) => {
        e.preventDefault();
        const choice = choices.find(x => x.ChoiceID === draggingChoiceId);
        if (!choice) return;
    
        const targetNode = nodes.find(n => n.NodeID === nodeId);
        const sourceNode = nodes.find(n => n.NodeID === choice.LinkedNodeID);
    
        if (targetNode && sourceNode && targetNode.LinkedEventID === selectedEventId && targetNode.depth > sourceNode.depth) {
            setDropTargetId(nodeId);
        }
    };

    const onNodeDrop = (e, targetNodeId) => {
        e.preventDefault();
        const choiceId = draggingChoiceId;
        const choice = choices.find(x => x.ChoiceID === choiceId);
        if (!choice) {
            setDraggingChoiceId(null);
            setDropTargetId(null);
            return;
        }
    
        const targetNode = nodes.find(n => n.NodeID === targetNodeId);
        const sourceNode = nodes.find(n => n.NodeID === choice.LinkedNodeID);
    
        if (targetNode && sourceNode && targetNode.LinkedEventID === selectedEventId && targetNode.depth > sourceNode.depth) {
            recordHistory();
            const acts = (choice.OnSelectAction || "").split('\n').filter(a => a.trim() !== "");
            if (!acts.some(a => a.includes(targetNodeId))) {
                const updatedAction = [...acts, `ShowNextNode_${targetNodeId}_100`].join('\n');
                setChoices(prev => prev.map(x => x.ChoiceID === choiceId ? { ...x, OnSelectAction: updatedAction } : x));
            }
        }
        setDraggingChoiceId(null);
        setDropTargetId(null);
    };

    const onChoiceDrop = (e, targetChoiceId) => {
        e.stopPropagation(); e.preventDefault();
        const dragId = draggingChoiceId; const tC = choices.find(x => x.ChoiceID === targetChoiceId); const dC = choices.find(x => x.ChoiceID === dragId);
        if (!tC || !dC || dragId === targetChoiceId) { setDraggingChoiceId(null); setDropTargetId(null); return; }
        const depthS = nodes.find(n => n.NodeID === dC.LinkedNodeID).depth;
        const depthT = nodes.find(n => n.NodeID === tC.LinkedNodeID).depth;
        let src, tar;
        if (depthS < depthT) { src = dC; tar = tC; } else if (depthT < depthS) { src = tC; tar = dC; } else { showToast("Depth mismatch."); setDraggingChoiceId(null); return; }

        recordHistory();
        setChoices(prev => prev.map(c => {
            if (c.ChoiceID === src.ChoiceID) {
                let newType = c.ActiveTooltipType === "None" ? "ShowChoiceAction" : c.ActiveTooltipType;
                let newVal = c.ActiveTooltipValue;
                if (newType === "Probability") {
                    const list = newVal ? newVal.split(',').filter(id => id.trim() !== "") : [];
                    if (list.includes(tar.ChoiceID)) { showToast("Already registered."); return c; }
                    newVal = [...list, tar.ChoiceID].join(',');
                } else { newVal = tar.ChoiceID; }
                return { ...c, ActiveTooltipType: newType, ActiveTooltipValue: newVal };
            }
            return c;
        }));
        setDraggingChoiceId(null);
        setDropTargetId(null);
    };

    const handleChoiceHover = React.useCallback((e, choice) => {
        if (draggingChoiceId || editingChoiceCommentId) return;
        let content = "";
        if (choice.ActiveTooltipType === "ShowAction") content = choice.OnSelectAction || "No actions.";
        else if (choice.ActiveTooltipType === "ShowChoiceAction" && choice.ActiveTooltipValue) {
            content = choices.find(c => c.ChoiceID === choice.ActiveTooltipValue)?.OnSelectAction || "Ref Error";
        } else if (choice.ActiveTooltipType === "Probability" && choice.ActiveTooltipValue) {
            const tIds = choice.ActiveTooltipValue.split(',');
            const acts = (choice.OnSelectAction || "").split('\n');
            let totalW = 0;
            const weightMap = {};
            acts.forEach(a => {
                const m = a.match(/ShowNextNode_([Nodea-zA-Z0-9]+)_?(\d+)?/);
                if (m) {
                    totalW += parseInt(m[2]);
                    weightMap[m[1]] = parseInt(m[2]);
                }
            });
            content = tIds.map(tid => {
                const tc = choices.find(c => c.ChoiceID === tid);
                if (!tc) return null;
                const w = weightMap[tc.LinkedNodeID] || 0;
                const p = totalW > 0 ? Math.round(w / totalW * 100) : 0;
                return `(${p}%) ${tc.OnSelectAction || 'None'}`;
            }).filter(r => r).join('\n');
        }
        if (content) setTooltip({ show: true, x: e.clientX, y: e.clientY, content });
    }, [draggingChoiceId, editingChoiceCommentId, choices]);

    const saveWeightEdit = () => {
        if (!editingWeightData) return;
        recordHistory();
        const { choiceId, actionIndex } = editingWeightData;
        const newW = parseInt(tempValue) || 0;
        setChoices(prev => prev.map(c => {
            if (c.ChoiceID === choiceId) {
                const acts = (c.OnSelectAction || "").split('\n');
                const updated = acts.map((act, idx) => idx === actionIndex ? act.replace(/(ShowNextNode_[A-Za-z0-9]+)(_\d+)?$/, (m, p1) => `${p1}_${newW}`) : act);
                return { ...c, OnSelectAction: updated.join('\n') };
            }
            return c;
        }));
        setEditingWeightData(null);
    };

    const updateTooltipType = (choiceId, type) => {
        recordHistory();
        setChoices(choices.map(c => c.ChoiceID === choiceId ? {...c, ActiveTooltipType: type} : c));
        setCtxMenu({ show: false });
    };

    const disconnectNode = (choiceId, nodeId) => {
        recordHistory();
        setChoices(prev => prev.map(c => {
            if (c.ChoiceID === choiceId) {
                const acts = (c.OnSelectAction || "").split('\n');
                const newActs = acts.filter(act => !act.startsWith(`ShowNextNode_${nodeId}`));
                return { ...c, OnSelectAction: newActs.join('\n') };
            }
            return c;
        }));
        setCtxMenu({ show: false });
    };

    const executeDelete = () => {
        const { type, id } = deleteModal.show ? deleteModal : { type: ctxMenu.type, id: ctxMenu.id };
        if (type === 'node' && nodes.find(n => n.NodeID === id)?.depth === 0) {
            showToast("Cannot delete the root node.");
            setDeleteModal({ show: false });
            setCtxMenu({ show: false });
            return;
        }
        recordHistory();
    
        if (type === 'event') {
            const { newEvents, newNodes, newChoices } = reindexDataAfterDeletion(id, events, nodes, choices);
            setEvents(newEvents);
            setNodes(newNodes);
            setChoices(newChoices);
    
            if (selectedEventId === id) {
                const deletedEvent = events.find(e => e.EventID === id);
                const nextEvent = newEvents.find(e => e.EventType === deletedEvent.EventType);
                setSelectedEventId(nextEvent ? nextEvent.EventID : (newEvents[0]?.EventID || ""));
            }
        } else if (type === 'node') {
            const nodesToDelete = [id];
            const choicesToDelete = choices.filter(c => nodesToDelete.includes(c.LinkedNodeID)).map(c => c.ChoiceID);
            
            setNodes(nodes.filter(n => !nodesToDelete.includes(n.NodeID)));
            setChoices(choices.filter(c => !choicesToDelete.includes(c.ChoiceID)));
    
            // Also remove choice references from parent nodes
            const parentNodesToUpdate = nodes.filter(n => n.ChoiceIDs.some(cid => choicesToDelete.includes(cid)));
            if (parentNodesToUpdate.length > 0) {
                setNodes(currentNodes => currentNodes.map(n => {
                    if (parentNodesToUpdate.find(p => p.NodeID === n.NodeID)) {
                        return { ...n, ChoiceIDs: n.ChoiceIDs.filter(cid => !choicesToDelete.includes(cid)) };
                    }
                    return n;
                }));
            }
        } else if (type === 'choice') {
            const choiceToDelete = choices.find(c => c.ChoiceID === id);
            if (choiceToDelete) {
                setChoices(choices.filter(c => c.ChoiceID !== id));
                setNodes(nodes.map(n => 
                    n.NodeID === choiceToDelete.LinkedNodeID 
                        ? { ...n, ChoiceIDs: n.ChoiceIDs.filter(cid => cid !== id) } 
                        : n
                ));
            }
        }
    
        setDeleteModal({ show: false });
        setCtxMenu({ show: false });
        setSelectedElement(null);
    };

    const handleContextMenu = (e, type, id) => {
        e.preventDefault(); e.stopPropagation(); setCtxMenu({ show: true, x: e.clientX, y: e.clientY, type, id });
    };

    const nodesByDepthMemo = React.useMemo(() => {
        const group = {};
        nodes.filter(n => n.LinkedEventID === selectedEventId).forEach(n => {
            if (!group[n.depth]) group[n.depth] = [];
            group[n.depth].push(n);
        });
        Object.keys(group).forEach(d => group[d].sort((a, b) => a.NodeID.localeCompare(b.NodeID)));
        return group;
    }, [nodes, selectedEventId]);

    const maxDepthMemo = React.useMemo(() => {
        const depths = nodes.filter(n => n.LinkedEventID === selectedEventId).map(n => n.depth);
        return depths.length > 0 ? Math.max(...depths) : -1;
    }, [nodes, selectedEventId]);

    const [lines, setLines] = React.useState([]);
    const updateLines = React.useCallback(() => {
        const res = [];
        choices.forEach(choice => {
            const nodeOfChoice = nodes.find(n => n.NodeID === choice.LinkedNodeID);
            if (!nodeOfChoice || nodeOfChoice.LinkedEventID !== selectedEventId) return;
            const acts = (choice.OnSelectAction || "").split('\n');
            acts.forEach((act, idx) => {
                const m = act.match(/ShowNextNode_([Nodea-zA-Z0-9]+)_?(\d+)?/);
                if (m) {
                    const targetId = m[1], w = m[2] || "100";
                    const startEl = elementRefs.current[choice.ChoiceID], endEl = elementRefs.current[targetId];
                    if (startEl && endEl && canvasRef.current) {
                        const rectC = canvasRef.current.getBoundingClientRect();
                        const rectS = startEl.getBoundingClientRect(), rectE = endEl.getBoundingClientRect();
                        const x1 = rectS.right - rectC.left, y1 = rectS.top + rectS.height/2 - rectC.top;
                        const x2 = rectE.left - rectC.left, y2 = rectE.top + rectE.height/2 - rectC.top;
                        res.push({ id: `${choice.ChoiceID}-${targetId}-${idx}`, choiceId: choice.ChoiceID, actionIndex: idx, d: `M ${x1} ${y1} C ${x1 + (x2-x1)/2} ${y1}, ${x1 + (x2-x1)/2} ${y2}, ${x2} ${y2}`, weight: w, lx: (x1+x2)/2, ly: (y1+y2)/2 - 8 });
                    }
                }
            });
        });
        setLines(res);
    }, [choices, nodes, selectedEventId]);

    React.useEffect(() => { 
        updateLines(); 
        const obs = new ResizeObserver(() => updateLines()); 
        if (canvasRef.current) obs.observe(canvasRef.current); 
        return () => { obs.disconnect(); };
    }, [updateLines]);

    React.useEffect(() => {
        const closeCtx = () => { if(ctxMenu.show) setCtxMenu({ show: false }); };
        window.addEventListener('click', closeCtx);
        return () => window.removeEventListener('click', closeCtx);
    }, [ctxMenu.show]);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (editingNodeCommentId || editingChoiceCommentId || editingEventCommentId) {
                if (editingElementRef.current && !editingElementRef.current.contains(event.target)) {
                    saveDevComment();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside); 
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingNodeCommentId, editingChoiceCommentId, editingEventCommentId, saveDevComment]);

    const handleImport = () => {
        try {
            const data = JSON.parse(importText); recordHistory();
            const nS = data["Node시트"] || [], cS = data["Choice시트"] || [], eS = data["Event시트"] || [];
            const pN = nS.map(n => ({ ...n, depth: parseInt(n.NodeID.slice(-2, -1)) || 0 }));
            const pC = cS.map(c => {
                const uiAct = (c.OnSelectAction || "").replace(/,/g, '\n');
                let tT = "None", tV = "";
                if (c.ActiveTooltipType?.startsWith("ShowChoiceAction_")) { tT = "ShowChoiceAction"; tV = c.ActiveTooltipType.replace("ShowChoiceAction_", ""); }
                else if (c.ActiveTooltipType?.startsWith("Probability_")) { tT = "Probability"; tV = c.ActiveTooltipType.replace("Probability_", "").replace(/_/g, ','); }
                else if (c.ActiveTooltipType === "ShowAction") { tT = "ShowAction"; }
                return { ...c, OnSelectAction: uiAct, ActiveTooltipType: tT, ActiveTooltipValue: tV };
            });
            const pE = eS.map(e => ({
                ...e,
                TargetUnitCondition: (e.TargetUnitCondition || "").replace(/,/g, '\n')
            }));
            setEvents(pE); setNodes(pN); setChoices(pC);
            if (eS.length > 0) setSelectedEventId(eS[0].EventID);
            setShowImportModal(false); setImportText(""); showToast("Import Success");
        } catch (e) { alert("Import Failed"); }
    };

    const handleTabNavigation = React.useCallback((currentType, currentId) => {
        saveDevComment(); // Save current comment before navigating

        const allEventNodes = nodes
            .filter(n => n.LinkedEventID === selectedEventId)
            .sort((a, b) => {
                if (a.depth !== b.depth) return a.depth - b.depth;
                return a.NodeID.localeCompare(b.NodeID);
            });

        let nextElement = null;

        if (currentType === 'node') {
            const node = nodes.find(n => n.NodeID === currentId);
            if (node && node.ChoiceIDs.length > 0) {
                const firstChoiceId = node.ChoiceIDs.sort()[0];
                const firstChoice = choices.find(c => c.ChoiceID === firstChoiceId);
                if (firstChoice) {
                    nextElement = { type: 'choice', data: firstChoice };
                }
            }
        } else if (currentType === 'choice') {
            const choice = choices.find(c => c.ChoiceID === currentId);
            if (choice) {
                const parentNode = nodes.find(n => n.NodeID === choice.LinkedNodeID);
                if (parentNode) {
                    const sortedChoices = parentNode.ChoiceIDs.sort();
                    const currentIndex = sortedChoices.indexOf(currentId);
                    if (currentIndex < sortedChoices.length - 1) {
                        const nextChoiceId = sortedChoices[currentIndex + 1];
                        const nextChoice = choices.find(c => c.ChoiceID === nextChoiceId);
                        if (nextChoice) {
                            nextElement = { type: 'choice', data: nextChoice };
                        }
                    }
                }
            }
        }

        if (!nextElement) {
            const currentNodeId = currentType === 'node' ? currentId : choices.find(c => c.ChoiceID === currentId)?.LinkedNodeID;
            const currentNodeIndex = allEventNodes.findIndex(n => n.NodeID === currentNodeId);
            if (currentNodeIndex < allEventNodes.length - 1) {
                const nextNode = allEventNodes[currentNodeIndex + 1];
                nextElement = { type: 'node', data: nextNode };
            }
        }

        setEditingNodeCommentId(null);
        setEditingChoiceCommentId(null);
        
        if (nextElement) {
            setTimeout(() => {
                if (nextElement.type === 'node') {
                    setEditingNodeCommentId(nextElement.data.NodeID);
                    setTempValue(nextElement.data.DevComment);
                } else {
                    setEditingChoiceCommentId(nextElement.data.ChoiceID);
                    setTempValue(nextElement.data.DevComment);
                }
            }, 0);
        }
    }, [nodes, choices, selectedEventId, tempValue, recordHistory, saveDevComment, setEditingNodeCommentId, setEditingChoiceCommentId, setTempValue]);

    return (
        React.createElement("div", { className: "flex h-screen overflow-hidden select-none font-sans text-gray-800" },
            toast.show && React.createElement("div", { className: "toast" }, React.createElement(Icon, { name: "Info", size: 18 }), " ", toast.message),
            tooltip.show && React.createElement("div", { className: "tooltip bg-black/90 text-white text-[11px] px-3 py-2 rounded-xl shadow-2xl font-mono whitespace-pre-wrap max-w-xs animate-fadeIn border border-white/10", style: { left: tooltip.x + 10, top: tooltip.y + 10 } }, tooltip.content),
            


            ctxMenu.show && React.createElement("div", { className: "ctx-menu animate-fadeIn shadow-2xl", style: { left: ctxMenu.x, top: ctxMenu.y }, onClick: (e) => e.stopPropagation() },
                (ctxMenu.type === 'event') && React.createElement("button", { onClick: () => { setSelectedElement({type: 'event', id: ctxMenu.id}); handleCopy(); setCtxMenu({show: false}); }, className: "ctx-item" }, "Copy Event"),
                (ctxMenu.type === 'event' || ctxMenu.type === 'event-list') && React.createElement("button", { onClick: handlePaste, disabled: !clipboard, className: "ctx-item" }, "Paste Event"),
                
                (ctxMenu.type === 'event') && React.createElement("div", { className: "ctx-divider" }),

                !(ctxMenu.type === 'node' && nodes.find(n => n.NodeID === ctxMenu.id)?.depth === 0) && React.createElement("button", { onClick: executeDelete, className: "ctx-item danger transition-colors" }, React.createElement(Icon, { name: "Trash2", size: 14 }), " Delete"),
                ctxMenu.type === 'choice' && React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "ctx-divider" }),
                    React.createElement("button", { onClick: () => updateTooltipType(ctxMenu.id, 'ShowAction'), className: "ctx-item" }, "ToolTip : Self"),
                    React.createElement("button", { onClick: () => updateTooltipType(ctxMenu.id, 'ShowChoiceAction'), className: "ctx-item" }, "ToolTip : Choice"),
                    React.createElement("button", { onClick: () => updateTooltipType(ctxMenu.id, 'Probability'), className: "ctx-item" }, "ToolTip : Probability"),
                    React.createElement("button", { onClick: () => updateTooltipType(ctxMenu.id, 'None'), className: "ctx-item opacity-50" }, "ToolTip : None"),
                    
                    (() => {
                        const choice = choices.find(c => c.ChoiceID === ctxMenu.id);
                        const connectedNodes = (choice?.OnSelectAction || "").split('\n')
                            .map(act => act.match(/ShowNextNode_([a-zA-Z0-9]+)/))
                            .filter(Boolean)
                            .map(match => match[1]);
                        
                        if (connectedNodes.length > 0) {
                            return React.createElement(React.Fragment, null,
                                React.createElement("div", { className: "ctx-divider" }),
                                connectedNodes.map(nodeId => 
                                    React.createElement("button", { key: nodeId, onClick: () => disconnectNode(ctxMenu.id, nodeId), className: "ctx-item" }, "해제 : ", nodeId)
                                )
                            );
                        }
                        return null;
                    })()
                )
            ),

            editingWeightData && React.createElement("div", { className: "weight-input-box animate-fadeIn shadow-2xl", style: { left: editingWeightData.x, top: editingWeightData.y } },
                React.createElement("div", { className: "text-[9px] font-black text-blue-500 uppercase tracking-tighter mb-1 text-center font-bold" }, "Set Weight"),
                React.createElement("input", { autoFocus: true, type: "number", className: "w-20 border-b-2 border-blue-200 outline-none text-sm font-bold text-center p-1", value: tempValue, onChange: (e) => setTempValue(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') saveWeightEdit(); else if (e.key === 'Escape') setEditingWeightData(null); }, onBlur: saveWeightEdit })
            ),

            React.createElement("aside", { className: "w-64 bg-white border-r flex flex-col shrink-0 shadow-lg z-30" },
                React.createElement("div", { className: "p-5 border-b font-black text-blue-600 tracking-tighter uppercase italic text-sm" }, "Visual Editor v3.2.2"),
                React.createElement("div", { className: "p-3 pb-0" },
                    React.createElement("input", { 
                        type: "text", 
                        placeholder: "Search events...", 
                        className: "w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-200",
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value)
                    })
                ),
                React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-5 font-bold" },
                    ['Fixed', 'Random', 'Npc'].map(type => (
                        React.createElement("div", { 
                            key: type, 
                            onContextMenu: (e) => handleContextMenu(e, 'event-list', type),
                            onDragOver: handleEventDragOver,
                            onDrop: (e) => handleEventDrop(e, null, type)
                        },
                            React.createElement("div", { 
                                className: "text-[10px] font-black text-gray-400 mb-2 uppercase px-2 tracking-widest font-bold font-bold cursor-pointer flex items-center gap-2",
                                onClick: () => setCollapsedSections(prev => ({...prev, [type]: !prev[type]})),
                                onMouseEnter: (e) => {
                                    let content = type === 'Fixed' 
                                        ? "고정된 시점에 등장 하는 이벤트. 발생 조건을 만족 시켰다면, 그 시점에 즉시 호출 한다.Ex) 스토리 이벤트, 퀘스트 종료시 이벤트..."
                                        : content = type == 'Random'
                                            ? "캠페인 타임에 따라 발생 하는 이벤트 풀. 랜덤 이벤트 발생 시점에, 조건을 만족 시켰다면 발생 풀에 넣어서 제비뽑기 한다.Ex) 천색조 이벤트…"
                                            : "NPC와 관련된 고정 이벤트. ";
                                    setTooltip({ show: true, x: e.clientX, y: e.clientY, content });
                                },
                                onMouseLeave: () => setTooltip({ show: false })
                            }, React.createElement(Icon, { name: "ArrowRight", size: 12, className: `transition-transform ${collapsedSections[type] ? '' : 'rotate-90'}` }), type, " Events"),
                            !collapsedSections[type] && events.filter(e => e.EventType === type && 
                                (e.DevComment.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 e.EventID.toLowerCase().includes(searchQuery.toLowerCase()))
                            ).map(ev => (
                                React.createElement("div", { 
                                    key: ev.EventID, 
                                    className: `group relative mb-1.5 font-bold transition-opacity ${draggingEventId === ev.EventID ? 'opacity-30' : ''}`,
                                    onContextMenu: (e) => handleContextMenu(e, 'event', ev.EventID),
                                    draggable: "true",
                                    onDragStart: (e) => handleEventDragStart(e, ev.EventID),
                                    onDragOver: handleEventDragOver,
                                    onDrop: (e) => handleEventDrop(e, ev.EventID, type)
                                },
                                    React.createElement("button", { onClick: () => { setSelectedEventId(ev.EventID); setSelectedElement({ type: 'event', id: ev.EventID }); }, className: `w-full text-left p-3 rounded-xl transition-all pr-10 ${selectedEventId === ev.EventID ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-400 font-bold' : 'hover:bg-gray-100 font-bold'}` },
                                        editingEventCommentId === ev.EventID ? (
                                            React.createElement("input", { 
                                                autoFocus: true,
                                                ref: editingElementRef,
                                                type: "text", 
                                                className: "w-full bg-transparent outline-none text-sm border-b-2 border-blue-400 font-bold", 
                                                value: tempValue, 
                                                onChange: (e) => setTempValue(e.target.value),
                                                onBlur: saveDevComment,
                                                onKeyDown: (e) => { if (e.key === 'Enter' || e.key === 'Escape') saveDevComment(); }
                                            })
                                        ) : (
                                            React.createElement("div", { className: "text-sm truncate font-bold", onDoubleClick: (e) => { e.stopPropagation(); setEditingEventCommentId(ev.EventID); setTempValue(ev.DevComment); } }, ev.DevComment)
                                        ),
                                        React.createElement("div", { className: "text-[10px] truncate opacity-60 font-medium" }, ev.EventID)
                                    ),
                                    React.createElement("button", { onClick: (e) => { e.stopPropagation(); setDeleteModal({ show: true, type: 'event', id: ev.EventID }); }, className: `absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-all ${selectedEventId === ev.EventID ? 'text-white' : 'text-gray-300 hover:text-red-500'}` }, React.createElement(Icon, { name: "Trash2", size: 14 }))
                                )
                            )),
                            React.createElement("button", { onClick: () => createEvent(type), className: "w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-[10px] text-gray-400 hover:border-blue-300 hover:text-blue-500 font-bold uppercase mt-2 shadow-sm" }, "+ ", type)
                        )
                    ))
                ),
                React.createElement("div", { className: "p-5 bg-gray-50 border-t space-y-2.5 font-bold" },
                    React.createElement("div", { className: "flex gap-2 font-bold" },
                        React.createElement("button", { onClick: performUndo, disabled: undoStack.length === 0, className: "flex-1 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-600 hover:bg-gray-100 uppercase transition-all shadow-sm font-bold" }, "Undo"),
                        React.createElement("button", { onClick: performRedo, disabled: redoStack.length === 0, className: "flex-1 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-600 hover:bg-gray-100 uppercase transition-all shadow-sm font-bold" }, "Redo")
                    ),
                    React.createElement("button", { onClick: () => setShowImportModal(true), className: "w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-gray-100 uppercase transition-all shadow-sm font-bold transition-all" }, React.createElement(Icon, { name: "Upload", size: 14 }), " Import"),
                    React.createElement("button", { onClick: handleUploadToDrive, className: "w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-black transition-colors uppercase tracking-widest shadow-lg font-bold transition-all" }, React.createElement(Icon, { name: "Download", size: 14 }), " Export / Save to Drive")
                )
            ),

            React.createElement("main", { className: "flex-1 flex flex-col min-w-0 bg-gray-50 relative overflow-hidden" },
                React.createElement("header", { className: "h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 z-20 shadow-sm font-bold" },
                    React.createElement("div", { className: "flex items-center gap-3 font-black text-gray-700 tracking-tight" }, selectedEventId || "SELECT EVENT", selectedEventId && React.createElement("span", { className: "text-[10px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-mono uppercase ml-2 tracking-tighter shadow-sm font-bold" }, events.find(e => e.EventID === selectedEventId)?.EventType)),
                    React.createElement("button", { onClick: () => createNode(maxDepthMemo + 1), disabled: !selectedEventId || maxDepthMemo >= 9, className: "px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-blue-700 disabled:opacity-30 shadow-xl transition-all font-bold uppercase tracking-widest font-bold" }, React.createElement(Icon, { name: "Plus", size: 14 }), " ", maxDepthMemo >= 9 ? 'MAX COLUMNS' : 'NEW DEPTH COLUMN')
                ),

                React.createElement("div", { className: "flex-1 overflow-auto pattern-grid relative", onScroll: () => updateLines() },
                    React.createElement("div", { className: "canvas-container p-16 flex gap-20 items-start font-bold", ref: canvasRef },
                        React.createElement("svg", { className: "connection-layer" },
                            lines.map(line => (
                                React.createElement("g", { key: line.id, onDoubleClick: (e) => { e.stopPropagation(); setEditingWeightData({ choiceId: line.choiceId, actionIndex: line.actionIndex, x: e.clientX, y: e.clientY }); setTempValue(line.weight); } },
                                    React.createElement("path", { d: line.d, fill: "none", stroke: "transparent", strokeWidth: "16", className: "connection-hit-area" }),
                                    React.createElement("path", { d: line.d, fill: "none", stroke: "#3b82f6", strokeWidth: "2.5", strokeOpacity: "0.2", strokeLinecap: "round", className: "hover:stroke-opacity-100 transition-all pointer-events-none" }),
                                    line.weight !== "100" && React.createElement("text", { x: 0, y: 0, className: "connection-label", style: { transform: `translate(${line.lx}px, ${line.ly}px)` } }, line.weight)
                                )
                            ))
                        ),

                        Array.from({ length: maxDepthMemo + 1 }).map((_, dIdx) => (
                            React.createElement("div", { key: dIdx, className: "flex flex-col gap-10 w-72 shrink-0" },
                                React.createElement("div", { className: "text-center px-4 font-bold text-[11px] text-gray-400 uppercase tracking-[0.3em] mb-4" }, "Depth ", dIdx),
                                dIdx > 0 && React.createElement("button", { onClick: () => createNode(dIdx), disabled: nodesByDepthMemo[dIdx]?.length >= 10, className: "w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] text-gray-400 hover:bg-white hover:border-blue-400 hover:text-blue-500 transition-all font-black uppercase tracking-widest shadow-sm disabled:opacity-30 font-bold" }, "ADD NODE"),
                                nodesByDepthMemo[dIdx]?.map(node => (
                                    React.createElement("div", { key: node.NodeID, ref: el => elementRefs.current[node.NodeID] = el, onClick: (e) => { e.stopPropagation(); setSelectedElement({ type: 'node', id: node.NodeID }); }, onContextMenu: (e) => handleContextMenu(e, 'node', node.NodeID), onDragOver: (e) => onNodeDragOver(e, node.NodeID), onDrop: (e) => onNodeDrop(e, node.NodeID), className: `node-card bg-white rounded-3xl shadow-sm border-2 overflow-hidden transition-all relative ${selectedElement?.id === node.NodeID ? 'border-blue-500 ring-4 ring-blue-50 scale-105 shadow-2xl' : 'border-gray-100 hover:border-gray-200'} ${dropTargetId === node.NodeID ? 'drop-target-active' : ''}` },
                                        React.createElement("div", { className: "bg-gray-50/50 px-4 py-3 border-b flex justify-between items-center font-bold tracking-tight text-[10px] font-mono text-gray-400" }, node.NodeID, " ", React.createElement("span", { className: "text-[9px] font-black bg-white px-2 py-1 rounded-full border border-gray-200 text-blue-500 uppercase tracking-tighter" }, node.NodeType)),
                                        React.createElement("div", { className: "p-5 font-bold" },
                                            editingNodeCommentId === node.NodeID ? (
                                                React.createElement("textarea", { autoFocus: true, ref: editingElementRef, className: "w-full p-3 text-xs border border-blue-200 rounded-xl mb-4 outline-none focus:ring-4 focus:ring-blue-50 min-h-[100px] font-serif bg-white shadow-inner font-bold", value: tempValue, onChange: (e) => setTempValue(e.target.value), onBlur: saveDevComment, onKeyDown: (e) => { if (e.key === 'Enter') { /* No longer blurs */ } else if (e.key === 'Escape') saveDevComment(); else if (e.key === 'Tab') { e.preventDefault(); handleTabNavigation('node', node.NodeID); } } })
                                            ) : (
                                                React.createElement("p", { onDoubleClick: (e) => { e.stopPropagation(); setEditingNodeCommentId(node.NodeID); setTempValue(node.DevComment); }, className: "text-[13px] text-gray-700 mb-5 cursor-text hover:bg-gray-50 rounded-lg p-2 leading-relaxed transition-colors break-words whitespace-pre-wrap font-medium font-bold" }, node.DevComment)
                                            ),
                                            React.createElement("div", { className: "space-y-2" },
                                                node.ChoiceIDs.map(cid => {
                                                    const c = choices.find(x => x.ChoiceID === cid); if(!c) return null;
                                                    const isEd = editingChoiceCommentId === cid;
                                                    return (
                                                        React.createElement("div", { key: cid, ref: el => elementRefs.current[cid] = el, draggable: !isEd, onDragStart: (e) => onChoiceDragStart(e, cid), onDragOver: (e) => e.preventDefault(), onDrop: (e) => onChoiceDrop(e, cid), onMouseEnter: (e) => !isEd && handleChoiceHover(e, c), onMouseLeave: () => { setTooltip({ ...tooltip, show: false }); }, onContextMenu: (e) => handleContextMenu(e, 'choice', cid), onClick: (e) => { e.stopPropagation(); setSelectedElement({ type: 'choice', id: cid }); }, className: `p-2.5 border rounded-2xl text-[11px] flex justify-between items-center transition-all cursor-grab active:cursor-grabbing ${isEd ? 'ring-2 ring-blue-500 bg-white shadow-lg' : (selectedElement?.id === cid ? 'bg-orange-50 border-orange-400 text-orange-800 font-bold shadow-md' : 'bg-white border-gray-100 hover:bg-gray-50 font-bold')}` },
                                                            React.createElement("div", { className: "flex items-center gap-2 overflow-hidden flex-1 font-bold truncate" },
                                                                !isEd && React.createElement(Icon, { name: "MousePointer", size: 10, className: `${selectedElement?.id === cid ? 'text-orange-400' : 'text-gray-300'}` }),
                                                                isEd ? (
                                                                    React.createElement("input", { autoFocus: true, ref: editingElementRef, className: "w-full bg-transparent outline-none text-[11px] py-0.5 border-b-2 border-blue-400 font-bold", value: tempValue, onChange: (e) => setTempValue(e.target.value), onBlur: saveDevComment, onKeyDown: (e) => { if (e.key === 'Enter') saveDevComment(); else if (e.key === 'Escape') saveDevComment(); else if (e.key === 'Tab') { e.preventDefault(); handleTabNavigation('choice', cid); } } })
                                                                ) : (
                                                                    React.createElement("span", { className: "flex-1 cursor-text font-bold whitespace-normal break-words py-1 leading-tight transition-colors", onDoubleClick: (e) => { e.stopPropagation(); setEditingChoiceCommentId(cid); setTempValue(c.DevComment); } }, c.DevComment)
                                                                )
                                                            ),
                                                            !isEd && React.createElement("div", { className: "flex gap-1.5 ml-2 shrink-0" }, c.ActiveTooltipType !== "None" && React.createElement(Icon, { name: "Info", size: 11, className: c.ActiveTooltipType === "Probability" ? "text-blue-500" : "text-purple-400" }), React.createElement(Icon, { name: "ArrowRight", size: 11, className: c.OnSelectAction ? "text-blue-500" : "text-gray-200" }))
                                                        )
                                                    );
                                                }),
                                                node.ChoiceIDs.length < 3 && React.createElement("button", { onClick: (e) => { e.stopPropagation(); createChoice(node.NodeID); }, className: "w-full py-1.5 border border-dashed border-gray-200 rounded-xl text-[10px] text-gray-300 hover:bg-gray-50 hover:text-blue-500 transition-all uppercase tracking-widest mt-1 shadow-sm font-bold font-bold font-bold font-bold" }, "Add Choice")
                                            )
                                        )
                                    )
                                ))
                            )
                        ))
                    )
                )
            ),

            selectedElement && viewMode === 'editor' && React.createElement("aside", { className: "w-80 bg-white border-l p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200 font-bold font-bold" },
                React.createElement("div", { className: "flex justify-between items-center mb-8 font-black text-[11px] text-gray-400 tracking-[0.4em] uppercase" }, selectedElement.type, " PROPERTIES ", !(selectedElement.type === 'node' && nodes.find(n => n.NodeID === selectedElement.id)?.depth === 0) && React.createElement("button", { onClick: () => setDeleteModal({ show: true, type: selectedElement.type, id: selectedElement.id }), className: "text-gray-300 hover:text-red-500 transition-all transition-all" }, React.createElement(Icon, { name: "Trash2", size: 20 }))),
                React.createElement("div", { className: "space-y-8 font-bold font-bold font-bold font-bold font-bold" },
                    selectedElement.type === 'event' && (() => {
                        const ev = events.find(e => e.EventID === selectedElement.id);
                        if (!ev) return null;
                        return React.createElement("div", { className: "space-y-4 animate-fadeIn" },
                            React.createElement(PropField, { label: "Event ID", value: ev.EventID, readOnly: true }),
                            React.createElement(PropField, { label: "Dev Comment", value: ev.DevComment, onChange: v => { recordHistory(); setEvents(events.map(e => e.EventID === ev.EventID ? {...e, DevComment: v} : e)); }, type: "textarea" }),
                            React.createElement(PropField, { label: "Target Unit Condition", value: ev.TargetUnitCondition, onChange: v => { recordHistory(); setEvents(events.map(e => e.EventID === ev.EventID ? {...e, TargetUnitCondition: v} : e)); }, type: "textarea" }),
                            React.createElement("div", { className: "grid grid-cols-2 gap-3" }, React.createElement(PropField, { label: "Weight", value: ev.Weight, onChange: v => { recordHistory(); setEvents(events.map(e => e.EventID === ev.EventID ? {...e, Weight: parseInt(v) || 0} : e)); }, type: "number" }), React.createElement(PropField, { label: "CoolDown", value: ev.CoolDown, onChange: v => { recordHistory(); setEvents(events.map(e => e.EventID === ev.EventID ? {...e, CoolDown: parseInt(v) || 0} : e)); }, type: "number" })),
                            React.createElement("div", { className: "flex items-center gap-3 pt-2 font-bold font-bold font-bold font-bold font-bold" }, React.createElement("input", { type: "checkbox", checked: ev.IsRepeatable, onChange: e => { recordHistory(); setEvents(events.map(evnt => evnt.EventID === ev.EventID ? {...evnt, IsRepeatable: e.target.checked} : evnt)); }, className: "w-5 h-5 text-blue-600 rounded-lg border-gray-300 shadow-sm" }), React.createElement("label", { className: "text-[11px] font-black text-gray-500 uppercase tracking-tighter" }, "Is Repeatable"))
                        );
                    })(),
                    selectedElement.type === 'node' && (() => {
                        const node = nodes.find(n => n.NodeID === selectedElement.id);
                        if (!node) return null;
                        return React.createElement("div", { className: "space-y-4 animate-fadeIn font-bold font-bold font-bold font-bold font-bold font-bold" }, React.createElement(PropField, { label: "Node ID", value: node.NodeID, readOnly: true }), React.createElement(PropField, { label: "Type", value: node.NodeType, onChange: v => { recordHistory(); setNodes(nodes.map(n => n.NodeID === node.NodeID ? {...n, NodeType: v} : n)); }, type: "select", options: ["Normal", "Reward", "Combat", "End"] }), React.createElement(PropField, { label: "Dev Comment", value: node.DevComment, onChange: v => { recordHistory(); setNodes(nodes.map(n => n.NodeID === node.NodeID ? {...n, DevComment: v} : n)); }, type: "textarea" }));
                    })(),
                    selectedElement.type === 'choice' && (() => {
                        const c = choices.find(x => x.ChoiceID === selectedElement.id);
                        if (!c) return null;
                        return React.createElement("div", { className: "space-y-5 animate-fadeIn font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold" },
                            React.createElement(PropField, { label: "Choice ID", value: c.ChoiceID, readOnly: true }),
                            React.createElement(PropField, { label: "Dev Comment", value: c.DevComment, onChange: v => { recordHistory(); setChoices(choices.map(x => x.ChoiceID === c.ChoiceID ? {...x, DevComment: v} : x)); }, type: "textarea" }),
                            React.createElement(PropField, { label: "Actions", value: c.OnSelectAction, onChange: v => { recordHistory(); setChoices(choices.map(x => x.ChoiceID === c.ChoiceID ? {...x, OnSelectAction: v} : x)); }, type: "textarea", placeholder: "ShowNextNode_NodeF010_100" }),
                            React.createElement(PropField, { label: "Condition", value: c.ActiveCondition, onChange: v => { recordHistory(); setChoices(choices.map(x => x.ChoiceID === c.ChoiceID ? {...x, ActiveCondition: v} : x)); } }),
                            React.createElement(PropField, { label: "Tooltip Type", value: c.ActiveTooltipType, onChange: v => { recordHistory(); setChoices(choices.map(x => x.ChoiceID === c.ChoiceID ? {...x, ActiveTooltipType: v} : x)); }, type: "select", options: ["None", "ShowAction", "ShowChoiceAction", "Probability"] }),
                            React.createElement(PropField, { label: "Tooltip Value", value: c.ActiveTooltipValue || "", onChange: v => { recordHistory(); setChoices(choices.map(x => x.ChoiceID === c.ChoiceID ? {...x, ActiveTooltipValue: v} : x)); } })
                        );
                    })()
                )
            ),

            showImportModal && React.createElement("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-md z-[20000] flex items-center justify-center p-8 animate-fadeIn font-bold" },
                React.createElement("div", { className: "bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300" },
                    React.createElement("div", { className: "p-8 border-b flex justify-between items-center font-black text-xl tracking-tighter uppercase tracking-widest shadow-sm font-bold font-bold font-bold font-bold font-bold font-bold" }, "Import JSON Data", React.createElement("button", { onClick: () => setShowImportModal(false), className: "hover:rotate-90 transition-transform" }, React.createElement(Icon, { name: "Plus", size: 32, className: "rotate-45 text-gray-400 font-bold" }))),
                    React.createElement("div", { className: "p-8 space-y-4 font-bold font-bold font-bold font-bold font-bold font-bold" }, React.createElement("textarea", { className: "w-full h-80 p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-mono text-xs focus:ring-4 focus:ring-blue-100 shadow-inner transition-all shadow-inner shadow-inner", value: importText, onChange: (e) => setImportText(e.target.value) })),
                    React.createElement("div", { className: "p-8 bg-gray-50 border-t flex gap-4 justify-end font-bold font-bold font-bold font-bold font-bold font-bold font-bold" }, React.createElement("button", { onClick: () => setShowImportModal(false), className: "px-8 py-3 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-200 transition-all uppercase tracking-widest font-bold font-bold font-bold font-bold font-bold font-bold font-bold" }, "Cancel"), React.createElement("button", { onClick: handleImport, className: "px-10 py-3 rounded-2xl text-sm font-black bg-blue-600 text-white shadow-xl hover:bg-blue-700 uppercase tracking-widest font-bold font-bold font-bold font-bold font-bold font-bold font-bold" }, "Load"))
                )
            ),

            deleteModal.show && React.createElement("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-md z-[11000] flex items-center justify-center p-8 animate-fadeIn font-bold" },
                React.createElement("div", { className: "bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200 font-bold" },
                    React.createElement("div", { className: "w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm" }, React.createElement(Icon, { name: "AlertTriangle", size: 40 })),
                    React.createElement("h3", { className: "text-2xl font-black mb-4 tracking-tighter uppercase text-gray-800 tracking-tighter font-bold" }, "Delete Item?"),
                    React.createElement("div", { className: "flex gap-4 mt-10 font-bold" },
                        React.createElement("button", { onClick: () => setDeleteModal({ show: false }), className: "flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest font-bold" }, "Cancel"),
                        React.createElement("button", { onClick: executeDelete, className: "flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-2xl shadow-red-200 hover:bg-red-700 transition-all uppercase tracking-widest font-bold" }, "Confirm")
                    )
                )
            )
        )
    );
};

export default App;
