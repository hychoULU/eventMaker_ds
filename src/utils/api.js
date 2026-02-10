import { CLIENT_ID, API_KEY, FOLDER_ID, SCOPES } from './constants.js';

let tokenClient;
let gapiInitialized = false;
let gisInited = false;
let postAuthAction = null;

export const initGoogleApis = (setGapiInitialized, setGisInited, showToast, loadFromDrive) => {
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
    }
};

export const executeAfterAuth = (action, showToast) => {
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
        postAuthAction = action;
        
        // 중요: prompt를 빈 문자열('')로 설정해야 세션이 있을 때 팝업 없이 자동 로그인됩니다.
        tokenClient.requestAccessToken({ prompt: '' });
    }
};

export const uploadToDrive = async (events, nodes, choices, showToast) => {
    // 1. 저장할 데이터를 예쁘게 가공 (기존 로직 유지)
    const data = {
        "Event시트": events.map(e => ({
            ...e,
            TargetUnitCondition: (e.TargetUnitCondition || "").replace(/
/g, ',')
        })),
        "Node시트": nodes.map(({ depth, ...rest }) => rest),
        "Choice시트": choices.map(c => {
            const actionStr = (c.OnSelectAction || "").replace(/
/g, ',');
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

    // 데이터를 문자열(JSON)로 변환
    const fileContent = JSON.stringify(data, null, 2);
    const fileName = `DS_Events.json`;

    showToast("구글 드라이브에 저장 중...");

    try {
        // [단계 1] 같은 이름의 파일이 이미 있는지 확인
        const res = await gapi.client.drive.files.list({
            q: `'${FOLDER_ID}' in parents and name='${fileName}' and trashed=false`,
            fields: 'files(id)',
        });

        let fileId = null;

        if (res.result.files.length > 0) {
            // 이미 파일이 있다면 그 ID를 사용 (덮어쓰기)
            fileId = res.result.files[0].id;
            showToast("기존 파일을 업데이트합니다...");
        } else {
            // [단계 2] 파일이 없다면 '빈 파일(껍데기)' 먼저 생성
            // 이렇게 하면 복잡한 multipart 형식을 안 써도 됨
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

        // [단계 3] 확보된 File ID에 실제 JSON 내용 채워 넣기
        // uploadType='media'는 내용물만 깔끔하게 보낼 때 사용합니다.
        await gapi.client.request({
            path: '/upload/drive/v3/files/' + fileId,
            method: 'PATCH',
            params: { 
                uploadType: 'media' 
            },
            headers: {
                'Content-Type': 'application/json' // 중요: 내용물이 JSON임을 명시
            },
            body: fileContent
        });

        showToast("저장 성공!");
        
    } catch (error) {
        console.error("Upload Error:", error);
        
        // 에러 메시지 추출 (디버깅용)
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

export const loadFromDrive = async (setEvents, setNodes, setChoices, setSelectedEventId, showToast, recordHistory) => {
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
                const uiAct = (c.OnSelectAction || "").replace(/,/g, '
');
                let tT = "None", tV = "";
                if (c.ActiveTooltipType?.startsWith("ShowChoiceAction_")) { tT = "ShowChoiceAction"; tV = c.ActiveTooltipType.replace("ShowChoiceAction_", ""); }
                else if (c.ActiveTooltipType?.startsWith("Probability_")) { tT = "Probability"; tV = c.ActiveTooltipType.replace("Probability_", "").replace(/_/g, ','); }
                else if (c.ActiveTooltipType === "ShowAction") { tT = "ShowAction"; }
                return { ...c, OnSelectAction: uiAct, ActiveTooltipType: tT, ActiveTooltipValue: tV };
            });
            const pE = eS.map(e => ({
                ...e,
                TargetUnitCondition: (e.TargetUnitCondition || "").replace(/,/g, '
')
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