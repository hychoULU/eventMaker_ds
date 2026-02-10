import React from 'react';

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

export default Icon;