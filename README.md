### [한국어](README-KR.md)

# Block Extractor Plugin for Logseq

![GitHub stars](https://img.shields.io/github/stars/inchanS/logseq-block-extractor?style=flat&logo=apachespark)
![GitHub all releases](https://img.shields.io/github/downloads/inchanS/logseq-block-extractor/total?logo=github) ![GitHub release (latest by date)](https://img.shields.io/github/v/release/inchanS/logseq-block-extractor?logo=rocket)  ![GitHub](https://img.shields.io/github/license/inchanS/logseq-block-extractor?logo=gnu)

![logo](icon.png)

## Overview

**Block Extractor** exports the contents of Logseq's **"Linked References"** to a Markdown file. Enter a tag (or page) and optional filter keywords, and every block referencing it — with its full hierarchy — is collected, filtered, sorted, and downloaded as a `.md` file.

> **Personal Note:**
> "Linked References" is the main reason I use Logseq, yet there is no built-in way to extract its contents as a whole. This plugin lets you export exactly the backlink-driven knowledge you need — to share it, or to feed it to an AI at a lower token cost.

---

![Logseq block-extractor UI](asset/logseq-block-extractor.png)

## Features

- **Tag-based extraction** — Collects all blocks referencing a primary tag or page (case-insensitive), preserving the hierarchy up to 10 levels deep. Optionally appends the full body of the tag's own page.
- **Keyword filtering** — Comma-separated keywords with **Any**(OR)/**All**(AND) matching; prefix a keyword with `-` to exclude.
- **Sorting** — By page name (default) or any property in your graph, ascending or descending.
- **Flexible link formatting** — By default, `[[links]]` become **bold**. You can enter custom symbols, keep the original `[[ ]]` syntax, or strip the brackets entirely with the **Plain text** toggle.
- **Clean Markdown output** — Logseq-specific metadata (e.g., `logseq.order-list-type:: number`) is removed automatically and converted to standard Markdown, so the file works in any editor.
- **Full keyboard workflow** *(New in 2.0)* — Open, configure, and extract without touching the mouse. See the [shortcut table](#keyboard-shortcuts) below.
- **Remembers your last settings** *(New in 2.0)* — All inputs are prefilled from the previous run; re-run an extraction with just "open → `Cmd/Ctrl+Enter`". On first use, the current page is used as the tag.
- **Compact dialog** *(New in 2.0)* — Rarely changed options are collapsed into an **Advanced** section (with chips summarizing its state), and the exact export filename is previewed live at the bottom.
- **Autocomplete** — Tag and keyword fields suggest matching pages (2+ characters, any language); the Sort By field suggests properties.
- **Multiple entry points** — Keyboard shortcut, Command Palette, `/Extract Filtered Blocks` slash command, toolbar button, block context menu.
- **Theme-aware** — All colors follow Logseq's theme variables, so it matches light, dark, and custom themes.

## How to Install

Search for **logseq-block-extractor** in the Logseq Plugin Marketplace and install.

> Note: This plugin currently supports only file-based (Markdown) graphs. (It does not support the database-based graphs.)  
>   
> **If you are using Logseq 2.0.x Beta (DB Graph) or later,**  
> please use the [block-extractor: Logseq DB Version Plugin](https://github.com/inchanS/logseq-block-extractor-db).  

---

## How to Use

1. **Open the dialog** — Press **`Cmd+Shift+E`** (macOS) / **`Ctrl+Shift+E`** (Windows/Linux), or use the Command Palette, the `/Extract Filtered Blocks` slash command, the toolbar button, or a block's right-click menu.
   - The dialog opens with your last-used settings prefilled. The tag is preselected, so type to replace it — or press `Cmd/Ctrl+Enter` right away to repeat the previous extraction.
2. **Fill in the fields** (all text fields support autocomplete):
    - **Primary Tag (required)** — The tag or page name to search. One tag only, without the `#` symbol. e.g., `projectX`
    - **Filter Keywords (optional)** — Comma-separated keywords; leave blank to extract everything. Prefix with `-` to exclude.
        - e.g., `issue, resolve, -hold` → from all blocks referencing the tag, blocks containing "hold" are excluded, then blocks containing "issue" or "resolve" are kept.
    - **Any / All** — With multiple keywords: **Any** keeps blocks matching at least one keyword (OR), **All** requires every keyword (AND).
    - **Sort By** — A single property to sort by (blank = page name), with **A→Z** / **Z→A** order next to it.
    - **Advanced** (collapsed; click or press `Enter`/`Space` on the header to expand):
        - **Link Replacement** — Empty = links become **bold**; enter your own symbols (e.g., `==`); enter `[[` and `]]` to keep Logseq syntax.
        - **Plain text** — Strips brackets entirely (`[[abc]]` → `abc`); disables the fields above.
        - **Exclude Parents** — Export only the matched block and its children, without the parent path.
        - **Include Tag Body** — Prepend the full content of the tag's own page.
3. **Extract** — Press **`Cmd/Ctrl+Enter`** or click **Extract**. The `.md` file is downloaded with the name shown in the live preview, e.g. `projectX_filtered_issue_resolve_sortBy_date.md` (excluded keywords are omitted; `/` in hierarchical page names becomes `_`).

**Sample output** (with the default link formatting, `[[links]]` are exported as **bold**):

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

---

## 1. Apr 14th, 2025

- **project X** #resolved
  - Wow, I finally solved it!!!
    - Here's how I solved it.

---

## 2. Apr 12th, 2025

- **project X** #issue
  - This is a really serious problem.
    - 12345
    - abcde

---
```

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Cmd/Ctrl+Shift+E` | Open the dialog (customizable in Logseq Settings → Keymap) |
| `Tab` / `Shift+Tab` | Move between fields (a visible focus ring shows the current position) |
| `←` `→` | Switch options within Any/All and A→Z/Z→A |
| `↑` `↓` + `Enter` | Navigate and select autocomplete suggestions |
| `Enter` / `Space` | Expand or collapse the Advanced section (while it is focused) |
| `Space` | Toggle checkboxes |
| `Cmd/Ctrl+Enter` | Run extraction (works from anywhere in the dialog) |
| `Esc` | Close the autocomplete list first, then the dialog |

> Note: `Enter` alone does **not** run the extraction — this prevents accidental exports while typing. Use `Cmd/Ctrl+Enter`.

---

## Troubleshooting

- **"Primary tag is required" warning** — The tag field is empty. Enter only the tag or page name (e.g., `todo`, `MeetingNotes`), without the `#` symbol.
- **No blocks found** — Make sure blocks referencing the tag/page actually exist. If filters return nothing, try again without them.
- **The `Cmd/Ctrl+Shift+E` shortcut doesn't work** — Another plugin or system shortcut may be using the same key. Change the binding in Logseq Settings → Keymap.

---

## License

This project is distributed under the **GPL-3.0 LICENSE**. You are free to use, modify, and distribute it under the same license, provided you credit the original author and publish any changes under the same terms.
