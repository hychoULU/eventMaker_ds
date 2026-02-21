export function getEventSummary(eventId) {
    if (!eventId) return "E";
    const match = eventId.match(/_(Random|Fixed|Npc|Tutorial)(\d+)/); // Added Npc, Tutorial type
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

// Other event helper functions will go here.