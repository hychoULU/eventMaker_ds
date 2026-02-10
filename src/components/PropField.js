import React from 'react';
import Icon from './Icon.js';

const PropField = ({ label, value, onChange, readOnly = false, type = "text", options = [], placeholder = "" }) => (
    React.createElement("div", { className: "group/field font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold" },
        React.createElement("label", { className: "text-[10px] font-black text-gray-400 block mb-2 uppercase tracking-widest group-focus-within/field:text-blue-500 transition-colors font-bold font-bold font-bold font-bold font-bold font-bold" }, label),
        type === "textarea" ?
            React.createElement("textarea", { value: value, onChange: e => onChange(e.target.value), rows: "5", readOnly: readOnly, placeholder: placeholder, className: `w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[12px] focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none transition-all font-medium shadow-sm font-bold ${readOnly ? 'opacity-50 cursor-not-allowed bg-gray-100 shadow-none' : 'hover:border-gray-200 font-bold'}` }) :
        type === "select" ?
            React.createElement("div", { className: "relative font-bold font-bold" },
                React.createElement("select", { value: value, onChange: e => onChange(e.target.value), className: "w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[12px] font-black focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none appearance-none cursor-pointer hover:border-gray-200 shadow-sm transition-all shadow-sm font-bold" },
                    options.map(opt => React.createElement("option", { key: opt, value: opt }, opt))
                ),
                React.createElement("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold font-bold" }, React.createElement(Icon, { name: "ArrowRight", className: "rotate-90", size: 14 }))
            ) :
            React.createElement("input", { type: type, value: value, onChange: e => onChange(e.target.value), readOnly: readOnly, placeholder: placeholder, className: `w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[12px] focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none transition-all font-bold shadow-sm font-bold ${readOnly ? 'opacity-50 cursor-not-allowed font-mono bg-gray-100 shadow-inner shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none shadow-none' : 'hover:border-gray-200 font-bold'}` })
    )
);

export default PropField;