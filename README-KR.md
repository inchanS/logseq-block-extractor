### [ENGLISH](README.md)

# Block Extractor Plugin for Logseq

![GitHub stars](https://img.shields.io/github/stars/inchans/logseq-block-extractor?style=flat&logo=apachespark)
![GitHub all releases](https://img.shields.io/github/downloads/inchanS/logseq-block-extractor/total?logo=github) ![GitHub release (latest by date)](https://img.shields.io/github/v/release/inchanS/logseq-block-extractor?logo=rocket)  ![GitHub](https://img.shields.io/github/license/inchanS/logseq-block-extractor?logo=gnu)



![logo](icon.png)  

## 개요

**Block Extractor Plugin**는 Logseq의 페이지 하단에서 볼 수 있는 **"Linked References"의 내용을 추출하여 Markdown파일로 내보낼 수 있도록 도와주는 플러그인**입니다. 특정 태그(또는 페이지)를 참조하는 모든 블록을 계층 구조를 유지하며 추출합니다. 기본 태그 또는 페이지(primary tag)와 선택적으로 필터 키워드를 입력하면, Logseq 데이터베이스 쿼리를 통해 해당 태그(또는 페이지)를 참조하는 블록(하위 블록 포함)을 모두 가져오고, 키워드가 있으면 해당 키워드를 포함하는 블록만 필터링합니다. 이는 마치 Logseq 페이지 하단의 "Linked References"에서 설정하는 필터 기능과 거의 유사합니다. 최종 결과는 Markdown 형식으로 생성되어 다운로드할 수 있습니다. 이 플러그인을 통해 Logseq 그래프에서 원하는 내용을 빠르고 쉽게 수집, 정리, 공유할 수 있습니다.

> **개인적인 의견:**  
> Logseq를 사용하는 가장 큰 이유는 바로 이 "Linked References" 기능입니다. 이 강력한 기능은 아쉽게도 그 내용을 오롯이 추출할 수 없다는 단점이 있습니다. 이에 수작업으로 참조된 블록을 복사해 붙여넣기할 필요 없이 플러그인으로 간단하게 관련 노트나 프로젝트 단편을 신속하게 모을 수 있습니다. 특히 키워드 기반 계층 필터링 기능 덕분에 필요한 정보만 정확히 추출할 수 있어, 불필요한 정보를 걸러내는 데 큰 도움이 됩니다. 이는 Logseq에서 백링크로 쌓아온 가치있는 정보들을 쉽고 가볍게 추출하여, 더욱 정확하고 더 적은 토큰 비용으로 AI 분석 및 정리를 의뢰할 수도 있습니다.

---

![Logseq block-extractor UI](asset/logseq-block-extractor.png)  

## 주요 기능

1. **태그 기반 추출 및 본문 포함 옵션**
    - 지정한 기본 태그(primary tag) 또는 페이지를 참조하는 블록을 자동으로 검색합니다. (대소문자를 구분하지 않습니다.)
    - 하위 블록까지 모두 포함하여 계층 구조를 유지한 상태로 추출합니다.
    - 참조된 블록뿐만 아니라, **기본 태그(Primary Tag) 문서 원본의 전체 본문**도 결과물 최상단에 함께 추출할 수 있습니다.

2. **선택적 키워드 필터링**
    - 쉼표로 구분된 키워드 목록을 입력할 수 있습니다.
    - 키워드 중 하나 이상을 포함하는 블록(또는 해당 블록의 자손)들이 결과에 포함됩니다.
    - 키워드가 2개 이상이면, 쉼표로 구분하며 키워드간 **All**(AND), **Any**(OR) 조건을 설정할 수 있습니다.
    - 키워드 앞에 -(하이픈)을 붙이면, 해당 키워드는 제외 필터로 동작합니다.
    - 필터 키워드를 비워두면, 기본 태그를 참조하는 모든 블록(및 하위 블록)을 추출합니다.

3. **Markdown 내보내기 및 텍스트 자동 정제**
    - 기본적으로 페이지 이름 순으로(또는 원하는 property 기준으로) 정렬된 블록을 Markdown 파일(`.md`)로 생성합니다.
    - `logseq.order-list-type:: number`와 같은 Logseq 고유의 메타데이터(Properties) 텍스트를 깔끔하게 자동 제거하고, 마크다운 표준 순서형 목록(`1. `)으로 변환하여 다른 에디터에서도 완벽하게 호환됩니다.
    - **(New in 2.0!)** 유연한 링크 서식: 기본값으로 `[[링크]]`가 **볼드체**로 변환됩니다. 원하는 기호(예: 하이라이트용 `==`)를 직접 입력하거나, `[[`와 `]]`를 입력해 Logseq 원본 문법을 유지하거나, **Plain text** 토글로 괄호를 완전히 제거(`[[abc]]` → `abc`)할 수도 있습니다.
    - `PrimaryTag_filtered_keyword1_keyword2.md` 또는 키워드가 없으면 `PrimaryTag_all_blocks.md`라는 이름으로 자동 다운로드됩니다.

4. **(New in 2.0!) 완전한 키보드 워크플로우**
    - **`Cmd+Shift+E`**(macOS) / **`Ctrl+Shift+E`**(Windows/Linux)로 다이얼로그를 열고, **`Cmd/Ctrl+Enter`** 로 추출을 실행하고, **`Esc`** 로 닫습니다 — 마우스에 손을 대지 않고 추출의 전 과정을 끝낼 수 있습니다.
    - Tab으로 이동할 때 액센트 색상의 선명한 포커스 링이 현재 위치를 표시하며, 버튼에는 단축키가 함께 표시됩니다.

5. **(New in 2.0!) 마지막 설정 기억**
    - 추출을 실행하면 모든 입력값이 저장되고, 다음에 다이얼로그를 열 때 그대로 미리 채워집니다.
    - 직전 추출의 재실행은 단 두 동작이면 됩니다: 다이얼로그 열기 → `Cmd/Ctrl+Enter`.
    - 처음 사용할 때는 현재 보고 있는 페이지 이름이 Primary Tag의 기본값으로 들어갑니다.


## 특징

- **자동완성 목록 지원**
    - 두 글자 이상 입력시 해당하는 페이지의 이름이 자동완성 목록으로 나타납니다.
    - 이는 Logseq의 편집기능 중 `[[`로 시작한 후 나타나는 목록과 동일합니다.
    - Primary Tag, Filter Keywords의 입력창에서는, 모든 페이지에 대한 자동완성을 지원합니다. (영어, 한국어 등 지원)
    - Sort By에서는 Property만 지원합니다.
        - (예시, 페이지에서 `date:: [[2025_06_05]]` 와 같이 `::`를 이용해 key와 value로 사용하였다면 그 key는 모두 `property`가 됩니다. )
- **새로 디자인된 컴팩트 다이얼로그 (2.0)**
    - 자주 쓰는 입력(태그, 키워드, 정렬)은 앞에 배치하고, 사용 빈도가 낮은 옵션(링크 치환, 계층 토글)은 **Advanced** 섹션으로 접어두었습니다.
    - 접힌 상태에서도 Advanced 헤더의 작은 칩으로 현재 설정을 한눈에 확인할 수 있습니다. (예: `links: bold`, `no parents`)
    - 다이얼로그 하단에서 내보낼 **파일명을 실시간으로 미리보기**할 수 있습니다.
- **다양한 실행 방법**
    - 커맨드 팔레트에서 호출 가능하며, 기본 단축키는 `Cmd/Ctrl+Shift+E`입니다. (Logseq 설정 → Keymap에서 변경 가능)
    - 에디터 내 슬래시 명령어(`/Extract Filtered Blocks`).
    - 툴바 버튼 추가로 클릭 한 번에 실행 가능.
    - 블록 컨텍스트 메뉴(블록 불릿 우클릭)에서도 실행 가능.
- **다크모드 지원**
    - 모든 색상이 Logseq의 테마 변수를 따르기 때문에, 라이트/다크/커스텀 어떤 테마에서도 현재 Logseq 테마와 자연스럽게 어울립니다.
- **하위 계층의 경우 10 단계까지 지원**
    - 추출하려는 내용 중 하위블럭이 있을 경우, 하위계층의 최대 깊이 값은 10으로 설정되어있습니다.
    - 이를 따로 사용자 설정할 수 있도록 하는 기능은 추후에 추가할 계획입니다.

---

## 설치 방법

1. **Logseq 플러그인 마켓 플레이스에서 설치 (추천)**
    - Logseq Plugin - Marcketplace 에서 **logseq-block-extractor** 검색 후, 설치

2. **Logseq 플러그인 수동 설치**
    - [github 최신 Release 페이지](https://github.com/inchanS/logseq-block-extractor/releases/latest)에서 최신버전의 `logseq-block-extractor.zip`파일을 다운로드 한 후, 압축을 해제합니다.
    - Logseq - Settings - Advanced - **Developer mode를 활성화**합니다.
        - ![](asset/logseq-settings.png)
    - Logseq 플러그인을 열면 아래와 같은 화면을 볼 수 있습니다.
        - ![](asset/logseq-plugins.png)
    - 화살표로 표시한 버튼을 누른 후, 아까 다운로드한 **폴더를 클릭**하여 설치합니다.
    - Logseq를 재시작하거나 새로고침하여 플러그인을 로드합니다.

---

## 사용법

1. **플러그인 창 열기**
    - 기본 단축키 **`Cmd+Shift+E`**(macOS) / **`Ctrl+Shift+E`**(Windows/Linux)를 누릅니다.
    - 또는 커맨드 팔레트(`Cmd+shift+P` 또는 `Ctrl+P`)를 열고 **Extract Filtered Blocks**를 검색합니다.
    - 또는 페이지나 저널에서 `/Extract Filtered Blocks`를 입력하고 선택합니다.
    - 또는 툴바 버튼(아이콘)을 클릭합니다.
    - 다이얼로그는 마지막으로 사용한 설정이 미리 채워진 채 열립니다. (처음 사용할 때는 현재 페이지 이름이 Primary Tag에 들어갑니다.) 미리 채워진 태그는 전체 선택되어 있어, 바로 타이핑하면 교체되고 `Cmd/Ctrl+Enter`를 누르면 직전 추출이 그대로 재실행됩니다.

2. **파라미터 입력**
    - **Primary Tag (필수)**: 검색할 태그 이름만 입력하세요.
        - `#`심볼은 입력하지 않습니다.
        - Primary Tag는 하나만 입력할 수 있습니다.
        - 자동완성 목록에서 선택할 수 있습니다.
        - 예시 : "projectX"
    - **Filter Keywords (선택)**: 필터링하여 참고할 키워드를 입력하세요.
        - 하나 또는 여러 개를 입력할 수 있습니다.
        - 여러개 입력시 '쉼표'로 구분합니다. (예: "issue, resolve, hold")
        - 입력칸을 비워두면 해당 태그를 참조하는 모든 블록을 추출합니다.
        - 키워드 앞에 `-`(하이픈)을 입력하면 해당 키워드의 페이지나 태그는 제외한 블럭만 추출합니다.
        - 자동완성 목록에서 선택할 수 있습니다.
        - 예시 : "issue, resolve, -hold"
            - projectX 페이지를 백링크로 참조하는 모든 블럭들 중 hold 페이지나 태그가 포함된 블럭은 제외합니다. 그리고 그 중에서 issue, resolve 태그나 페이지가 포함된 블럭들을 필터링합니다.
    - **Any / All (Filter Keywords 입력창 옆)**: 여러 개의 Filter Keywords를 입력하였을 경우의 조건을 설정합니다.
        - **Any**: 입력한 키워드들 중 하나라도 만족하는 블럭들을 모두 추출합니다. (OR)
        - **All**: 입력한 모든 키워드를 포함하는 블럭들만 추출합니다. (AND)
    - **Sort By**: 추출한 블럭들의 정렬 기준을 입력합니다.
        - 아무것도 입력하지 않으면 기본적으로 file name(page name)을 기준합니다.
        - 입력창에는 사용자가 해당 Logseq Graph에서 작성해온 모든 property를 지원하며 Logseq의 system property 역시 지원합니다.
        - 주의! Sort By는 하나만 입력할 수 있습니다. 여러 개를 지원하지 않습니다.
    - **A→Z / Z→A (Sort By 입력창 옆)**: 정렬 순서를 선택합니다.
        - **A→Z** : 오름차순입니다. (A → Z 및 1 → 9 순서입니다.)
        - **Z→A** : 내림차순입니다. (Z → A 및 9 → 1 순서입니다.)
        - 정렬은 문자와 숫자 모두 지원합니다.
    - **Advanced (기본은 접힘 상태)**: 헤더를 클릭하거나, 헤더에 포커스를 두고 `Enter`/`Space`를 누르면 펼쳐집니다. 접힌 상태에서도 헤더의 칩으로 현재 설정을 확인할 수 있습니다.
        - **Link Replacement**: 내보낸 파일에서 Logseq 링크 `[[...]]`의 표시 방식을 설정합니다.
            - 두 칸을 모두 비워두면 기본값이 적용되어 링크가 **볼드체**(`**...**`)로 변환됩니다.
            - 원하는 기호를 직접 입력할 수 있습니다. (예: 하이라이트용 `==`, `==`)
            - `[[`와 `]]`를 입력하면 Logseq 원본 문법이 그대로 유지됩니다.
        - **Plain text**: 체크하면 괄호를 완전히 제거합니다. (`[[abc]]` → `abc`) 체크된 동안에는 치환 입력칸이 비활성화됩니다.
        - **Exclude Parents**: 체크하면 찾고자 하는 블럭과 그 하위블럭만을 포함합니다. 체크하지 않으면 직계 상위 블럭을 함께 내보내며, 이는 Logseq의 "Linked References"와 거의 유사합니다.
        - **Include Tag Body**: 체크하면 대상 문서(Primary Tag) 원본의 본문 내용을 문서 최상단에 함께 추출하여 보여줍니다.
    - **파일명 미리보기**: 입력할 때마다 다이얼로그 하단에서 내보낼 파일명이 실시간으로 미리 표시됩니다.

3. **추출 실행**

    - **`Cmd/Ctrl+Enter`**를 누르거나 **Extract** 버튼을 클릭합니다.

    - 플러그인은 다음 과정을 거칩니다:

        1. Logseq 데이터베이스에서 기본 태그를 참조하는 블록들을 쿼리합니다.

        2. 각 블록의 전체 내용과 자식 블록을 10계층만큼 가져옵니다.

        3. 필터 키워드가 있을 경우, 재귀적으로 키워드를 포함하는 블록 또는 해당 블록의 자손이 있는지 검사하여 필터링합니다.

        4. 결과를 설정된 기준으로 정렬합니다.

        5. 각 블록을 페이지 이름(섹션 헤더) 아래에 계층형 목록(들여쓰기된 `-` 표기)으로 정리한 Markdown 문자열을 만듭니다. (이때 Logseq 속성 데이터는 자동 정제됩니다.)

        6. 자동으로 `.md` 파일을 다운로드할 수 있는 OS의 창이 나타납니다. 파일명은 다음과 같은 형식입니다:

            ```
            <PrimaryTag>_filtered_<keyword1>_<keyword2>.md
            ```
           또는 키워드가 없으면
            ```
            <PrimaryTag>_all_blocks.md
            ```
           정렬 기준이 있다면
             ```
             <PrimaryTag>_filtered_<keyword1>_<keyword2>_sortBy_<property>.md
             ```
           (제외된 키워드는 파일명에 제안되지 않습니다.)

4. **다운로드된 Markdown 확인**

    - 다운로드된 파일을 마음에 드는 Markdown 뷰어나 텍스트 에디터에서 열어보세요.
    - 추출한 참고내용의 가장 상위 블럭을 기준으로 헤더2단계의 형식으로 정리됩니다.

5. **추출된 Markdown 문서 예시** (기본 링크 서식 사용 시, `[[링크]]`는 **볼드체**로 내보내집니다)

```markdown
# Extracting reference blocks project x

Search conditions:
1. "Blocks that reference tags project x"
2. Keep the hierarchy, but show all "issue, resolved" related blocks and their children
3. Sort by: filename (descending)

A total of 3 blocks found

### Content of **project X**

- This is the original content of the project X page.
1. Ordered list item 1
2. Ordered list item 2
- Normal bullet point

---

## 1. apr 14th, 2025

- **project X** #resolved
  - Wow, I finally solved it!!!
    - Here's how I solved it.
      - abcde
        - 가나다라마

---

## 2. apr 12th, 2025

- **project X** #issue
  - This is a really serious problem 2.
    - 12345
    - abcde

---

## 3. apr 9th, 2025

- **project X** #issue
  - This is a really serious problem.
    - 12345
    - abcde
      - 가나다라마

---
```

---

## 키보드 단축키

| 키 | 동작 |
| --- | --- |
| `Cmd/Ctrl+Shift+E` | 다이얼로그 열기 (Logseq 설정 → Keymap에서 변경 가능) |
| `Tab` / `Shift+Tab` | 입력 항목 간 이동 (선명한 포커스 링이 현재 위치를 표시합니다) |
| `←` `→` | Any/All, A→Z/Z→A 옵션 전환 |
| `↑` `↓` + `Enter` | 자동완성 목록 탐색 및 선택 |
| `Enter` / `Space` | Advanced 섹션 펼치기/접기 (헤더에 포커스가 있을 때) |
| `Space` | 체크박스 토글 |
| `Cmd/Ctrl+Enter` | 추출 실행 (다이얼로그 안 어디서든 동작) |
| `Esc` | 자동완성 목록이 열려 있으면 먼저 닫고, 그다음 다이얼로그 닫기 |

> 참고: `Enter` 단독으로는 추출이 실행되지 않습니다. 입력 도중 실수로 내보내는 것을 막기 위한 설계이며, 실행은 `Cmd/Ctrl+Enter`를 사용하세요.

---

## 문제 해결

- **“Primary tag is required” 경고**
    - 기본 태그 필수 입력란에 빈 값이 들어갔을 때 발생합니다.
    - 반드시 태그 이름만 입력하세요(예: `할일`, `MeetingNotes`). `#` 기호는 포함하지 않습니다.

- **블록을 찾을 수 없음**
    - **해당 태그를 참조하는 블록이 실제로 있는지 확인하세요.**
    - 키워드 필터를 적용했을 때 결과가 없으면, 필터 없이 다시 시도해 보세요.

- **`Cmd/Ctrl+Shift+E` 단축키가 동작하지 않음**
    - 다른 플러그인이나 시스템 단축키와 충돌할 수 있습니다. Logseq 설정 → Keymap에서 단축키를 변경할 수 있습니다.

---

## 라이선스

이 프로젝트는 **GPL-3.0 LICENSE**와 함께 배포됩니다. 원작자 명시 및 소스코드 공개, 동일 라이센스하에 자유롭게 사용, 수정, 배포하실 수 있습니다.
