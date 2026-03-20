const idMap = {
  "NodeF100": "NodeF2000",
  "NodeF1000": "NodeF20000"
};

const replaceIdsInString = (str) => {
    if (!str) return str;
    let newStr = str;
    for (const oldId in idMap) {
        newStr = newStr.split(oldId).join(idMap[oldId]);
    }
    return newStr;
};

console.log(replaceIdsInString("ShowNextNode_NodeF100_100,ShowNextNode_NodeF1000_100"));
