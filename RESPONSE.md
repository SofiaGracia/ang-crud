# Pla d'Implementació: AI Analysis Drawer

## 📁 Estructura

```
src/app/prototypes/ai/
├── interfaces/
│   └── ai-analysis.interface.ts
├── services/
│   └── ai-analysis.service.ts
├── facades/
│   └── ai-analysis.facade.ts
└── components/
    └── ai-drawer/
        ├── ai-drawer.ts
        └── ai-drawer.html
```

---

## 📐 Interfícies — `ai-analysis.interface.ts`

```typescript
export type SuggestionType = 'accessibility' | 'semantic' | 'styling' | 'structure';

export interface AiAnalysisIssue {
    severity: 'low' | 'medium' | 'high';
    message: string;
}

export interface AiAnalysisSuggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
}

export interface AiAnalysisResponse {
    summary: string;
    issues: AiAnalysisIssue[];
    suggestions: AiAnalysisSuggestion[];
}

export interface ApplySuggestionEvent {
    suggestion: AiAnalysisSuggestion;
}
```

`SuggestionType` + `id` són la clau per al futur: el pare fa `switch (type)` i muta el JSON tree real.

---

## ⚙️ Service — `ai-analysis.service.ts`

- Retorna `Observable<AiAnalysisResponse>` amb `timer(800 + Math.random() * 400)`
- Mock response amb 3 issues (high / medium / low) + 3 suggestions (una per type)
- Error handling: `throwError` si el tree és null / undefined
- `@Injectable({ providedIn: 'root' })`, injecció per `inject()`

---

## 🗂️ Facade — `ai-analysis.facade.ts`

L'estat és un `signal` amb:

```typescript
interface AiAnalysisState {
    isDrawerOpen: boolean;
    isLoading: boolean;
    analysis: AiAnalysisResponse | null;
    error: string | null;
    appliedSuggestionIds: Set<string>;
}
```

### Signals exposades (readonly)

| Signal | Tipus |
|--------|-------|
| `isDrawerOpen` | `Signal<boolean>` |
| `isLoading` | `Signal<boolean>` |
| `analysis` | `Signal<AiAnalysisResponse \| null>` |
| `error` | `Signal<string \| null>` |
| `appliedSuggestionIds` | `Signal<Set<string>>` |

### Mètodes

| Mètode | Comportament |
|--------|-------------|
| `openDrawer(tree)` | Obre drawer. Si ja hi ha `analysis`, no torna a cridar el servei. Sinó: isLoading=true → crida service → analysis o error |
| `closeDrawer()` | Tanca drawer (però manté analysis en cache) |
| `applySuggestion(id)` | Afegeix l'ID a `appliedSuggestionIds` |
| `resetAnalysis()` | Neteja tot l'estat |
| `retryAnalysis(tree)` | Neteja i torna a obrir |

---

## 🧩 Component — `ai-drawer`

- **Imports**: Angular core, `AiAnalysisFacade`, interfaces
- **Outputs**: `applySuggestion = output<ApplySuggestionEvent>()`
- El template consumeix les signals del facade directament

### Estats del template

1. **Tancat** → no renderitza res
2. **Loading** → spinner DaisyUI + "Analyzing UI structure..."
3. **Error** → alerta error + botó "Retry"
4. **Resultat** → 3 seccions: Summary, Issues (badges severity), Suggestions

### Botó Apply

- truca `facade.applySuggestion(id)` → marcatge visual immediat (checkmark + "Applied")
- emet `applySuggestion.emit({ suggestion })` al pare

---

## 🔧 Canvis al `Prototype` component

### prototype.ts

Afegir:
- `inject(AiAnalysisFacade)`
- Mètode `analyzeUi()` → `this.aiFacade.openDrawer(this.parsedTree())`
- Mètode `handleApplySuggestion(event: ApplySuggestionEvent)`:

```typescript
switch (event.suggestion.type) {
    case 'accessibility': /* future: add ARIA attrs to tree */ break;
    case 'semantic':      /* future: replace <div> with <nav>/<main> */ break;
    case 'styling':       /* future: add Tailwind classes */ break;
    case 'structure':     /* future: reorder DOM nodes */ break;
}
```

**Ara**: només log. L'arquitectura està llesta per connectar al JSON tree real.

### prototype.html

- Botó "Analyze UI" (`btn btn-outline btn-sm`) al costat dels tabs (dins del `@if (srcdoc())`)
- `<ai-drawer (applySuggestion)="handleApplySuggestion($event)" />` al final del template

---

## 🎨 Drawer template (estructura visual)

```
┌─────────────────────────────────────────┐
│ Overlay: fixed bg-black/50 z-40         │
│   (click → close)                       │
│ ┌───────────────────────────────────┐   │
│ │ Panel: fixed right-0 w-[420px]    │   │
│ │        bg-base-100 shadow-2xl     │   │
│ │        overflow-y-auto            │   │
│ │                                   │   │
│ │ [sticky] Header:                  │   │
│ │   "AI Analysis"            [✕]   │   │
│ │───────────────────────────────────│   │
│ │ LOADING:                         │   │
│ │   ◌ spinner                       │   │
│ │   "Analyzing UI structure..."     │   │
│ │                                   │   │
│ │ RESULT:                          │   │
│ │   ── SUMMARY ──                  │   │
│ │   L'anàlisi ha detectat...       │   │
│ │                                   │   │
│ │   ── ISSUES (3) ──               │   │
│ │   [high]  Missing ARIA labels    │   │
│ │   [med]   Color contrast         │   │
│ │   [low]   Responsive breakpoints │   │
│ │                                   │   │
│ │   ── SUGGESTIONS (3) ──          │   │
│ │   ► Improve Accessibility        │   │
│ │     [accessibility]  [Apply]     │   │
│ │   ► Use Semantic HTML            │   │
│ │     [semantic]       [✓ Applied] │   │
│ │   ► Optimize Layout              │   │
│ │     [styling]        [Apply]     │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🔗 Flux complet

```
Botó "Analyze UI"
    ↓
openDrawer(tree) → isDrawerOpen = true
    ↓
isLoading = true → mostra spinner
    ↓
service.analyze(tree) → timer 800-1200ms
    ↓
Anàlisi rebuda → isLoading = false, analysis = result
    ↓
Renderitza: Summary + Issues + Suggestions
    ↓
Usuari clica "Apply" en una suggerència
    ↓
applySuggestion(id) → appliedSuggestionIds += id → badge "✓ Applied"
    ↓
applySuggestion.emit({ suggestion }) → pare rep l'event
    ↓
Pare fa switch (suggestion.type) → (ara log, futur: mutar tree)
    ↓
Usuari tanca amb ✕ o overlay → closeDrawer() → isDrawerOpen = false
```

---

## 🚫 No s'inclou

- Integració amb LLMs / APIs reals
- Rutes noves
- Canvis a facades / serveis existents
- Dependències addicionals
- Sobreeginyeria d'estat

---

## 📝 Fitxers a crear (3)

| Fitxer | Propòsit |
|--------|----------|
| `src/app/prototypes/ai/interfaces/ai-analysis.interface.ts` | Models de dades |
| `src/app/prototypes/ai/services/ai-analysis.service.ts` | Servei mock amb retard RxJS |
| `src/app/prototypes/ai/facades/ai-analysis.facade.ts` | Gestió d'estat del drawer |
| `src/app/prototypes/ai/components/ai-drawer/ai-drawer.ts` | Component standalone |
| `src/app/prototypes/ai/components/ai-drawer/ai-drawer.html` | Template del drawer |

## 📝 Fitxers a modificar (2)

| Fitxer | Canvi |
|--------|-------|
| `src/app/prototypes/components/prototype/prototype.ts` | Injectar facade, afegir `analyzeUi()` + `handleApplySuggestion()` |
| `src/app/prototypes/components/prototype/prototype.html` | Botó "Analyze UI" + tag `<ai-drawer>` |
