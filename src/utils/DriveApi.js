import { CLIENT_ID, API_KEY, FOLDER_ID, SCOPES } from '../utils/constants.js';

let tokenClient;
let postAuthAction = null; // Stored here, managed by executeAfterAuth

export const initGoogleApis = (setGapiInitialized, setGisInited, showToast, loadFromDriveCallback) => {
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
                if (postAuthAction) {
                    const actionToRun = postAuthAction;
                    postAuthAction = null;
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
    };
};

export const executeAfterAuth = (action, showToast, gapiInitialized, gisInited) => {
    const isGapiReady = window.gapi && gapi.client && gapi.client.drive;
    const isGisReady = window.google && google.accounts && google.accounts.oauth2 && tokenClient;

    if (!isGapiReady || !isGisReady) {
        showToast("Google API 라이브러리를 로드 중입니다. 잠시 후 다시 시도해 주세요.");
        return;
    }

    const token = gapi.client.getToken();
    
    if (token && token.access_token) {
        action();
    } else {
        showToast("구글 인증이 필요합니다.");
        postAuthAction = action;
        tokenClient.requestAccessToken({ prompt: '' });
    }
};

export const uploadToDrive = async (events, nodes, choices, showToast) => {
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

    showToast("구글 드라이브에 저장 중...");

    try {
        const res = await gapi.client.drive.files.list({
            q: `'${FOLDER_ID}' in parents and name='${fileName}' and trashed=false`,
            fields: 'files(id)',
        });

        let fileId = null;

        if (res.result.files.length > 0) {
            fileId = res.result.files[0].id;
            showToast("기존 파일을 업데이트합니다...");
        } else {
            const createRes = await gapi.client.drive.files.create({
                resource: {
                    name: fileName,
                    parents: [FOLDER_ID],
                    mimeType: 'application/json'
                },
                fields: 'id'
            });
            fileId = createRes.result.id;
            showToast("새 파일을 생성했습니다...");
        }

        await gapi.client.request({
            path: '/upload/drive/v3/files/' + fileId,
            method: 'PATCH',
            params: { 
                uploadType: 'media' 
            },
            headers: {
                'Content-Type': 'application/json'
            },
            body: fileContent
        });

        showToast("저장 성공!");
        
    } catch (error) {
        console.error("Upload Error:", error);
        let errorMsg = "알 수 없는 오류";
        try {
            if (error.body) {
                const parsed = JSON.parse(error.body);
                errorMsg = parsed.error.message;
            } else if (error.result && error.result.error) {
                errorMsg = error.result.error.message;
            } else {
                errorMsg = error.message;
            }
        } catch (e) { errorMsg = error.toString(); }

        alert("저장 실패: " + errorMsg);
    }
};

export const loadFromDrive = async (setEvents, setNodes, setChoices, setSelectedEventId, showToast, recordHistory, gapiInitialized, gisInited) => {
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
};