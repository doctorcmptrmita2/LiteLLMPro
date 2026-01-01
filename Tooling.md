# CF-X Tool Calling & File Operations Analizi

## 🎯 Temel Soru

> VS Code extension'da dosya işlemleri (create, edit, delete, copy, move) nasıl yapılmalı?
> Arka planda özel bir tool-calling model mi çalışmalı?

---

## 📊 Tool Calling Benchmark'ları (Ocak 2026)

### Berkeley Function Calling Leaderboard (BFCL) V4

BFCL, LLM'lerin tool/function calling yeteneklerini değerlendiren endüstri standardı benchmark'tır.

| Sıra | Model | Overall Score | Güçlü Yanı |
|------|-------|---------------|------------|
| 1 | DeepSeek V3 | ~72% | Maliyet/performans |
| 2 | Claude Opus 4.1 | 70.36% | Structured output |
| 3 | Claude Sonnet 4 | 70.29% | Schema following |
| 4 | Gemini 2.5 Pro | ~68% | Multi-turn |
| 5 | GPT-5 | 59.22% | Multimodal |
| 6 | GPT-4o-mini | ~55% | Hız/maliyet |

**Önemli Bulgular:**
- Top modeller tek-shot sorularda başarılı ama multi-turn context'te zorlanıyor
- "Relevance Detection" (ne zaman tool KULLANMAMALI) kritik ve zayıf nokta
- Claude modelleri structured output ve schema following'de güçlü

### MCPMark Benchmark (Model Context Protocol)

MCPMark, gerçek dünya MCP kullanımını test eder - 127 task, 5 ortam:
- Notion, GitHub, Filesystem, PostgreSQL, Playwright

**Test Edilen İşlemler:** Create, Read, Update, Delete (CRUD)

| Model | MCPMark Score | Filesystem Ops | Multi-step |
|-------|---------------|----------------|------------|
| Claude Sonnet 4 | ~75% | Güçlü | Güçlü |
| GPT-5 | ~70% | Orta | Güçlü |
| DeepSeek V3 | ~68% | Güçlü | Orta |

---

## 🏗️ AI Coding Assistant Mimarileri

### Cursor Yaklaşımı (Agent-First Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    CURSOR 2.0 AGENT                         │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Planner   │───▶│   Executor  │───▶│   Verifier  │     │
│  │  (Claude)   │    │  (Claude)   │    │  (Claude)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              TOOL EXECUTION LAYER                    │   │
│  │  • File Read/Write    • Terminal Commands           │   │
│  │  • Code Search        • Test Execution              │   │
│  │  • Diff Application   • Dependency Management       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Özellikler:**
- Multi-file refactoring (onlarca dosya)
- Automated test generation & execution
- Dependency updates with compatibility verification
- Reviewable diffs + terminal commands

### Windsurf Yaklaşımı (Cascade)

```
┌─────────────────────────────────────────────────────────────┐
│                    WINDSURF CASCADE                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              DEEP CONTEXT ENGINE                     │   │
│  │  • Codebase indexing    • Semantic search           │   │
│  │  • Dependency graph     • Change impact analysis    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              INLINE TOOL EXECUTION                   │   │
│  │  • ⌘+I inline commands  • Code lenses               │   │
│  │  • Auto-apply diffs     • Terminal integration      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Özellikler:**
- Flow state koruma (context switching minimize)
- Deep context awareness
- Inline command execution

### Claude Code Yaklaşımı (Agentic Terminal)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              TERMINAL-FIRST AGENT                    │   │
│  │                                                      │   │
│  │  User Prompt ──▶ Plan ──▶ Execute ──▶ Verify        │   │
│  │                    │         │          │            │   │
│  │                    ▼         ▼          ▼            │   │
│  │              ┌─────────────────────────────┐         │   │
│  │              │     NATIVE TOOL CALLS       │         │   │
│  │              │  • bash (shell commands)    │         │   │
│  │              │  • write_file               │         │   │
│  │              │  • read_file                │         │   │
│  │              │  • edit_file (diff-based)   │         │   │
│  │              │  • search_files             │         │   │
│  │              └─────────────────────────────┘         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Özellikler:**
- Terminal + IDE entegrasyonu
- Native tool calling (function calling)
- Agentic workflow (plan → execute → verify)

---

## 🔧 File Operations Tool Definitions

### Temel Tool Set (MVP)

```typescript
// 1. READ FILE
interface ReadFileTool {
  name: "read_file";
  description: "Read the contents of a file at the specified path";
  parameters: {
    path: string;           // Relative path from workspace root
    start_line?: number;    // Optional: start reading from this line
    end_line?: number;      // Optional: stop reading at this line
  };
  returns: {
    content: string;
    line_count: number;
    file_size: number;
  };
}

// 2. WRITE FILE (Create or Overwrite)
interface WriteFileTool {
  name: "write_file";
  description: "Create a new file or overwrite existing file";
  parameters: {
    path: string;           // Relative path
    content: string;        // Full file content
    create_dirs?: boolean;  // Create parent directories if needed
  };
  returns: {
    success: boolean;
    bytes_written: number;
  };
}

// 3. EDIT FILE (Diff-based)
interface EditFileTool {
  name: "edit_file";
  description: "Apply targeted edits to an existing file using search/replace";
  parameters: {
    path: string;
    edits: Array<{
      old_text: string;     // Exact text to find
      new_text: string;     // Replacement text
    }>;
  };
  returns: {
    success: boolean;
    edits_applied: number;
    edits_failed: number;
  };
}

// 4. DELETE FILE
interface DeleteFileTool {
  name: "delete_file";
  description: "Delete a file at the specified path";
  parameters: {
    path: string;
  };
  returns: {
    success: boolean;
  };
}

// 5. LIST DIRECTORY
interface ListDirectoryTool {
  name: "list_directory";
  description: "List files and directories at the specified path";
  parameters: {
    path: string;
    recursive?: boolean;    // Include subdirectories
    max_depth?: number;     // Limit recursion depth
    pattern?: string;       // Glob pattern filter
  };
  returns: {
    entries: Array<{
      name: string;
      type: "file" | "directory";
      size?: number;
      modified?: string;
    }>;
  };
}

// 6. SEARCH FILES
interface SearchFilesTool {
  name: "search_files";
  description: "Search for text pattern across files";
  parameters: {
    pattern: string;        // Regex pattern
    path?: string;          // Directory to search (default: workspace root)
    include?: string;       // Glob pattern for files to include
    exclude?: string;       // Glob pattern for files to exclude
    max_results?: number;   // Limit results
  };
  returns: {
    matches: Array<{
      file: string;
      line: number;
      content: string;
      context: string;      // Surrounding lines
    }>;
  };
}
```

### Gelişmiş Tool Set (v2.0+)

```typescript
// 7. MOVE/RENAME FILE
interface MoveFileTool {
  name: "move_file";
  description: "Move or rename a file";
  parameters: {
    source: string;
    destination: string;
    overwrite?: boolean;
  };
}

// 8. COPY FILE
interface CopyFileTool {
  name: "copy_file";
  description: "Copy a file to a new location";
  parameters: {
    source: string;
    destination: string;
  };
}

// 9. EXECUTE COMMAND
interface ExecuteCommandTool {
  name: "execute_command";
  description: "Execute a shell command in the workspace";
  parameters: {
    command: string;
    cwd?: string;           // Working directory
    timeout?: number;       // Timeout in ms
  };
  returns: {
    stdout: string;
    stderr: string;
    exit_code: number;
  };
}

// 10. APPLY DIFF
interface ApplyDiffTool {
  name: "apply_diff";
  description: "Apply a unified diff to one or more files";
  parameters: {
    diff: string;           // Unified diff format
    dry_run?: boolean;      // Preview without applying
  };
  returns: {
    files_modified: string[];
    success: boolean;
    preview?: string;       // If dry_run
  };
}
```

---

## 🤔 Ayrı Tool-Calling Model Gerekli mi?

### Seçenek A: Aynı Model (Önerilen MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                    TEK MODEL YAKLAŞIMI                      │
│                                                             │
│  User Request ──▶ [Stage Model] ──▶ Response + Tool Calls   │
│                        │                                    │
│                        ▼                                    │
│                   Tool Execution                            │
│                        │                                    │
│                        ▼                                    │
│                   [Same Model] ──▶ Continue/Complete        │
└─────────────────────────────────────────────────────────────┘
```

**Avantajlar:**
- ✅ Basit mimari
- ✅ Context tutarlılığı (model kendi tool çağrılarını hatırlıyor)
- ✅ Tek API call (maliyet)
- ✅ Düşük latency

**Dezavantajlar:**
- ❌ Tool calling kalitesi modele bağlı
- ❌ Bazı modeller tool calling'de zayıf

### Seçenek B: Ayrı Tool-Calling Model

```
┌─────────────────────────────────────────────────────────────┐
│                  İKİ MODEL YAKLAŞIMI                        │
│                                                             │
│  User Request ──▶ [Stage Model] ──▶ Response + Intent       │
│                                          │                  │
│                                          ▼                  │
│                                   [Tool Router]             │
│                                          │                  │
│                                          ▼                  │
│                              [Tool-Calling Model]           │
│                              (GPT-4o-mini / Claude)         │
│                                          │                  │
│                                          ▼                  │
│                                   Tool Execution            │
└─────────────────────────────────────────────────────────────┘
```

**Avantajlar:**
- ✅ Tool calling için optimize edilmiş model
- ✅ Stage model tool calling bilmek zorunda değil
- ✅ Daha güvenilir tool execution

**Dezavantajlar:**
- ❌ Ek latency (~200-500ms)
- ❌ Ek maliyet
- ❌ Context kaybı riski
- ❌ Karmaşık mimari

### Seçenek C: Hibrit (Önerilen v2.0)

```
┌─────────────────────────────────────────────────────────────┐
│                   HİBRİT YAKLAŞIM                           │
│                                                             │
│  User Request ──▶ [Stage Model with Tools]                  │
│                        │                                    │
│                        ├── Simple tools ──▶ Direct execute  │
│                        │   (read, list, search)             │
│                        │                                    │
│                        └── Complex tools ──▶ [Tool Model]   │
│                            (multi-file edit, refactor)      │
│                                    │                        │
│                                    ▼                        │
│                            Validated Execution              │
└─────────────────────────────────────────────────────────────┘
```

**Avantajlar:**
- ✅ Basit işler için hızlı
- ✅ Karmaşık işler için güvenilir
- ✅ Maliyet optimize

---

## 🎯 CF-X İçin Önerilen Mimari

### MVP (v1.0): Native Tool Calling

```python
# Stage modelleri zaten tool calling destekliyor
# Ayrı model GEREKMEZ

STAGE_TOOLS = {
    "plan": [],  # PLAN stage tool kullanmaz
    
    "code": [
        "read_file",
        "write_file", 
        "edit_file",
        "list_directory",
        "search_files",
    ],
    
    "review": [
        "read_file",
        "list_directory",
        "search_files",
    ],
}

async def handle_request(stage: str, messages: list):
    model = get_model_for_stage(stage)
    tools = STAGE_TOOLS.get(stage, [])
    
    response = await litellm.completion(
        model=model,
        messages=messages,
        tools=tools if tools else None,
        tool_choice="auto",
    )
    
    # Tool calls varsa execute et
    if response.tool_calls:
        results = await execute_tools(response.tool_calls)
        # Continue conversation with results
        ...
```

### Tool Execution Layer (VS Code Extension)

```typescript
// Roo Code fork'unda tool execution
class ToolExecutor {
  private workspace: vscode.WorkspaceFolder;
  
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    switch (toolCall.name) {
      case "read_file":
        return this.readFile(toolCall.arguments);
      case "write_file":
        return this.writeFile(toolCall.arguments);
      case "edit_file":
        return this.editFile(toolCall.arguments);
      case "delete_file":
        return this.deleteFile(toolCall.arguments);
      case "list_directory":
        return this.listDirectory(toolCall.arguments);
      case "search_files":
        return this.searchFiles(toolCall.arguments);
      default:
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }
  }
  
  private async readFile(args: { path: string }): Promise<ToolResult> {
    const uri = vscode.Uri.joinPath(this.workspace.uri, args.path);
    const content = await vscode.workspace.fs.readFile(uri);
    return {
      success: true,
      content: new TextDecoder().decode(content),
    };
  }
  
  private async writeFile(args: { path: string; content: string }): Promise<ToolResult> {
    const uri = vscode.Uri.joinPath(this.workspace.uri, args.path);
    
    // User confirmation for write operations
    const confirmed = await this.confirmWrite(args.path);
    if (!confirmed) {
      return { success: false, error: "User cancelled" };
    }
    
    await vscode.workspace.fs.writeFile(
      uri, 
      new TextEncoder().encode(args.content)
    );
    return { success: true };
  }
  
  private async editFile(args: { path: string; edits: Edit[] }): Promise<ToolResult> {
    const uri = vscode.Uri.joinPath(this.workspace.uri, args.path);
    const document = await vscode.workspace.openTextDocument(uri);
    
    const edit = new vscode.WorkspaceEdit();
    for (const e of args.edits) {
      const range = this.findTextRange(document, e.old_text);
      if (range) {
        edit.replace(uri, range, e.new_text);
      }
    }
    
    // Show diff preview
    await this.showDiffPreview(document, edit);
    
    // Apply with user confirmation
    const confirmed = await this.confirmEdit(args.path, args.edits.length);
    if (confirmed) {
      await vscode.workspace.applyEdit(edit);
      return { success: true, edits_applied: args.edits.length };
    }
    
    return { success: false, error: "User cancelled" };
  }
}
```

---

## 🔒 Güvenlik Katmanı

### Tool Execution Güvenliği

```typescript
class SecureToolExecutor extends ToolExecutor {
  private allowedPaths: string[];
  private blockedPatterns: RegExp[];
  
  constructor() {
    super();
    this.allowedPaths = [
      "src/**",
      "lib/**",
      "tests/**",
      "*.json",
      "*.md",
    ];
    this.blockedPatterns = [
      /\.env/,
      /secrets?\./i,
      /password/i,
      /api[_-]?key/i,
      /node_modules/,
      /\.git/,
    ];
  }
  
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    // Path validation
    if (toolCall.arguments.path) {
      if (!this.isPathAllowed(toolCall.arguments.path)) {
        return { 
          success: false, 
          error: "Access denied: path not in allowed list" 
        };
      }
    }
    
    // Dangerous operation check
    if (this.isDangerousOperation(toolCall)) {
      const confirmed = await this.requireExplicitConfirmation(toolCall);
      if (!confirmed) {
        return { success: false, error: "User denied dangerous operation" };
      }
    }
    
    return super.execute(toolCall);
  }
  
  private isDangerousOperation(toolCall: ToolCall): boolean {
    // Delete operations
    if (toolCall.name === "delete_file") return true;
    
    // Large file writes
    if (toolCall.name === "write_file" && 
        toolCall.arguments.content?.length > 10000) {
      return true;
    }
    
    // Multiple file edits
    if (toolCall.name === "edit_file" && 
        toolCall.arguments.edits?.length > 5) {
      return true;
    }
    
    return false;
  }
}
```

### Rate Limiting for Tools

```python
# Router tarafında tool call rate limiting
TOOL_LIMITS = {
    "read_file": 100,      # per minute
    "write_file": 20,      # per minute
    "edit_file": 30,       # per minute
    "delete_file": 5,      # per minute
    "execute_command": 10, # per minute
}

async def check_tool_rate_limit(user_id: str, tool_name: str) -> bool:
    key = f"tool_limit:{user_id}:{tool_name}"
    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, 60)  # 1 minute window
    
    limit = TOOL_LIMITS.get(tool_name, 50)
    return current <= limit
```

---

## 📈 Model Karşılaştırması: Tool Calling

### Hangi Model Tool Calling İçin En İyi?

| Model | BFCL Score | Maliyet | Hız | Öneri |
|-------|------------|---------|-----|-------|
| Claude Sonnet 4 | 70.29% | $3/$15 | Orta | ✅ PLAN + CODE |
| DeepSeek V3 | ~72% | $0.27/$1.10 | Hızlı | ✅ CODE (ucuz) |
| GPT-4o-mini | ~55% | $0.15/$0.60 | Çok hızlı | ⚠️ Basit tools |
| GPT-5 | 59.22% | $5/$20 | Orta | ❌ Pahalı |

### Önerilen Konfigürasyon

```yaml
# models.yaml
stages:
  plan:
    model: claude-sonnet-4.5
    tools: []  # No tools for planning
    
  code:
    model: deepseek-v3
    tools:
      - read_file
      - write_file
      - edit_file
      - list_directory
      - search_files
    tool_choice: auto
    
  review:
    model: gpt-4o-mini
    tools:
      - read_file
      - search_files
    tool_choice: auto  # Can choose not to use tools
```

---

## 🚀 4. Stage Önerisi: TOOL (Opsiyonel)

### Ne Zaman Ayrı TOOL Stage Gerekir?

```
Senaryo 1: Karmaşık Multi-File Refactoring
├── 10+ dosya değişikliği
├── Dependency graph analizi
├── Test execution
└── Rollback capability

Senaryo 2: Automated Test Generation
├── Kod analizi
├── Test file oluşturma
├── Test çalıştırma
├── Coverage raporu

Senaryo 3: Large-Scale Migration
├── Pattern detection
├── Batch file updates
├── Validation
└── Incremental apply
```

### TOOL Stage Mimarisi (v2.0+)

```
┌─────────────────────────────────────────────────────────────┐
│                    4-STAGE ORKESTRASYON                     │
│                                                             │
│  PLAN ──▶ CODE ──▶ TOOL ──▶ REVIEW                         │
│    │        │        │         │                            │
│    ▼        ▼        ▼         ▼                            │
│  Spec    Diff     Execute   Validate                        │
│                      │                                      │
│              ┌───────┴───────┐                              │
│              │  Tool Model   │                              │
│              │ (Claude/GPT)  │                              │
│              │               │                              │
│              │ • File ops    │                              │
│              │ • Shell cmds  │                              │
│              │ • Test run    │                              │
│              │ • Validation  │                              │
│              └───────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

**TOOL Stage Model Seçimi:**
- Claude Sonnet 4: En iyi tool calling (%70+ BFCL)
- Maliyet: Sadece tool execution için kullanıldığından düşük hacim

---

## ✅ Sonuç ve Öneriler

### MVP (v1.0) - Şimdi Yap

1. **Ayrı tool-calling model KULLANMA** — Stage modelleri yeterli
2. **CODE stage'e tool support ekle** — DeepSeek V3 tool calling destekliyor
3. **VS Code extension'da tool executor** — Güvenli file operations
4. **User confirmation** — Write/delete işlemleri için

### v1.5 - Kısa Vadeli

1. **Tool caching** — Aynı dosya tekrar okunmasın
2. **Batch operations** — Çoklu edit tek request'te
3. **Diff preview** — Değişiklikleri göster, sonra uygula

### v2.0 - Orta Vadeli

1. **TOOL stage** — Karmaşık operasyonlar için ayrı stage
2. **Multi-file refactoring** — Atomic transactions
3. **Test integration** — Otomatik test çalıştırma
4. **Rollback** — Değişiklikleri geri alma

### Maliyet Etkisi

```
MVP (tool calling dahil):
├── PLAN: Claude Sonnet (no tools)     → $0.021/request
├── CODE: DeepSeek V3 (with tools)     → $0.002/request
├── REVIEW: GPT-4o-mini (read only)    → $0.001/request
└── TOPLAM: ~$0.024/request (tool overhead minimal)

v2.0 (TOOL stage ile):
├── PLAN: Claude Sonnet                → $0.021/request
├── CODE: DeepSeek V3                  → $0.002/request
├── TOOL: Claude Sonnet (10% requests) → $0.002/request (avg)
├── REVIEW: GPT-4o-mini                → $0.001/request
└── TOPLAM: ~$0.026/request (+8%)
```

---

## 📚 Kaynaklar

- [Berkeley Function Calling Leaderboard (BFCL)](https://gorilla.cs.berkeley.edu/leaderboard.html)
- [MCPMark Benchmark](https://www.klavis.ai/blog/function-calling-and-agentic-ai-in-2025)
- [VS Code Extension API - FileSystem](https://code.visualstudio.com/api/references/vscode-api#FileSystem)
- [Cursor Agent Architecture](https://www.digitalapplied.com/blog/cursor-2-0-agent-first-architecture-guide)
- [Claude Code Agentic Coding](https://spectrumailab.com/blog/claude-code-complete-guide-agentic-coding-2025)

---

*Rapor Tarihi: 2 Ocak 2026*
*Versiyon: 1.0*
