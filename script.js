const CLIENT_ID = '417625071700-296k9dfgaedqhrgkr66vrbv9uea6p1gs.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAp5YPAyypfkfeBP9GqFuhbRMZWsVF8abk';
const FOLDER_ID = '1aVLAXF9jSMgBBq9KonoDEjVNOuG_XaTg'; // User provided folder ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;

const { useState, useEffect, useCallback, useRef, useMemo } = React;

function getEventSummary(eventId) {
    if (!eventId) return "E";
    const match = eventId.match(/_(Random|Fixed)(\d+)/);
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

let isCloudAvailable = false; // Firebase functionality removed
let appId = 'event-editor-app'; // No longer used for Firebase, but kept for potential future use
let initialAuthToken = null; // No longer used for Firebase

const Icon = ({ name, size = 16, className = "" }) => {
    const icons = {
        Plus: React.createElement("path", { d: "M12 5v14M5 12h14" }),
        Trash2: React.createElement(React.Fragment, null, React.createElement("path", { d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }), React.createElement("path", { d: "M10 11v6M14 11v6" })),
        ArrowRight: React.createElement("path", { d: "M5 12h14M12 5l7 7-7 7" }),
        Download: React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" }),
        Upload: React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" }),
        GitBranch: React.createElement(React.Fragment, null, React.createElement("line", { x1: "6", y1: "3", x2: "6", y2: "15" }), React.createElement("circle", { cx: "18", cy: "6", r: "3" }), React.createElement("circle", { cx: "6", cy: "18", r: "3" }), React.createElement("path", { d: "M18 9a9 9 0 0 1-9 9" })),
        AlertTriangle: React.createElement("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01" }),
        MousePointer: React.createElement("path", { d: "m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3zM13 13l6 6" }),
        Info: React.createElement(React.Fragment, null, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })),
        Save: React.createElement(React.Fragment, null, React.createElement("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }), React.createElement("polyline", { points: "17 21 17 13 7 13 7 21" }), React.createElement("polyline", { points: "7 3 7 8 15 8" })),
        Cloud: React.createElement("path", { d: "M17.5 19c3.037 0 5.5-2.463 5.5-5.5 0-2.97-2.354-5.388-5.304-5.485C16.924 4.195 13.771 1 10 1 6.55 1 3.655 3.528 3.1 6.82 1.346 7.647 0 9.4 0 11.5 0 14.537 2.463 17 5.5 17h12M9 13l3 3 3-3M12 16V9" }),
        Settings: React.createElement(React.Fragment, null, React.createElement("circle", { cx: "12", cy: "12", r: "3" }), React.createElement("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" }))
    };
    return (
        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className },
            icons[name] || React.createElement("circle", { cx: "12", cy: "12", r: "10" })
        )
    );
};

const App = () => {
    // --- States ---
    const [events, setEvents] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [choices, setChoices] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [selectedElement, setSelectedElement] = useState(null);
    const [viewMode, setViewMode] = useState('editor');
    const [deleteModal, setDeleteModal] = useState({ show: false, type: null, id: null });
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState("");
    const [toast, setToast] = useState({ show: false, message: "" });
    const [gapiInitialized, setGapiInitialized] = useState(false);
    const [gisInited, setGisInited] = useState(false);

    const [editingNodeCommentId, setEditingNodeCommentId] = useState(null);
    const [editingChoiceCommentId, setEditingChoiceCommentId] = useState(null);
    const [editingWeightData, setEditingWeightData] = useState(null);
    const [tempValue, setTempValue] = useState("");

    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: "" });
    const [draggingChoiceId, setDraggingChoiceId] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);
    const [ctxMenu, setCtxMenu] = useState({ show: false, x: 0, y: 0, type: null, id: null });
    const [clipboard, setClipboard] = useState(null);
    const [collapsedSections, setCollapsedSections] = useState({});
    
    const canvasRef = useRef(null);
    const elementRefs = useRef({});
    const editingElementRef = useRef(null); // Ref to currently edited DevComment input/textarea
    const postAuthAction = useRef(null);
    const authInProgress = useRef(false);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const executeAfterAuth = (action) => {
        // 1. React 상태가 아닌, 브라우저 메모리에 로드된 실제 객체 직접 확인
        const isGapiReady = window.gapi && gapi.client && gapi.client.drive;
        const isGisReady = window.google && google.accounts && google.accounts.oauth2 && tokenClient;

        if (!isGapiReady || !isGisReady) {
            showToast("Google API 라이브러리를 로드 중입니다. 잠시 후 다시 시도해 주세요.");
            return;
        }

        // 2. 현재 유효한 토큰(세션)이 있는지 확인
        const token = gapi.client.getToken();
        
        if (token && token.access_token) {
            // 이미 토큰이 있다면 팝업 없이 바로 실행
            action();
        } else {
            // 토큰이 없을 때만 로그인을 요청
            showToast("구글 인증이 필요합니다.");
            postAuthAction.current = action;
            
            // 중요: prompt를 빈 문자열('')로 설정해야 세션이 있을 때 팝업 없이 자동 로그인됩니다.
            tokenClient.requestAccessToken({ prompt: '' });
        }
    };
    // --- Business Logic ---
    const showToast = useCallback((msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: "" }), 2500);
    }, []);

    const recordHistory = useCallback(() => {
        setUndoStack(prev => [...prev.slice(-49), JSON.stringify({ events, nodes, choices })]);
        setRedoStack([]);
    }, [events, nodes, choices]);

    const saveDevComment = useCallback(() => {
        if (editingNodeCommentId) {
            const node = nodes.find(n => n.NodeID === editingNodeCommentId);
            if (node && tempValue !== node.DevComment) {
                recordHistory();
                setNodes(prev => prev.map(n => n.NodeID === editingNodeCommentId ? {...n, DevComment: tempValue} : n));
            }
            setEditingNodeCommentId(null);
            setTempValue(""); // Clear tempValue after saving
        } else if (editingChoiceCommentId) {
            const choice = choices.find(c => c.ChoiceID === editingChoiceCommentId);
            if (choice && tempValue !== choice.DevComment) {
                recordHistory();
                setChoices(prev => prev.map(c => c.ChoiceID === editingChoiceCommentId ? {...c, DevComment: tempValue} : c));
            }
            setEditingChoiceCommentId(null);
            setTempValue(""); // Clear tempValue after saving
        }
    }, [editingNodeCommentId, editingChoiceCommentId, tempValue, nodes, choices, recordHistory]);

    const performUndo = useCallback(() => {
        if (undoStack.length === 0) return;
        const prevSnapshot = JSON.parse(undoStack[undoStack.length - 1]);
        setRedoStack(prev => [...prev, JSON.stringify({ events, nodes, choices })]);
        setUndoStack(prev => prev.slice(0, -1));
        setEvents(prevSnapshot.events); setNodes(prevSnapshot.nodes); setChoices(prevSnapshot.choices);
        showToast("Undo Successful");
    }, [undoStack, events, nodes, choices, showToast]);

    const performRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        const nextSnapshot = JSON.parse(redoStack[redoStack.length - 1]);
        setUndoStack(prev => [...prev, JSON.stringify({ events, nodes, choices })]);
        setRedoStack(prev => prev.slice(0, -1));
        setEvents(nextSnapshot.events); setNodes(nextSnapshot.nodes); setChoices(nextSnapshot.choices);
        showToast("Redo Successful");
    }, [redoStack, events, nodes, choices, showToast]);

    const uploadToDrive = useCallback(() => {
        executeAfterAuth(async () => {
            if (!gapiInitialized || !gisInited) {
                showToast("Google API not initialized. Please try again.");
                return;
            }

            const data = {
                "Event시트": events.map(e => ({
                    ...e,
                    TargetUnitCondition: (e.TargetUnitCondition || "").replace(/\n/g, ',')
                })),
                "Node시트": nodes.map(({ depth, ...rest }) => rest),
                "Choice시트": choices.map(c => {
                    const actionStr = (c.OnSelectAction || "").replace(/\n/g, ',');
                    let tType = c.ActiveTooltipType;
                    if ((tType === 'ShowChoiceAction' || tType === 'Probability') && c.ActiveTooltipValue) {
                        tType = `${tType}_${c.ActiveTooltipValue.replace(/,/g, '_')}`;
                    }
                    return {
                        ChoiceID: c.ChoiceID, DevComment: c.DevComment, LinkedNodeID: c.LinkedNodeID,
                        ActiveCondition: c.ActiveCondition, OnSelectAction: actionStr, ActiveTooltipType: tType
                    };
                })
            };

            const fileContent = JSON.stringify(data, null, 2);
            const fileName = `DS_Events.json`;

            showToast("Saving to Google Drive...");

            try {
                const response = await gapi.client.drive.files.list({
                    q: `'${FOLDER_ID}' in parents and name='${fileName}' and trashed=false`,
                    fields: 'files(id, name)',
                });

                const files = response.result.files;

                if (files.length > 0) {
                    const fileId = files[0].id;
                    await gapi.client.request({
                        path: '/upload/drive/v3/files/' + fileId,
                        method: 'PATCH',
                        params: { uploadType: 'media' },
                        headers: { 'Content-Type': 'application/json' },
                        body: fileContent,
                    });
                    showToast(`File '${fileName}' updated in Google Drive.`);
                } else {
                    const fileMetadata = {
                        name: fileName,
                        parents: [FOLDER_ID],
                    };
                    const form = new FormData();
                    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
                    form.append('media', new Blob([fileContent], { type: 'application/json' }));

                    await gapi.client.request({
                        path: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                        method: 'POST',
                        headers: { 'Content-Type': 'multipart/related' },
                        body: form,
                    });
                    showToast(`File '${fileName}' created in Google Drive.`);
                }
            } catch (error) {
                console.error("Error uploading to Google Drive:", error);
                showToast("Failed to save to Google Drive.");
            }
        });
    }, [events, nodes, choices, showToast, gapiInitialized, gisInited]);

    const loadFromDrive = useCallback(() => {
        executeAfterAuth(async () => {
            if (!gapiInitialized || !gisInited) {
                showToast("Google API not ready. Please wait a moment.");
                return;
            }
    
            const fileName = `DS_Events.json`;
            showToast("Loading from Google Drive...");
    
            try {
                const response = await gapi.client.drive.files.list({
                    q: `'${FOLDER_ID}' in parents and name='${fileName}' and trashed=false`,
                    fields: 'files(id, name)',
                });
    
                const files = response.result.files;
    
                if (files.length > 0) {
                    const fileId = files[0].id;
                    const fileContentResponse = await gapi.client.drive.files.get({
                        fileId: fileId,
                        alt: 'media',
                    });
    
                    const data = fileContentResponse.result;
    
                    recordHistory();
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
                    showToast(`File '${fileName}' loaded from Google Drive.`);
                } else {
                    showToast(`File '${fileName}' not found in Google Drive.`);
                }
            } catch (error) {
                console.error("Error loading from Google Drive:", error);
                showToast("Failed to load from Google Drive.");
            }
        });
    }, [recordHistory, setEvents, setNodes, setChoices, setSelectedEventId, showToast, gapiInitialized, gisInited]);

    useEffect(() => {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
            gapi.load('client', () => {
                gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                }).then(() => {
                    setGapiInitialized(true);
                });
            });
        };
        document.body.appendChild(gapiScript);

        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = () => {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (resp) => {
                    if (resp.error) {
                        showToast("인증 실패: " + resp.error);
                        return;
                    }
                    // 인증 성공 시 중단되었던 작업(저장 등) 실행
                    if (postAuthAction.current) {
                        const actionToRun = postAuthAction.current;
                        postAuthAction.current = null;
                        actionToRun();
                    }
                },
            });
            setGisInited(true);
        };
        document.body.appendChild(gisScript);

        return () => {
            document.body.removeChild(gapiScript);
            document.body.removeChild(gisScript);
        }
    }, [setGapiInitialized, setGisInited, loadFromDrive]);



    const handleCopy = useCallback(() => {
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
    }, [selectedElement, events, nodes, choices, showToast]);

    const handlePaste = useCallback(() => {
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

    }, [clipboard, events, nodes, choices, selectedEventId, recordHistory, showToast]);

    useEffect(() => {
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
                    uploadToDrive(); // Changed to Google Drive save
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
    }, [performUndo, performRedo, uploadToDrive, handleCopy, handlePaste, selectedElement]);

    const getSmallestAvailableNodeIndex = (depth) => {
        const existingIndices = nodes
            .filter(n => n.LinkedEventID === selectedEventId && n.depth === depth)
            .map(n => parseInt(n.NodeID.slice(-1)));
        for (let i = 0; i < 10; i++) { if (!existingIndices.includes(i)) return i; }
        return null;
    };

    const getSmallestAvailableChoiceIndex = (nodeId) => {
        const existingIndices = choices.filter(c => c.LinkedNodeID === nodeId).map(c => parseInt(c.ChoiceID.slice(-1)));
        for (let i = 0; i < 3; i++) { if (!existingIndices.includes(i)) return i; }
        return null;
    };

    const createEvent = (type) => {
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
        
        const newEvent = { EventID: id, DevComment: "New Event", StartNodeID: startId, StartCondition: "None", TargetUnitCondition: "None", EventType: type, Weight: 100, IsRepeatable: false, CoolDown: 0 };
        const startNode = { NodeID: startId, DevComment: "Start Point", LinkedEventID: id, NodeType: "Normal", ChoiceIDs: [startChoiceId], depth: 0 };
        const startChoice = { ChoiceID: startChoiceId, DevComment: "새 선택지", LinkedNodeID: startId, ActiveCondition: "None", OnSelectAction: "", ActiveTooltipType: "None", ActiveTooltipValue: "" };
        
        setEvents(prev => [...prev, newEvent]);
        setNodes(prev => [...prev, startNode]);
        setChoices(prev => [...prev, startChoice]);
        setSelectedEventId(id); 
        setSelectedElement({ type: 'event', id });
    };

    const createNode = (depth) => {
        if (!selectedEventId || depth > 9) return;
        const currentDepthCount = nodes.filter(n => n.LinkedEventID === selectedEventId && n.depth === depth).length;
        if (currentDepthCount >= 10) { showToast("Depth limit (10) reached."); return; }
        recordHistory();
        const nodeIdx = getSmallestAvailableNodeIndex(depth);
        const nid = `Node${getEventSummary(selectedEventId)}${depth}${nodeIdx}`;

        const choiceIdx = 0; // Default first choice
        const cid = `Choice${getEventSummary(selectedEventId)}${depth}${nodeIdx}${choiceIdx}`;

        const newNode = { NodeID: nid, DevComment: "지문 내용을 입력하세요.", LinkedEventID: selectedEventId, NodeType: "Normal", ChoiceIDs: [cid], depth };
        const newChoice = { ChoiceID: cid, DevComment: "새 선택지", LinkedNodeID: nid, ActiveCondition: "None", OnSelectAction: "", ActiveTooltipType: "None", ActiveTooltipValue: "" };

        setNodes(prev => [...prev, newNode]);
        setChoices(prev => [...prev, newChoice]);
        setSelectedElement({ type: 'node', id: nid });
    };

    const createChoice = (nodeId) => {
        const node = nodes.find(n => n.NodeID === nodeId);
        if (!node || node.ChoiceIDs.length >= 3) return;
        recordHistory();
        const idx = getSmallestAvailableChoiceIndex(nodeId);
        if (idx === null) {
            showToast("Choice limit (3) reached.");
            return;
        }
        const cid = `Choice${getEventSummary(selectedEventId)}${nodeId.slice(-2)}${idx}`;
        setChoices(prev => [...prev, { ChoiceID: cid, DevComment: "새 선택지", LinkedNodeID: nodeId, ActiveCondition: "None", OnSelectAction: "", ActiveTooltipType: "None", ActiveTooltipValue: "" }]);
        setNodes(prev => prev.map(n => n.NodeID === nodeId ? { ...n, ChoiceIDs: [...n.ChoiceIDs, cid].sort() } : n));
        setSelectedElement({ type: 'choice', id: cid });
    };

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
            const acts = (choice.OnSelectAction || "").split(/\n/).filter(a => a.trim() !== "");
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

    const handleChoiceHover = useCallback((e, choice) => {
        if (draggingChoiceId || editingChoiceCommentId) return;
        let content = "";
        if (choice.ActiveTooltipType === "ShowAction") content = choice.OnSelectAction || "No actions.";
        else if (choice.ActiveTooltipType === "ShowChoiceAction" && choice.ActiveTooltipValue) {
            content = choices.find(c => c.ChoiceID === choice.ActiveTooltipValue)?.OnSelectAction || "Ref Error";
        } else if (choice.ActiveTooltipType === "Probability" && choice.ActiveTooltipValue) {
            const tIds = choice.ActiveTooltipValue.split(',');
            const acts = (choice.OnSelectAction || "").split(/\n/);
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
        if (content) setTooltip({
            show: true,
            x: e.clientX,
            y: e.clientY,
            content
        });
    }, [draggingChoiceId, editingChoiceCommentId, choices]);

    const saveWeightEdit = () => {
        if (!editingWeightData) return;
        recordHistory();
        const { choiceId, actionIndex } = editingWeightData;
        const newW = parseInt(tempValue) || 0;
        setChoices(prev => prev.map(c => {
            if (c.ChoiceID === choiceId) {
                const acts = (c.OnSelectAction || "").split(/\n/);
                const updated = acts.map((act, idx) => idx === actionIndex ? act.replace(/(ShowNextNode_[A-Za-z0-9]+)(_\d+)?$/, (m, p1) => `${p1}_${newW}`) : act);
                return { ...c, OnSelectAction: updated.join('\n') };
            }
            return c;
        }));
        setEditingWeightData(null);
    };

    const updateTooltipType = (choiceId, type) => {
        recordHistory();
        setChoices(choices.map(c => c.ChoiceID === choiceId ? { ...c, ActiveTooltipType: type } : c));
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
        if (type === 'node' && nodes.find(n => n.NodeID === id)?.depth === 0) return;
        recordHistory();
        if (type === 'event') {
            const rem = events.filter(e => e.EventID !== id);
            setEvents(rem); setNodes(nodes.filter(n => n.LinkedEventID !== id)); setChoices(choices.filter(c => !nodes.find(n => n.NodeID === c.LinkedNodeID && n.LinkedEventID === id)));
            if (selectedEventId === id) setSelectedEventId(rem[0]?.EventID || "");
        } else if (type === 'node') {
            setNodes(nodes.filter(n => n.NodeID !== id)); setChoices(choices.filter(c => c.LinkedNodeID !== id));
        } else if (type === 'choice') {
            const cToDelete = choices.find(c => c.ChoiceID === id);
            setChoices(choices.filter(c => c.ChoiceID !== id));
            if (cToDelete) setNodes(nodes.map(n => n.NodeID === cToDelete.LinkedNodeID ? { ...n, ChoiceIDs: n.ChoiceIDs.filter(cid => cid !== id) } : n));
        }
        setDeleteModal({ show: false }); setCtxMenu({ show: false }); setSelectedElement(null);
    };

    const handleContextMenu = (e, type, id) => {
        e.preventDefault(); e.stopPropagation(); setCtxMenu({ show: true, x: e.clientX, y: e.clientY, type, id });
    };

    const nodesByDepthMemo = useMemo(() => {
        const group = {};
        nodes.filter(n => n.LinkedEventID === selectedEventId).forEach(n => {
            if (!group[n.depth]) group[n.depth] = [];
            group[n.depth].push(n);
        });
        Object.keys(group).forEach(d => group[d].sort((a, b) => a.NodeID.localeCompare(b.NodeID)));
        return group;
    }, [nodes, selectedEventId]);

    const maxDepthMemo = useMemo(() => {
        const depths = nodes.filter(n => n.LinkedEventID === selectedEventId).map(n => n.depth);
        return depths.length > 0 ? Math.max(...depths) : -1;
    }, [nodes, selectedEventId]);

    const [lines, setLines] = useState([]);
    const updateLines = useCallback(() => {
        const res = [];
        choices.forEach(choice => {
            const nodeOfChoice = nodes.find(n => n.NodeID === choice.LinkedNodeID);
            if (!nodeOfChoice || nodeOfChoice.LinkedEventID !== selectedEventId) return;
            const acts = (choice.OnSelectAction || "").split(/\n/);
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

    useEffect(() => { 
        updateLines(); 
        const obs = new ResizeObserver(() => updateLines()); 
        if (canvasRef.current) obs.observe(canvasRef.current); 
        return () => { obs.disconnect(); };
    }, [updateLines]);

    useEffect(() => {
        const closeCtx = () => { if(ctxMenu.show) setCtxMenu({ show: false }); };
        window.addEventListener('click', closeCtx);
        return () => window.removeEventListener('click', closeCtx);
    }, [ctxMenu.show]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (editingNodeCommentId || editingChoiceCommentId) {
                if (editingElementRef.current && !editingElementRef.current.contains(event.target)) {
                    saveDevComment();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside); 
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingNodeCommentId, editingChoiceCommentId, saveDevComment]);

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

    const handleTabNavigation = useCallback((currentType, currentId) => {
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
    }, [nodes, choices, selectedEventId, tempValue, recordHistory, saveDevComment]);

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
                React.createElement("div", { className: "p-5 border-b font-black text-blue-600 tracking-tighter uppercase italic text-sm" }, "Visual Editor v3.1.0"),
                React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-5 font-bold" },
                    ['Fixed', 'Random'].map(type => (
                        React.createElement("div", { key: type, onContextMenu: (e) => handleContextMenu(e, 'event-list', type) },
                            React.createElement("div", { 
                                className: "text-[10px] font-black text-gray-400 mb-2 uppercase px-2 tracking-widest font-bold font-bold cursor-pointer flex items-center gap-2",
                                onClick: () => setCollapsedSections(prev => ({...prev, [type]: !prev[type]})),
                                onMouseEnter: (e) => {
                                    const content = type === 'Fixed' 
                                        ? "고정된 시점에 등장 하는 이벤트. 발생 조건을 만족 시켰다면, 그 시점에 즉시 발생한다.\nEx) NPC이벤트, 스토리 이벤트, 퀘스트 종료시 이벤트, 도플갱어 이벤트…"
                                        : "캠페인 타임에 따라 발생 하는 이벤트 풀. 랜덤 이벤트 발생 시점에, 조건을 만족 시켰다면 발생 풀에 넣어서 제비뽑기 한다.\nEx) 천색조 이벤트…";
                                    setTooltip({ show: true, x: e.clientX, y: e.clientY, content });
                                },
                                onMouseLeave: () => setTooltip({ show: false })
                            }, React.createElement(Icon, { name: "ArrowRight", size: 12, className: `transition-transform ${collapsedSections[type] ? '' : 'rotate-90'}` }), type, " Events"),
                            !collapsedSections[type] && events.filter(e => e.EventType === type).map(ev => (
                                React.createElement("div", { key: ev.EventID, className: "group relative mb-1.5 font-bold", onContextMenu: (e) => handleContextMenu(e, 'event', ev.EventID) },
                                    React.createElement("button", { onClick: () => { setSelectedEventId(ev.EventID); setSelectedElement({ type: 'event', id: ev.EventID }); }, className: `w-full text-left p-3 rounded-xl transition-all pr-10 ${selectedEventId === ev.EventID ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-400 font-bold' : 'hover:bg-gray-100 font-bold'}` },
                                        React.createElement("div", { className: "text-xs truncate font-bold" }, ev.EventID),
                                        React.createElement("div", { className: "text-[10px] truncate opacity-60 font-medium" }, ev.DevComment)
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
                    React.createElement("button", { onClick: uploadToDrive, className: "w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-black transition-colors uppercase tracking-widest shadow-lg font-bold transition-all" }, React.createElement(Icon, { name: "Download", size: 14 }), " Export / Save to Drive")
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

            deleteModal.show && React.createElement("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-md z-[11000] flex items-center justify-center p-8 animate-fadeIn font-bold font-bold font-bold font-bold font-bold font-bold font-bold" },
                React.createElement("div", { className: "bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200 font-bold font-bold font-bold font-bold font-bold font-bold font-bold" },
                    React.createElement("div", { className: "w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm" }, React.createElement(Icon, { name: "AlertTriangle", size: 40 })),
                    React.createElement("h3", { className: "text-2xl font-black mb-4 tracking-tighter uppercase text-gray-800 tracking-tighter font-bold font-bold font-bold font-bold font-bold font-bold" }, "Delete Item?"),
                    React.createElement("div", { className: "flex gap-4 mt-10 font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold" },
                        React.createElement("button", { onClick: () => setDeleteModal({ show: false }), className: "flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest font-bold font-bold font-bold font-bold font-bold font-bold" }, "Cancel"),
                        React.createElement("button", { onClick: executeDelete, className: "flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-2xl shadow-red-200 hover:bg-red-700 transition-all uppercase tracking-widest font-bold font-bold font-bold font-bold font-bold font-bold" }, "Confirm")
                    )
                )
            )
        )
    );
};

const PropField = ({ label, value, onChange, readOnly = false, type = "text", options = [], placeholder = "" }) => (
    React.createElement("div", { className: "group/field font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold" },
        React.createElement("label", { className: "text-[10px] font-black text-gray-400 block mb-2 uppercase tracking-widest group-focus-within/field:text-blue-500 transition-colors font-bold font-bold font-bold font-bold font-bold font-bold" }, label),
        type === "textarea" ? (
            React.createElement("textarea", { value: value, onChange: e => onChange(e.target.value), rows: "5", readOnly: readOnly, placeholder: placeholder, className: `w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[12px] focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none transition-all font-medium shadow-sm font-bold ${readOnly ? 'opacity-50 cursor-not-allowed bg-gray-100 shadow-none' : 'hover:border-gray-200 font-bold'}` })
        ) : type === "select" ? (
            React.createElement("div", { className: "relative font-bold font-bold" },
                React.createElement("select", { value: value, onChange: e => onChange(e.target.value), className: "w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[12px] font-black focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none appearance-none cursor-pointer hover:border-gray-200 shadow-sm transition-all shadow-sm font-bold" },
                    options.map(opt => React.createElement("option", { key: opt, value: opt }, opt))
                ),
                React.createElement("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold" }, React.createElement(Icon, { name: "ArrowRight", className: "rotate-90", size: 14 }))
            )
        ) : (
            React.createElement("input", { type: type, value: value, onChange: e => onChange(e.target.value), readOnly: readOnly, placeholder: placeholder, className: `w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[12px] focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none transition-all font-bold shadow-sm font-bold ${readOnly ? 'opacity-50 cursor-not-allowed font-mono bg-gray-100 shadow-inner shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none' : 'hover:border-gray-200 font-bold'}` })
        )
    )
);

document.addEventListener('DOMContentLoaded', () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App, null));
});