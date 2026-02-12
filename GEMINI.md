0. 기능을 추가할 때 마다, index와 script.js에서 버전을 표기 중인 곳의 버전을, 반드시 버전을하나씩 올린다. 
Gemini.md를 고치라는 말이 아님.
ex) Ds Event Editor - v3.0.4 -> Ds Event Editor - v3.0.5.    VisualEditor V3.0.4 ->  VisualEditor V3.0.5 등 버전이 들어가는 모든 곳의 버전을 하나씩 올려야 한다.

버전 맨 끝이 두 자리수가 넘어간다면, 가운데 자리를 하나 버전을 올린다.
ex) v3.0.10 - X
v3.1.0 - O

반드시. 대화가 끝날 때 마다, 커밋을 하거나 Push 하지 말고 어떤 점이 변경되었는지 말 해줄 것.

앞으로의 작업 방식:
   * 코드 수정: 예전처럼 src 폴더 안에 있는 파일들 수정 (App.js,Icon.js 등)
   * 변경 사항 확인: 수정을 완료한 후, 빌드 명령어 실행 필요

    이 명령어를 실행하면 dist/bundle.js 파일이 자동으로 업데이트

1. 기본적인 시트 Export 형식
파일 중 DS_SaveSample.json 참고.

Event 시트
EventID
DevComment
StartNodeID
StartCondition
TargetUnitCondition
EventScope
EventType
Weight
IsRepeatable
CoolDown

Node시트
NodeID
DevComment
LinkedEventID
NodeType
ChoiceIDs

Choice시트
ChoiceID
DevComment
LinkedNodeID
ActiveCondition
OnSelectAction
ActiveTooltipType

2. 모든 ID들은, 편집하지 못하게 자동으로 기입.
중복된 키를 만들지 않기 위해서 넣은 조치.

1)EventID규칙
 : Event_타입+번호(order)
Ex) Event_Fixed0, Event_Random0

2.)NodeID규칙
 : Node_이벤트타입+번호(order)+노드 좌표


ex)Event_Random0의 0,0의 노드는 이렇게 표기.
Ex) NodeR000
Event_Random10의 0,0의 노드는 이렇게 표기.
NodeR1000

만약 분기상 뎁스가 있을 때는 다음과 같이 표기

NodeF010
NodeF011
-> 뎁스 1의 0번 노드, 0번 노드

맨 뒤 두자리는 반드시 Depth+Depth내에서의 번호, 즉 좌표. 하드캡으로 9를 넘어가지 않음(하기 서술)

3)ChoiceID규칙
Choice_이벤트타입+번호+노드좌표+Order
ex)Event_Random0의 0,0위치의 노드의  0번 선택지.
ChoiceR0000


3. 하드캡
어떤 이벤트의 Node의 Depth 0 노드는 무조건 한개. 삭제도, 추가도 불가 처리.
어떤 Node의  Choice갯수는 최대 3개 까지. 이 이상은 생성 불가 처리.
어떤 이벤트의 최대 Depth는 9까지야. 0~9Depth까지 존재.
어떤 이벤트 Depth의 최대 Node갯수는 10개. 
즉, 노드 맨 뒤의 두자리는 반드시 0~9 사이의 좌표값.
또한 즉, 모든 이벤트의 최대 노드 갯수는, 0뎁스에 1개, 1~9뎁스에 각각10개 해서 91개  까지만 존재할 수 있다.




4. 
비주얼 이벤트 에디터(Visual Event Editor) 시스템 명세서 (v3.1.0 기준)

1) 데이터 구조 및 논리 규칙

이벤트(Event): 고정(Fixed) 및 랜덤(Random) 타입을 지원하며, 각 이벤트는 고유의 시작 노드(Depth 0)를 가진다.
노드(Node):
타입: Normal, Reward, Combat, End 등 4가지 타입을 지원한다.
ID 생성 규칙: Node + 타입약어 + 숫자 + 뎁스 + 인덱스 조합으로 생성하며, 삭제된 ID의 빈자리를 우선 채우는 지능형 인덱싱을 사용한다.
표시 스타일: 지문(DevComment)은 정자체(Non-italic)로 표기하며, 줄바꿈(\n)이 화면에 그대로 반영되는 whitespace-pre-wrap 속성을 가진다.
선택지(Choice): 노드 하단에 위치하며, 드래그 앤 드롭을 통해 노드 간 연결을 생성한다.

2) 시스템 하드캡(Hard Cap) 제한

뎁스(Depth) 제한: 0단계부터 9단계까지 총 10개의 열(Column)만 생성 가능하다.
노드(Node) 제한: 각 단계(Depth)마다 최대 10개의 노드만 생성 가능하다.
선택지(Choice) 제한: 하나의 노드는 최대 3개의 선택지만 가질 수 있다.
이벤트 총량: 한 이벤트 내의 최대 노드 개수는 100개(10단 * 10개)로 제한된다.

3) 핵심 기능 스펙

연결선(Connection) 및 가중치(Weight) 편집:
선택지에서 노드로 드래그 시 ShowNextNode_NodeID_100 액션이 자동 생성된다.
가중치가 100인 경우 숫자를 숨겨 가독성을 유지하되, 선 주위의 투명한 '히트 영역'을 더블클릭하여 언제든 가중치를 수정할 수 있다.
가중치 수정 시 정규식을 사용하여 OnSelectAction 내의 해당 노드 가중치 숫자만 정밀하게 교체한다.

확률형 툴팁(Probability Tooltip):
ActiveTooltipType을 Probability로 설정 시 여러 선택지를 드래그 앤 드롭으로 연결할 수 있다.

중복 등록 방지: ActiveTooltipValue에 이미 등록된 선택지 ID는 다시 추가되지 않도록 차단 로직이 작동한다.

확률 계산 공식: 소스 선택지의 OnSelectAction에 적힌 모든 ShowNextNode 가중치의 합계를 분모로, 대상 노드로 향하는 가중치를 분자로 계산하여 (n%) 형태로 출력한다.

우클릭 확장 메뉴(Context Menu):

노드 및 선택지 우클릭 시 전용 메뉴가 나타난다.
선택지 메뉴에서는 툴팁 타입(Self, Choice, Probability, None)을 즉시 변경할 수 있다.
메뉴 외부 클릭 시 자동으로 팝업이 닫히는 기능을 포함한다.

4) 사용자 편의 및 단축키
Undo / Redo: Ctrl/Cmd + Z 및 Ctrl/Cmd + Y(또는 Shift + Z)를 지원한다.
Export: Ctrl/Cmd + S 입력 시 현재 작업 중인 전체 데이터를 JSON 파일로 즉시 다운로드한다.

보호 로직: Depth 0인 시작 노드는 시스템 오류 방지를 위해 삭제가 불가능하도록 설계되어 있다.