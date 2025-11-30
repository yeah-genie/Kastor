     1|# UI/UX 개선 및 AI Assistant 통합 계획 (Kastor v2 MVP)
     2|
     3|## 0. 핵심 전략: Julius AI 대비 경쟁 우위
     4|**"Flow-First, Chat-Assisted"** (흐름 중심, AI 보조)
     5|- **투명성 (Transparency):** 블랙박스 챗봇이 아닌, AI가 생성한 로직을 **블록 스택**으로 시각화하여 검증 및 수정 가능하게 함.
     6|- **제어권 (Control):** 거시적 작업은 AI에게 위임(블록 생성), 미세 조정은 GUI 인스펙터에서 수행하는 하이브리드 UX.
     7|- **재사용성 (Reusability):** 일회성 대화가 아닌, 저장하고 공유할 수 있는 구조화된 워크플로우 제공.
     8|
     9|## 0.1 AI 패널 고도화 (Cursor 벤치마킹)
    10|- **컨텍스트 태깅 (@Mentions):** `@Block`, `@Column` 등으로 분석 대상을 명확히 지정하는 UI.
    11|- **실행 가능한 답변 (Actionable UI):** 단순 텍스트 답변이 아닌, `[Add Block]`, `[Apply Settings]` 버튼을 제공하여 즉시 실행.
    12|- **리치 미디어 (Mini-Widgets):** 채팅 내에서 미니 차트나 데이터 요약 테이블을 미리보기로 제공.
    13|
    14|## 0.2 데이터 소스 확장 (Data Source Expansion)
    15|타겟 페르소나(마케터, PM, 창업가)가 주로 사용하는 데이터 소스를 완벽 지원하여 진입 장벽을 제거합니다.
    16|- **A. 파일 업로드 (File Upload):** CSV, Excel(`.xlsx`), JSON 지원. Drag & Drop 및 인코딩 자동 보정.
    17|- **B. 클라우드 커넥터 (Cloud Connectors):** Google Sheets, Notion Database 연동 (URL 입력 방식).
    18|- **C. 붙여넣기 (Paste Zone):** 엑셀/웹 테이블 데이터를 `Ctrl+V`로 즉시 변환.
    19|
    20|---
    21|
    22|## 1. 헤더 및 내비게이션 (상단 바)
    23|- [x] **글로벌 상단 바 (Top Bar):** 화면 전체 너비를 차지하는 고정 상단 바(`h-14`)를 신설합니다.
    24|- [x] **로고 위치 이동:** "Kastor" 로고와 아이콘을 상단 바의 왼쪽으로 이동시킵니다.
    25|- [x] **AI Assistant 트리거:** 상단 바 중앙에 "AI Assistant" 버튼을 배치하여, 언제든 AI를 호출해 블록을 생성하거나 분석을 요청할 수 있게 합니다.
    26|
    27|## 2. AI Assistant 통합 (Block Generator)
    28|- [x] **AI 채팅 패널 (AI Chat Panel):**
    29|    - **위치:** 우측 패널 탭 (Inspector / AI) 또는 독립적인 Drawer.
    30|    - **기능:** 
    31|        1. **블록 생성:** "CSV 파일 로드해줘" -> Load Block 생성 및 배치.
    32|        2. **데이터 분석:** "매출 추이 보여줘" -> Visualize Block 생성 및 설정 완료.
    33|        3. **맥락 인식:** 현재 선택된 블록의 데이터를 기반으로 다음 행동 제안.
    34|    - **UI:** 대화형 인터페이스 + "액션 버튼"(예: `[블록 추가하기]`)이 포함된 답변 카드.
    35|- [x] **Actionable Message 구현:** AI 답변 내에 실제 블록 생성/수정을 트리거하는 버튼 컴포넌트 구현.
    36|- [x] **Context Mentions UI:** 입력창에 `@` 입력 시 블록 리스트 팝업 구현.
    37|
    38|## 3. 시각적 계층 및 대비 (Contrast)
    39|- [x] **블록 카드 대비 개선:** 어두운 캔버스 위에서 블록 카드가 명확히 구분되도록 배경/테두리 대비를 강화합니다.
    40|- [x] **타이포그래피:** `slate-500` 계열의 어두운 텍스트를 `slate-300/400`으로 밝게 조정하여 가독성을 확보합니다.
    41|- [x] **라이브러리 패널:** 블록 아이템에 아이콘과 호버 효과를 강화하여 클릭 유도성을 높입니다.
    42|
    43|## 4. 워크스페이스 경험 (Workspace Experience)
    44|- [x] **연결선 가시성:** 블록 간 데이터 흐름을 보여주는 연결선을 굵게 하고, 밝은 그라데이션(Cyan-Purple)을 적용합니다.
    45|- [x] **초기 상태 가이드 (Empty State):** "AI에게 물어보거나, 라이브러리에서 블록을 추가하세요"라는 명확한 가이드와 시각적 큐(화살표)를 제공합니다.
    46|
    47|## 5. 인스펙터 및 컨트롤 (Inspector & Controls)
    48|- [x] **Mock 설정 UI 구현:** 각 블록의 "설명 가능한(Explainable)" 요소를 시각화합니다.
    49|    - **LOAD:** 파일 소스 및 데이터 미리보기.
    50|    - **TRANSFORM:** 적용된 필터/로직 표시 (AI가 짠 로직을 보여줌).
    51|    - **VISUALIZE:** 차트 설정 및 축 매핑 제어.
    52|    - **INSIGHT:** 발견된 인사이트 목록 및 근거 데이터.
    53|- [x] **패널 UX:** 부드러운 열기/닫기 애니메이션과 명확한 토글 버튼을 적용합니다.
    54|
    55|---
    56|
    57|## 6. 캔버스 인터랙션 (Canvas Interaction) - **New**
    58|워크플로우가 복잡해질 경우를 대비한 내비게이션 편의성 강화.
    59|- [x] **Zoom & Pan:** 
    60|    - 줌인/줌아웃 컨트롤러 및 단축키(`Ctrl` + Wheel) 지원.
    61|    - `Space` + Drag로 캔버스 화면 이동 (Panning).
    62|- [x] **Minimap:** 전체 워크플로우 구조를 조망할 수 있는 미니맵 위젯 추가.
    63|
    64|## 7. 블록 관리 기능 (Block Management) - **New**
    65|- [x] **Context Menu (우클릭 메뉴):** 블록 복제(Duplicate), 삭제(Delete), 비활성화(Disable) 기능.
    66|- [x] **Multi-Select:** `Shift` + Click 또는 드래그로 다중 선택 및 일괄 이동/삭제.
    67|- [x] **Undo/Redo:** `zundo` 미들웨어 등을 활용한 작업 실행 취소/다시 실행(`Ctrl+Z/Y`).
    68|
    69|## 8. AI 경험 강화 (Enhanced AI Experience) - **New**
    70|- [x] **Block Highlighting:** AI가 답변에서 특정 블록을 언급할 때 캔버스 내 해당 블록 하이라이팅/포커싱.
    71|- [ ] **Diff View:** AI에 의한 설정 변경 사항을 "변경 전/후" 비교 UI로 제공.
    72|- [x] **Chat-only Initial State:** 새 프로젝트 시작 시, 복잡한 워크스페이스 대신 AI 채팅창만 중앙에 배치하여 대화로 시작하는 경험(Onboarding) 제공.
    73|- [x] **Rich Input:**
    74|    - **File Upload:** 채팅창에서 바로 파일 첨부하여 분석 시작.
    75|    - **Voice Input:** 음성으로 명령 입력 (STT). (UI only)
    76|    - **Templates:** "마케팅 대시보드", "재무 분석" 등 템플릿 갤러리 제공. (To be implemented)
    77|
    78|## 9. 데이터 검증 (Data Validation) - **New**
    79|- [x] **Data Preview Tooltip:** 블록 연결선 호버 시 해당 지점의 데이터 샘플(Top 5 rows) 툴팁 표시.
    80|- [x] **Error Handling UI:** 에러 발생 시 블록 시각적 경고 및 "Fix with AI" 버튼 제공.
    81|
    82|## 10. 고급 사용자 기능 (Advanced Features for Analysts) - **Completed**
    83|- [x] **Code View (< >):** 각 블록의 내부 로직을 Python/SQL 코드로 확인하고 내보내는 기능.
    84|- [x] **Auto-Layout:** 복잡한 블록 스택을 자동으로 정렬해주는 버튼.
    85|- [x] **Template Gallery:** 자주 쓰는 워크플로우를 저장하고 불러오는 모달 UI.
    86|- [x] **Execution Flow:** 명시적인 'Run' 버튼과 단계별 실행 상태 시각화 (Loading -> Success).
    87|
    88|## 11. 자동화 및 지속성 강화 (Automation & Persistence) - **Zapier Benchmarking**
    89|Kastor를 일회성 분석 도구에서 지속적 자동화 도구로 업그레이드합니다.
    90|- [x] **Schedule Block:** 워크플로우를 주기적으로 실행하는 블록 (예: 매주 월요일 실행).
    91|- [x] **Global Rules (Memory):** AI에게 영구적인 지침(Behaviors)을 설정하는 메모리 기능.
    92|- [x] **Run History (Log):** 과거 실행 이력 및 AI 판단 로그를 보여주는 패널.
    93|
    94|## 12. AI Copilot & 최적화 (Advanced AI) - **Completed**
    95|Zapier의 Autonomous Creation 및 Proactive Suggestions 기능을 벤치마킹합니다.
    96|- [x] **Proactive Optimization:** AI가 생성된 워크플로우를 분석하여 성능/구조 개선 제안 (예: "이 Transform 블록 2개를 합치면 더 빠릅니다").
    97|- [x] **Auto-Troubleshooting:** 에러 발생 시 단순히 오류 메시지만 띄우는 것이 아니라, "Date Parser 블록을 추가하면 해결됩니다"라고 구체적인 해결책 블록을 제안.
    98|- [x] **Canvas Annotations:** AI가 왜 이렇게 블록을 구성했는지 캔버스 위에 주석(Sticky Note) 형태로 설명.
    99|
   100|## 13. Target Audience 요청 추가 기능 (User Feedback) - **Completed**
   101|타겟 오디언스(마케터, 창업가, 분석가)가 실제 업무에서 느끼는 불편함을 해소합니다.
   102|- [x] **Block Renaming:** 블록 제목을 클릭하여 인라인으로 수정 (예: "Load Block" -> "매출 데이터").
   103|- [x] **Data Preview Modal:** 연결선이나 블록 더블 클릭 시 전체 데이터를 큰 화면(모달)으로 확인.
   104|- [x] **Google Sheets Connector:** URL 입력만으로 구글 시트 데이터를 가져오는 커넥터 (Mock).
   105|- [x] **Export as Image/PDF:** 분석 결과(차트)나 워크플로우를 이미지로 저장.
   106|- [x] **Dashboard View:** 편집 모드와 뷰 모드를 분리하여 차트만 모아보기.
   107|- [x] **Manual Sticky Notes:** 사용자가 직접 캔버스에 메모를 남기는 기능 (더블 클릭).
   108|- [x] **SQL Editor:** Transform 블록 내에 SQL 직접 입력 모드 추가.
   109|
   110|## 14. UI/UX Refinement for Target Audience (Post-MVP)
   111|타겟 유저의 생산성을 극대화하고 학습 곡선을 낮추기 위한 개선 사항들입니다.
   112|- [x] **Smart Chart Recommendations (Marketers):** 데이터 타입을 분석하여 가장 적합한 차트(Line vs Bar)를 아이콘 뱃지로 추천.
   113|- [x] **Reactive Stale State (Founders):** 상위 블록 설정 변경 시, 하위 블록에 "업데이트 필요(Stale)" 상태를 시각적으로 표시하여 재실행 유도.
   114|- [x] **Inline Block Insertion (All):** 블록 간 연결선에 마우스를 올리면 `+` 버튼이 나타나 중간에 새 블록을 즉시 삽입.
   115|- [x] **Data Quality Indicator (Analysts):** Load/Transform 블록에 데이터 건전성(결측치 %, 타입 오류) 요약 정보를 신호등 컬러로 표시.
   116|- [x] **Onboarding Tour (New Users):** 최초 진입 시 3단계(Data -> AI -> Visualize) 튜토리얼 오버레이 제공.
   117|    - **Step 1. Welcome & Goal:** "Kastor에 오신 것을 환영합니다. 어떤 분석을 하고 싶으신가요?" (AI 채팅창 포커스)
   118|    - **Step 2. Library & Blocks:** "필요한 도구는 라이브러리에서 꺼내 쓰세요." (라이브러리 패널 하이라이트)
   119|    - **Step 3. Canvas & Result:** "블록을 연결하고 결과를 확인하세요." (캔버스 영역 하이라이트)
   120|
   121|## 15. Polish & Micro-Improvements (Immediate Fixes) - **User Feedback**
   122|사용자가 즉각적으로 체감하는 사소하지만 중요한 UI 디테일을 다듬습니다.
   123|- [x] **Seamless Landing Background:** 랜딩 페이지 중앙 컨테이너와 전체 배경 간의 색상 단절을 없애고 자연스러운 그라데이션으로 통합.
   124|- [x] **Refine Suggestions UI:** 하단 추천 질문 칩을 더 작고 세련되게(Ghost button 스타일) 변경하거나, 클릭률이 낮은 경우 위치 조정(숨김 처리).
   125|- [x] **Transparent Logo:** 상단 바 로고 파일에 배경이 포함되어 있다면 제거하고, 다크 모드에 최적화된 투명 SVG 적용.
   126|- [x] **Input Field Focus:** 채팅 입력창 클릭 시 테두리 발광(Glow) 효과를 강화하여 입력 준비 상태 강조.
   127|- [x] **Consistent Button Sizes:** TopBar의 'Dashboard', 'Run', 'History' 버튼 높이와 패딩을 통일하여 시각적 안정감 확보.
   128|
   129|## 16. Block System Expansion (Scratch-like Experience) - **User Feedback**
   130|스크래치처럼 다양하고 직관적인 블록을 제공하여 분석의 깊이를 더하고, 색상 그룹핑으로 이해를 돕습니다.
   131|- [x] **Block Grouping & Colors:** 블록 카테고리별 색상 구분 시스템 도입 (Data=Blue, Preprocessing=Purple, Analysis=Amber, Viz=Pink, Action=Green).
   132|- [x] **New Block Types:**
   133|    - **Data Sources:** `API_CALL`
   134|    - **Preprocessing:** `FILTER`, `SORT`, `JOIN`, `GROUP_BY`, `CLEAN`
   135|    - **Analysis:** `ASK_AI`
   136|    - **Visualization:** `KPI_CARD`
   137|    - **Action:** `EXPORT`, `NOTIFY`
   138|- [x] **Update Library Panel:** 카테고리별 아코디언 UI로 개편.
   139|
   140|## 17. Feedback Refinement (User Requests) - **New**
   141|사용자 피드백을 바탕으로 한 추가적인 UX 개선 및 기능 작동 보완 사항입니다.
   142|- [x] **Separate Non-Core Blocks:** 그룹화, 스케줄 등의 유틸리티 블록을 코어 분석 블록과 시각적으로 분리하거나 별도 영역으로 배치.
   143|- [x] **Fix Minimap Overlap:** 미니맵이 캔버스 컨트롤(Zoom 등)이나 인라인 버튼과 겹치는 문제를 해결(위치 이동 또는 Z-index 조정).
   144|- [x] **Functional Library Search:** 라이브러리 패널의 검색창에 실제 필터링 로직을 구현하여 작동하도록 수정.
   145|- [x] **Compact Block Design:** 블록의 크기(Padding, Margin)를 줄여 스크롤을 최소화하고 한 화면에 더 많은 블록을 표시.
   146|- [x] **Verify UI Interactivity:** UI는 존재하지만 작동하지 않는 요소들(예: 드롭다운, 토글 등)을 전수 조사하여 기능 연결.
   147|
   148|## 18. Final Polish & Release Prep (Target Audience Focus) - **New**
   149|Target Audience(마케터, 창업가)가 "완성된 제품"으로 느끼게 하기 위한 최종 UI/UX 개선.
   150|- [x] **Improve Landing Page:** 
   151|    - **Trust Signals:** "AI-Native Data Workflow Builder" 태그 강화.
   152|    - **Hero Visual:** 정적인 텍스트 대신 역동적인 배경이나 간단한 데모 비디오 추가 고려.
   153|    - **Sample Data CTA:** "Try Sample Data" 버튼을 추가하여 파일이 없는 유저도 즉시 체험 유도.
   154|- [x] **Refine Workspace Visuals:** 
   155|    - **Flat Edges:** 첫 번째 블록의 상단과 마지막 블록의 하단을 평평하게 마감하여 "완성된 카드" 느낌 부여.
   156|    - **Compact Layout:** 블록 스택을 왼쪽으로 정렬하고 패딩을 줄여 정보 밀도 향상.
   157|- [x] **Enhance Canvas Result Preview:** 
   158|    - **Visualize Block:** 단순 아이콘 대신 미니 스파크라인이나 차트 실루엣 표시.
   159|    - **Insight Block:** "Insight" 라벨보다 핵심 지표(예: "매출 +24%")를 더 크게 강조.
   160|- [x] **Smart Empty State & Connection Glow:** 블록 간 연결 상태를 더 명확히 보여주는 시각적 큐(Glow effect) 추가.
   161|
   162|## 19. Cursor-like AI Agent UX Benchmark - **New**
   163|Cursor AI의 에이전트 중심 인터페이스를 벤치마킹하여, AI가 단순 챗봇이 아닌 "능동적 파트너"로 동작하도록 UX를 전면 개편합니다.
   164|- [x] **Unified Right Panel (No Inspector):**
   165|    - 기존 `Inspector`(설정 패널) 탭을 과감히 삭제하고, 우측 패널을 100% **AI Assistant** 전용 공간으로 할당.
   166|    - 블록 설정은 AI 채팅 내에서 "인라인 폼"으로 제공하거나, 캔버스 상의 팝오버(Contextual Popover)로 대체.
   167|- [x] **Context-Aware Chat Interface:**
   168|    - **@Mentions:** `@BlockName`, `@DataColumn` 등을 통해 대화의 맥락을 명시적으로 지정 (Cursor의 파일 참조 기능 벤치마킹).
   169|    - **Rich Context:** 현재 선택된 블록의 데이터 미리보기나 설정을 채팅창 하단에 "Context Chip"으로 자동 첨부.
   170|- [x] **Inline Diff & Actions:**
   171|    - AI가 제안한 변경 사항(코드/설정)을 "Apply" 버튼 하나로 즉시 반영하고, 변경 전/후를 비교하는 **Diff View** 제공.
   172|    - 채팅창 내에서 바로 "Run Block", "Visualize" 등의 액션 버튼 제공.
   173|- [x] **Agentic Workflow:**
   174|    - "생각하는 과정(Thinking Process)"을 UI에 노출하여 투명성 확보.
   175|    - 복잡한 작업 시 "Plan -> Execute -> Review" 단계를 시각화.
   176|
   177|## 21. Emergency Fixes: Real Visualization - **In Progress**
   178|사용자가 "진짜 그래프"와 "대시보드다운 대시보드"를 원한다는 피드백을 긴급 반영합니다.
   179|- [ ] **Real Chart Rendering:** `recharts` 라이브러리를 도입하여 VisualizeBlock 내부에 실제 움직이는 그래프(Bar, Line, Pie)를 구현.
   180|- [ ] **Dynamic Mock Data:** 항상 똑같은 "100, 200" 데이터가 아닌, 블록별/차트별로 랜덤 생성된 그럴듯한 데이터를 연결.
   181|- [ ] **Expand Mode (Analyst Focus):** 블록 내의 작은 차트를 전체 화면 모달로 띄워 상세 데이터를 분석할 수 있는 기능 추가.
   182|- [ ] **Dashboard 2.0:** 단순 그리드가 아닌, Resize 가능한 위젯 형태의 진짜 대시보드 뷰로 업그레이드.
   183|
   184|## 22. Onboarding Experience 2.0 (Rows-inspired but Better) - **New**
   185|Rows.com의 직관성을 벤치마킹하되, 정적인 시트 대신 "Dynamic Flow"를 보여주는 Kastor만의 차별화된 온보딩입니다.
   186|
   187|### 1. Living Canvas (Background Live Preview)
   188|- **Concept:** 정적인 배경 대신, 내가 만들고자 하는 것이 무엇인지 **배경에서 미리 보여주는(Preview)** 살아있는 캔버스.
   189|- **Implementation:**
   190|    - 데모 카드(SaaS, Marketing)에 마우스를 올리면(Hover), 배경 캔버스에 희미한 **유령 블록(Ghost Blocks)**들이 나타나 자동으로 연결되는 애니메이션 재생.
   191|    - 클릭하기 전부터 "아, 이걸 누르면 이런 흐름이 만들어지는구나"를 시각적으로 학습.
   192|    - `framer-motion`을 활용한 부드러운 Opacity/Position 전환.
   193|
   194|### 2. Showcase Wall (Hero Section)
   195|- **Concept:** 채팅봇 인사말 대신, 넷플릭스처럼 **"성공적인 분석 결과물"**을 먼저 보여주고 선택하게 함.
   196|- **Implementation:**
   197|    - 기존 채팅 버블 대신 3-4개의 **High-Fidelity 카드** 배치.
   198|        - `📈 SaaS MRR`: "Detect Churn Spikes" (실제 차트 썸네일 포함)
   199|        - `📣 Marketing`: "Optimize ROAS"
   200|        - `📦 Commerce`: "Predict Stockouts"
   201|    - 카드를 클릭하면 화면이 전환되며 해당 시나리오가 즉시 빌드됨.
   202|
   203|### 3. Contextual Particle Effect
   204|- **Concept:** 사용자가 입력하는 의도(Intent)에 따라 UI가 반응하여 몰입감 증대.
   205|- **Implementation:**
   206|    - 입력창에 타이핑하는 키워드에 따라 주변에 색상 입자(Particle)가 반응.
   207|        - "Data", "CSV" -> **Blue Particles** (데이터)
   208|        - "Analyze", "Why" -> **Purple Particles** (AI/분석)
   209|        - "Chart", "Plot" -> **Pink/Amber Particles** (시각화)
   210|    - Kastor의 블록 컬러 시스템을 은연중에 학습시키는 효과.
   211|
   212|### 4. The "Switch" Moment (One-Click Clone)
   213|- **Concept:** "처음부터 만들지 마세요. 완성품에서 데이터만 갈아끼우세요."
   214|- **Implementation:**
   215|    - 데모 시나리오 실행 완료 후, `Load Block`이 강조(Pulse)되며 툴팁 표시.
   216|    - **Action:** "이 로직이 마음에 드나요? 클릭해서 **내 데이터**로 교체하세요."
   217|    - 클릭 시 파일 업로드 창이 뜨고, 업로드 완료 시 기존 로직이 새 데이터에 맞춰 재실행됨.
   218|