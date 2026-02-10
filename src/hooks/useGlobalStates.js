import { useState, useRef, useCallback } from 'react';

export const useGlobalStates = () => {
    const [events, setEvents] = React.useState([]);
    const [nodes, setNodes] = React.useState([]);
    const [choices, setChoices] = React.useState([]);
    const [selectedEventId, setSelectedEventId] = React.useState("");
    const [selectedElement, setSelectedElement] = React.useState(null);
    const [viewMode, setViewMode] = React.useState('editor');
    const [deleteModal, setDeleteModal] = React.useState({ show: false, type: null, id: null });
    const [showImportModal, setShowImportModal] = React.useState(false);
    const [importText, setImportText] = React.useState("");
    const [toast, setToast] = React.useState({ show: false, message: "" });
    const [gapiInitialized, setGapiInitialized] = React.useState(false);
    const [gisInited, setGisInited] = React.useState(false);

    const [editingNodeCommentId, setEditingNodeCommentId] = React.useState(null);
    const [editingChoiceCommentId, setEditingChoiceCommentId] = React.useState(null);
    const [editingEventCommentId, setEditingEventCommentId] = React.useState(null);
    const [editingWeightData, setEditingWeightData] = React.useState(null);
    const [tempValue, setTempValue] = React.useState("");

    const [tooltip, setTooltip] = React.useState({ show: false, x: 0, y: 0, content: "" });
    const [draggingChoiceId, setDraggingChoiceId] = React.useState(null);
    const [dropTargetId, setDropTargetId] = React.useState(null);
    const [ctxMenu, setCtxMenu] = React.useState({ show: false, x: 0, y: 0, type: null, id: null });
    const [clipboard, setClipboard] = React.useState(null);
    const [collapsedSections, setCollapsedSections] = React.useState({});
    const [searchQuery, setSearchQuery] = React.useState("");
    
    const canvasRef = React.useRef(null);
    const elementRefs = React.useRef({});
    const editingElementRef = React.useRef(null); // Ref to currently edited DevComment input/textarea
    const hasAutoLoaded = React.useRef(false);
    const [undoStack, setUndoStack] = React.useState([]);
    const [redoStack, setRedoStack] = React.useState([]);

    const showToast = React.useCallback((msg) => {
        setToast({ show: true, message: msg });
    }, []);

    const recordHistory = React.useCallback(() => {
        setUndoStack(prev => [...prev.slice(-49), JSON.stringify({ events, nodes, choices })]);
        setRedoStack([]);
    }, [events, nodes, choices]);

    return {
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
    };
};
