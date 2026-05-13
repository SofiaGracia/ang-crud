# Technical Audit — ang-crud

**Date:** 2026-05-13
**Scope:** Full codebase review before production release
**Auditor:** Senior Frontend Engineer

---

## Executive Summary

This project shows reasonable architectural intent (Facade pattern, standalone components, RxJS streams) but contains **multiple critical issues** that would block a production release. The most severe are: **private API access patterns that will break on Angular updates**, **memory leaks from unmanaged subscriptions**, and **tests that validate implementation rather than behavior**.

Below is the full breakdown ordered by severity.

---

# Critical Issues

### C1. ~~[SECURITY] Supabase credentials committed to public repository~~ **RETRACTED**

**Severity:** ~~🔴 CRITICAL~~ → 🟢 NOT AN ISSUE

**Correction:** After verification, this claim was incorrect:
- `.env` IS properly ignored by `.gitignore` (line 4: `.env` entry)
- `src/environments/environment.ts` ARE tracked by git, but contain a **Supabase anon/publishable key** (`sb_publishable_...`). This key is designed to be public-facing — it's the same kind of key sent to every browser in a Supabase client app, no different from embedding a Google Maps API key in a web app.
- Real security relies on Supabase **RLS policies**, not secrecy of the anon key.

**What remains valid:** It's worth auditing RLS policies on all tables to confirm unauthenticated access is properly blocked.

---

### C2. [MAINTENANCE] Dead code branch in DialogPrototype — update path never called

**Severity:** 🟡 MEDIUM

**File:** `src/app/prototypes/components/dialog-prototype/dialog-prototype.ts` (line 99-103)

```typescript
if (this.mode() === 'create') {
    this.prototypesFacade.addPrototype(this.project().id, newProto);
    console.log('CREATE PROTOTYPE');
} else {
    console.log('UPDATE PROTOTYPE');  // ← DEAD CODE: never reached from UI
}
```

**Problem:**
El branch `else` amb `console.log('UPDATE PROTOTYPE')` és **codi mort inabastable des de la UI**. Verificat:
- `prototypes.html` usa `<dialog-prototype [mode]="'create'">` — mai en mode `'edit'`
- `prototype-card.html` no té cap botó d'edit al dropdown, només "Move to Trash"

Això vol dir que:
- El codi d'update és **dead code** que mai s'executa
- Si algú en el futur afegeix un botó d'edit a prototype-card, es trobarà amb un silent no-op sense cap error
- La funció `handleSubmit` es morta per al cas `'edit'` — el diàleg ni tan sols es renderitza en aquest mode

**Severitat real:** és un **🟡 MEDIUM** de mantenibilitat, no un CRITICAL. La funcionalitat no està implementada però tampoc està exposada a l'usuari.

**Per a una junior en code review:**
> "Si una branca d'un condicional no s'usa mai, no la deixis amb un `console.log`. O treus la branca, o hi poses un throw per protegir-te: `throw new Error('Not implemented')`. Així, si algú la crida en el futur, falla sorollosament i sap que cal implementar-la."

**Fix:**
Replace with intentional safeguard:
```typescript
if (this.mode() === 'create') {
    this.prototypesFacade.addPrototype(this.project().id, newProto);
} else {
    throw new Error('Update prototype not implemented yet');
}
```
When edit is needed, implement `updatePrototype()` in the facade and call it here.

---

### C3. [ARCHITECTURE] Auth guard accesses private property via bracket notation

**Severity:** 🔴 CRITICAL

**File:** `src/app/auth/guards/auth.guard.ts` (line 18)

```typescript
const isAuthenticated = authFacade['user$'].value !== null;
```

**Problem:**
The guard bypasses Angular's encapsulation by accessing `authFacade['user$']` — a private `BehaviorSubject`. This:
1. **Breaks encapsulation** — the guard depends on internal implementation details
2. **Is brittle** — renaming `user$` to anything else (even via minification in production) will silently break the guard
3. **Circumvents the observable pattern** — the entire point of `BehaviorSubject` is to expose `.asObservable()` for controlled read access
4. **Can break** with Angular's optimization/build if property mangling is enabled

**Fix:**
Use the existing `isAuthenticated$` observable instead:
```typescript
return authFacade.loading$.pipe(
    filter((loading) => !loading),
    take(1),
    switchMap(() => authFacade.isAuthenticated$.pipe(take(1))),
    map((isAuthenticated) => {
        if (!isAuthenticated) { router.navigate(['/']); return false; }
        return true;
    }),
);
```

---

### C4. [MEMORY] Multiple subscription memory leaks

**Severity:** 🔴 CRITICAL

**Files:**
- `src/app/projects/facades/projects.facade.ts` (line 25-29)
- `src/app/projects/components/project-card/project-card.ts` (line 72-82)
- `src/app/auth/facades/auth.facade.ts` (line 26-29)
- `src/app/prototypes/components/prototype-card/prototype-card.ts` (line 24-33)

**Problem:**
Several subscriptions are created without cleanup:

1. `ProjectsFacade` constructor subscribes to `authFacade.currentUser$` with no `takeUntilDestroyed` or explicit teardown. Since the facade is `providedIn: 'root'` (singleton), this is technically a single leak, but it's still an anti-pattern.

2. `ProjectCard.ngOnInit` subscribes to `prototypesFacade.getPrototypesByProject()` without cleanup. Each card instance creates a subscription that lives until the component is GC'd — and might never be if the component is destroyed improperly.

3. `AuthFacade` calls `authService.onAuthStateChange()` in a private async method, returns the subscription, but **never stores or unsubscribes from it**. If the facade is ever destroyed/recreated, duplicate listeners will accumulate.

4. `PrototypeCard.fetch()` is a raw Promise with no error handling and no abort on destroy. If the user navigates away, the fetch continues.

**Fix:**
- Add `DestroyRef` and `takeUntilDestroyed()` to all component subscriptions
- Store `AuthFacade`'s `onAuthStateChange` subscription and call `.data.unsubscribe()` in `ngOnDestroy`
- Use `AbortController` for `fetch()` calls in components

---

### C5. [ARCHITECTURE] Trash component bypasses facade entirely

**Severity:** ⚠️ HIGH

**File:** `src/app/web-front/components/trash/trash.ts`

```typescript
private projectsService = inject(ProjectSupabaseService);
private prototypesService = inject(PrototypesSupabaseService);
// ...
this.projectsService.getTrashedProjects(userId).subscribe({ ... });
this.projectsService.permanentDeleteProject(id).subscribe({ ... });
```

**Problem:**
The Trash component injects services directly instead of going through facades. This breaks the established architecture pattern completely. The facades (`ProjectsFacade`, `PrototypesFacade`) have `clearCache()` methods that are called from Trash, but the actual CRUD operations bypass state management. This means:
- Mutations don't refresh the observable streams
- The cache is manually cleared but not the streams
- Two different code paths for the same operations (one via facade, one direct)

**Fix:**
Add `restoreProject`, `getTrashedProjects`, and `permanentDelete` methods to the respective facades and use them from the component.

---

### C6. [ARCHITECTURE] Mixed state management patterns across facades

**Severity:** ⚠️ HIGH

**Files:**
- `src/app/auth/facades/auth.facade.ts` — BehaviorSubjects
- `src/app/projects/facades/projects.facade.ts` — BehaviorSubjects + observables
- `src/app/prototypes/facades/prototypes.facades.ts` — BehaviorSubjects
- `src/app/prototypes/ai/facades/ai-analysis.facade.ts` — Signals (completely different)
- `src/app/prototypes/editor/facades/editor.facade.ts` — Signals

**Problem:**
Three different state management approaches in the same application:
- Auth/Projects/Prototypes facades: RxJS BehaviorSubjects
- AI Analysis facade: Signal-based state
- Editor facade: Direct signals

This inconsistency makes the codebase harder to reason about. A new developer needs to understand three patterns. The choice between RxJS and signals seems arbitrary rather than intentional.

**Fix:**
Pick one pattern and apply consistently. Given Angular's direction, **signals** are the recommended approach for new Angular 21 apps. If RxJS streams are needed (e.g., for pagination), wrap signals with `toObservable()` where needed.

---

# Detailed Issues

## Architecture & Pattern Violations

### A1. Facade pattern is partially applied — services still exposed publicly

**Severity:** ⚠️ HIGH

**Files:** Multiple

**Problem:**
The facade pattern intends to provide a clean API while hiding service implementations. However:
- `DialogProject` injects `ProjectSupabaseService` directly (line 22)
- `DialogPrototype` injects `PrototypesSupabaseService` directly (line 24)
- Trash injects services directly

Components should ONLY inject facades. When components inject services directly, the facade becomes an optional middle layer rather than a mandatory gateway.

**Fix:**
Expose all needed methods through facades and remove direct service injections from components.

---

### A2. `DialogBase` abstract class knows too much about form structure

**Severity:** 🟡 MEDIUM

**File:** `src/app/shared/components/dialog.abstract.ts`

```typescript
abstract createForm: FormGroup;
errorsName(): string[] {
    const errors = this.createForm.controls['name'].errors;  // hardcoded 'name'
    // ...
    this.handleSubmit(control.value!, this.createForm.controls['description'].value!); // hardcoded 'description'
}
```

**Problem:**
The base class hardcodes field names (`'name'`, `'description'`), meaning any dialog that uses a form without these exact field names will break. This is a fragile base class problem.

**Fix:**
Make field names abstract or pass them as parameters. Better yet, make `errorsName()` and `onSubmit()` fully abstract and let each subclass handle its own form structure.

---

### A3. Duplicate pagination logic across facades

**Severity:** 🟡 MEDIUM

**Files:**
- `src/app/projects/facades/projects.facade.ts`
- `src/app/prototypes/facades/prototypes.facades.ts`

**Problem:**
Both facades implement virtually identical pagination logic:
- `page$` BehaviorSubject
- `limit` property
- `goToPage/nextPage/prevPage` methods
- Cache Map with key generation
- `lastResponse` tracking

This violates DRY. A shared `PaginationFacade` or `PaginatedList` class could encapsulate this.

**Fix:**
Extract a generic `PaginatedFacade<T>` base class or a mixin function that handles pagination state, cache, and page navigation.

---

### A4. `search-input` uses `effect()` for debouncing instead of RxJS

**Severity:** ⚠️ HIGH

**File:** `src/app/web-front/components/search-input/search-input.ts` (line 32-42)

```typescript
debounceEffect = effect((onCleanup) => {
    const value = this.inputValue();
    const timeout = setTimeout(() => {
        this.searchedValue.emit(value);
    }, this.debounceTime());
    onCleanup(() => { clearTimeout(timeout); });
});
```

**Problem:**
Angular's `effect()` is designed for **side-effect coordination** (e.g., syncing state to `localStorage`), not for event debouncing. Using it this way:
1. Creates a raw `setTimeout` that's not integrated with Angular's zone
2. Runs outside the normal component lifecycle for this purpose
3. `effect()` is still developer preview and may change
4. The default `debounceTime` is **3000ms** (3 seconds!) — absurdly long for a search input

Additionally: the debounce fires on **every input value change**, including programmatic ones, not just user keystrokes.

**Fix:**
Use the standard RxJS approach:
```typescript
private searchSubject = new Subject<string>();

constructor() {
    this.searchSubject.pipe(
        debounceTime(300),  // 300ms is standard
        distinctUntilChanged(),
        filter(value => value.length >= 2 || value.length === 0),
    ).subscribe(value => this.searchedValue.emit(value));
}

onInput(value: string) {
    this.searchSubject.next(value);
}
```

---

### A5. Inconsistent component API — both `input()` and `@Input()` in use

**Severity:** 🟡 MEDIUM

**File:** 
- `src/app/shared/components/pagination/pagination.ts` — uses `@Input()` / `@Output()` (old)
- `src/app/web-front/components/front-sidebar/front-sidebar.ts` — uses `@Output()` (old)
- Everywhere else — uses `input()` / `output()` (modern)

**Problem:**
`Pagination` and `FrontSidebar` use the older `@Input`/`@Output` decorators while all new components use `input()`/`output()` signals. This is an inconsistency that makes the codebase look like it was written by different people without coordination.

**Fix:**
Migrate `Pagination` and `FrontSidebar` to use `input()`, `output()`, and signal-based APIs.

---

## RxJS & Reactive Patterns

### R1. `AuthCallback` uses `setTimeout` for navigation

**Severity:** 🟡 MEDIUM

**File:** `src/app/auth/pages/auth-callback/auth-callback.ts` (line 31-38)

```typescript
setTimeout(() => this.router.navigate(['/login']), 3000);
// ...
setTimeout(() => this.router.navigateByUrl(destination), 1000);
```

**Problem:**
Hardcoded timeouts for navigation are fragile:
- The 1-second delay before navigating is arbitrary
- If the auth state hasn't propagated by then, the user lands on `/projects` but the auth guard might redirect them back
- Race condition: what if the redirect URL arrives after the timeout fires?

**Fix:**
Use the `AuthFacade`'s auth state observable to wait for actual authentication, then navigate.

---

### R2. `ProjectsFacade.projects$` observable in constructor never used by templates

**Severity:** 🟡 MEDIUM

**File:** `src/app/projects/facades/projects.facade.ts` (line 32-37)

**Problem:**
`projects$` is defined but the `Projects` component uses `paginatedProjects$` instead. This creates an active but dead observable stream that fires unnecessary requests to Supabase whenever `refresh$` emits, even though nobody is subscribed to it in templates. Due to `async` pipe subscription, this leaks requests.

Actually, looking more carefully — nobody subscribes to `projects$` in any template, so it's effectively dead code, but its `combineLatest` still activates when subscribed to internally.

**Fix:**
Remove `projects$` if unused, or ensure it's used consistently.

---

### R3. Nested subscriptions in dialog components

**Severity:** ⚠️ HIGH

**Files:**
- `src/app/projects/components/dialog-project/dialog-project.ts` (line 63)
- `src/app/prototypes/components/dialog-prototype/dialog-prototype.ts` (line 74)

```typescript
handleSubmit(name: string) {
    // ...
    this.projectSupabaseService.getProjectByName(name, userId).subscribe((project) => {
        if (project) { /* ... */ return; }
        // ... rest of the logic including another subscribe inside
        if (this.mode() === 'create') {
            this.projectsFacade.addProject(newProject);  // subscribe inside subscribe
        }
        // ...
    });
}
```

**Problem:**
The subscribe inside `handleSubmit` is nested — the code checks for duplicate names by subscribing, and then inside that subscription, it calls `addProject` which triggers another subscription. This creates:
1. Hard-to-read callback nesting
2. Error handling complexity
3. Potential timing issues

**Fix:**
Use `switchMap` or `concatMap` to chain the operations:
```typescript
handleSubmit(name: string) {
    this.projectSupabaseService.getProjectByName(name, userId).pipe(
        switchMap(project => {
            if (project) throw new DuplicateError();
            return this.projectsFacade.addProject(newProject);
        }),
    ).subscribe({ ... });
}
```

---

## Security & Auth

### S1. Supabase Edge Function has no authentication check

**Severity:** ⚠️ HIGH

**File:** `supabase/functions/analyze-ui/index.ts`

**Problem:**
The `analyze-ui` edge function accepts requests from any origin (`Access-Control-Allow-Origin: *`) and doesn't verify authentication tokens. Anyone who discovers the Supabase project URL can call this function. While the function currently returns mock data (unless `AI_ENABLED=true`), if AI is enabled, it could be abused.

**Fix:**
- Add Supabase auth token verification in the edge function
- Restrict CORS to known origins
- Add rate limiting (currently in-memory Map-based, not shared across instances)

---

### S2. Auth callback URL uses `window.location.origin`

**Severity:** 🟡 MEDIUM

**File:** `src/app/auth/services/authSupabase.service.ts` (line 15)

```typescript
redirectTo: `${window.location.origin}/auth/callback`,
```

**Problem:**
This works for standard setups but can fail in:
- Hosted environments where the app is served behind a reverse proxy
- Iframed deployments (different origin)
- Development with port forwarding

**Fix:**
Make the redirect URL configurable via environment config:
```typescript
redirectTo: environment.authRedirectUrl || `${window.location.origin}/auth/callback`,
```

---

## Testing

### T1. Tests test implementation, not behavior

**Severity:** ⚠️ HIGH

**Files:** All facade and service spec files

**Examples:**
```typescript
// projects.facade.spec.ts — tests that mock was called, not that state changed
it('should call addProject on service', () => {
    facade.addProject({ name: 'New Project', description: 'Desc' } as any);
    expect(mockService.addProject).toHaveBeenCalledWith(
        { name: 'New Project', description: 'Desc' },
        'test-user-id'
    );
});
```

**Problem:**
Most tests verify that a mock method was called with specific arguments — this is **implementation testing**, not behavior testing. They don't verify:
- That `addProject` actually updates the observable stream
- That the cache is cleared
- That `refresh$` emits
- That error states are handled

If someone refactors `addProject` to use a different internal mechanism, all tests pass but the feature breaks.

**Fix:**
Test observable outputs, not method calls:
```typescript
it('should add project and refresh the list', async () => {
    facade.addProject(mockProject);
    await waitFor(() => {
        const projects = facade.paginatedProjects$; // should reflect new data
        // assert on behavior
    });
});
```

---

### T2. PrototypesFacade test has commented-out test

**Severity:** 🟡 MEDIUM

**File:** `src/app/prototypes/facades/prototypes.facades.spec.ts` (line 33-44)

```typescript
describe('loadPrototypes', () => {
    // it('should emit prototypes from service', async () => {
    //     const mockPrototypes = [...];
    //     ...
    //     expect(prototypes).toHaveLength(1);
    //     expect(prototypes[0].name).toBe('Prototype 1');
    // });
```

**Problem:**
A test is commented out. This means:
- The behavior it was supposed to verify is untested
- There's no documented reason why it's commented out
- It erodes confidence in the test suite

**Fix:**
Either fix and uncomment the test, or remove it entirely with a clear comment explaining why.

---

### T3. Service tests are absurdly complex for what they test

**Severity:** 🟡 MEDIUM

**File:** `src/app/projects/services/projectsSupabase.service.spec.ts`

**Problem:**
The service tests manually mock the entire Supabase chain (select → eq → is → maybeSingle) with 50+ lines of mock setup per service. This creates:
1. Extremely brittle tests — any Supabase query restructuring breaks all mocks
2. False sense of coverage — tests pass but don't validate actual Supabase interaction
3. High maintenance cost for low value

**Fix:**
Use a Supabase mock library or integration test against a local Supabase instance for these tests. Alternatively, test at the facade level with service mocks rather than at the service level with Supabase mocks.

---

### T4. E2E tests have no error handling

**Severity:** ⚠️ HIGH

**File:** `e2e/auth.setup.ts`

```typescript
await page.fill('input[type="email"]', process.env.E2E_EMAIL!);
await page.fill('input[type="password"]', process.env.E2E_PASSWORD!);
await page.click('button[type="submit"]');
await expect(page).toHaveURL('http://localhost:4200/projects');
```

**Problem:**
The auth setup test doesn't handle:
- Network errors during login
- Invalid credentials (throws runtime error due to `!` non-null assertion on potentially undefined env vars)
- Rate limiting
- Redirect failures
- `process.env.E2E_EMAIL!` non-null assertion will crash if env var is not set

**Fix:**
```typescript
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
if (!email || !password) throw new Error('E2E_EMAIL and E2E_PASSWORD must be set');
await page.fill('input[type="email"]', email);
// ...
await expect(page).toHaveURL(/\/projects/);
```

---

### T5. Only one real e2e test for the full flow

**Severity:** 🟡 MEDIUM

**Files:** `e2e/specs/project.spec.ts`, `e2e/specs/prototype.spec.ts`, `e2e/full-flow.spec.ts`

**Problem:**
Looking at the e2e directory, there are specs for individual operations but the full flow is minimal. Missing critical flows:
- Error states: what happens when Supabase is down?
- Auth failure: what happens on wrong password?
- Empty states: what does the UI show with no projects?
- Pagination: does it work with >8 items?
- Mobile: no mobile viewport tests (all commented out in config)

---

## TypeScript & Type Safety

### TS1. Extensive use of `as any` and unsafe casts

**Severity:** ⚠️ HIGH

**Files (partial list):**
- `src/app/projects/services/projectsSupabase.service.ts` (lines 102, 131, 156) — `as any` for update objects
- `src/app/prototypes/services/prototypesSupabase.service.ts` (lines 124, 153) — `as any` for update objects
- `src/app/prototypes/editor/services/editor-supabase.service.ts` (lines 21, 47) — `as unknown as EditorTreeInterface`
- `src/app/projects/types/datatypes.types.ts` — entire type file uses `as never`
- Test files — `as any` throughout

**Problem:**
The project has TypeScript strict mode enabled but uses `as any` to bypass it. This defeats the entire purpose of strict mode. Key examples:

1. `{ deleted_at: new Date().toISOString() } as any` — the `as any` hides type mismatches on the Supabase query builder
2. `data as unknown as EditorTreeInterface | null` — unsafe double cast could mask runtime type errors
3. Test files pass partial objects with `as any` instead of proper typing

**Fix:**
- Properly type Supabase partial updates using `Partial<T>`
- Use proper type guards instead of casts
- Create factory functions for test data instead of `as any`

---

### TS2. Database type definitions are incomplete

**Severity:** 🟡 MEDIUM

**File:** `src/app/projects/types/datatypes.types.ts`

**Problem:**
The `projects` table Row type only includes `id`, `name`, `description` — missing `user_id`, `deleted_at`, `created_at`, `updated_at`, and potentially other columns. This means TypeScript won't catch errors when accessing these fields.

**Fix:**
Regenerate Supabase types from the actual database schema using `supabase gen types typescript --linked`.

---

### TS3. `PrototypeInterface.project_id` is optional when it shouldn't be

**Severity:** 🟡 MEDIUM

**File:** `src/app/prototypes/interfaces/prototype.interface.ts`

```typescript
export interface PrototypeInterface {
    id: number;
    name: string;
    // ...
    project_id?: number | null;  // ← optional AND nullable
}
```

**Problem:**
A prototype cannot exist without a project in the database schema (foreign key constraint), but the interface allows `project_id` to be undefined or null. This creates potential runtime errors where code assumes `project_id` exists but doesn't check.

**Fix:**
```typescript
project_id: number;  // required, non-nullable
```

---

## UI/UX

### UX1. No loading state in Trash component

**Severity:** 🟡 MEDIUM

**File:** `src/app/web-front/components/trash/trash.ts`

**Problem:**
The `loading` signal exists but there's no conditional rendering in the template to show a loading spinner while data is being fetched. The user sees an empty "Trash is empty" message (or nothing) while the request is in flight.

**Fix:**
Add `@if (loading()) { ... }` with a loading spinner in `trash.html`.

---

### UX2. Auth callback shows spinner indefinitely on network error

**Severity:** 🟡 MEDIUM

**File:** `src/app/auth/pages/auth-callback/auth-callback.ts`

**Problem:**
If the auth callback page loads but Supabase doesn't respond (network error), the user sees a spinner forever. The error handling only checks for URL query parameter errors, not authentication failures.

**Fix:**
Add a timeout in `ngOnInit` that shows an error message if auth doesn't complete within a reasonable time.

---

### UX3. PrototypeCard fetches external HTML without error feedback

**Severity:** ⚠️ HIGH

**File:** `src/app/prototypes/components/prototype-card/prototype-card.ts`

```typescript
ngOnInit() {
    const url = this.proto().url;
    if (url) {
        fetch(url)
            .then((res) => res.text())
            .then((html) => {
                this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(wrappedSrcdoc));
            });
        // NO .catch() — silent failure
    }
}
```

**Problem:**
If the URL is unreachable, returns a non-200 status, or the HTML is malformed, the error is silently swallowed. The card renders without a preview with no indication to the user.

**Fix:**
Add `.catch()` handler that sets an error state, and show a fallback in the template.

---

### UX4. Search debounce set to 3000ms (3 seconds)

**Severity:** 🟡 MEDIUM

**File:** `src/app/web-front/components/search-input/search-input.ts` (line 17)

```typescript
debounceTime = input(3000);
```

**Problem:**
A 3-second debounce on search means the user types and waits 3 full seconds before results appear. This is an extremely poor UX. Standard search debounce is 300-400ms.

**Fix:**
Change default to 300ms.

---

### UX5. Broken iFrame re-render pattern using `@for` hack

**Severity:** 🟡 MEDIUM

**File:** `src/app/prototypes/components/prototype/prototype.html` (line 88)

```html
@for (ver of [previewVersion()]; track ver) {
    <!-- iframe content -->
}
```

**Problem:**
This creates a single-element array with a version number and uses `@for` with `track` to force Angular to destroy/recreate the iframe DOM element. While it works, it's a fragile hack that:
1. Creates unnecessary array allocations on every render
2. Relies on undocumented behavior of `track` in `@for`
3. Confuses developers reading the code

**Fix:**
Use a dedicated wrapper component with an `@Input()` version that triggers `ngOnChanges`, or use a key on the iframe itself:
```html
<iframe [key]="previewVersion()" [srcdoc]="currentSrcdoc()!" ...></iframe>
```

---

## Performance

### P1. `PrototypesFacade.getPrototypesByProject` fetches ALL prototypes for a project (no limit)

**Severity:** 🟡 MEDIUM

**File:** `src/app/prototypes/services/prototypesSupabase.service.ts` (line 11)

**Problem:**
The `getPrototypesByProject` query selects all prototypes without pagination. This is called from `ProjectCard.ngOnInit` which only uses the first 4 items. If a project has hundreds of prototypes, this fetches all of them through Supabase (network + deserialization) just to display 4.

**Fix:**
Add a `.limit(4)` or `.range(0, 3)` to the query, or create a dedicated `getRecentPrototypesByProject(projectId, limit)` method.

---

### P2. `RecentPrototypes` loads prototypes sequentially with `for...of` + `await`

**Severity:** 🟡 MEDIUM

**File:** `src/app/web-front/components/recent-prototypes/recent-prototypes.ts` (line 57-74)

```typescript
for (const item of recent) {
    try {
        const [prototype, project] = await Promise.all([
            this.getPrototype(item.projectId, item.prototypeId, userId),
            this.getProject(item.projectId, userId),
        ]);
        if (prototype && project) { results.push({ ... }); }
    } catch (err) { console.error('Error loading recent prototype', err); }
}
```

**Problem:**
While `Promise.all` is used for the individual item's two requests, the items themselves are processed sequentially. If there are 10 recent prototypes, you get 20 sequential network requests.

**Fix:**
Use `Promise.all` for all items:
```typescript
const results = await Promise.all(
    recent.map(item => this.loadRecentItem(item, userId))
);
```

---

### P3. No lazy loading for feature modules

**Severity:** 🟡 MEDIUM

**Noted in:** `AGENTS.md` — "No lazy loading configured via routes"

**Problem:**
While `loadComponent` is used in routes (which IS lazy loading per route), the AGENTS.md explicitly says "No lazy loading configured via routes (all loaded eagerly)". Looking at the actual code, `loadComponent` IS used, so this might be a documentation error. But the note suggests lazy loading may not be working as expected. Check the build output: `dist/ang-crud/browser/` has 27 chunks, which suggests code splitting IS happening. However, the AGENTS.md disclaimer is incorrect and should be updated.

**Fix:**
Update AGENTS.md to reflect actual lazy loading status.

---

### P4. Redundant FontAwesome icon imports in every component

**Severity:** 🟡 MEDIUM

**Problem:**
Every component that uses FontAwesome imports icons individually:
```typescript
// auth/pages/register/register.ts
import { faEnvelope, faLock, faSpinner, faCheck, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
// ...
faEnvelope = faEnvelope;
faLock = faLock;
// etc.
```

This pattern is repeated in 10+ files. While tree-shaking handles unused exports, the repetition creates maintenance overhead and makes the code harder to read. Additionally, `app.config.ts` also adds icons via `FaIconLibrary.addIcons()` — creating two parallel patterns for icon registration.

**Fix:**
Standardize on one approach. Either:
1. Register all icons in the library in `app.config.ts` and use them directly in templates, OR
2. Import per component (current pattern), but remove `FaIconLibrary` from app.config

---

## Maintainability

### M1. Dead code: `AuthSupabaseService.getUser()` is never called

**Severity:** 🟢 LOW

**File:** `src/app/auth/services/authSupabase.service.ts` (line 57-60)

**Problem:**
`getUser()` is defined but never used anywhere in the codebase.

**Fix:** Remove it.

---

### M2. Mixed language comments throughout codebase

**Severity:** 🟢 LOW

**Files:**
- `src/app/prototypes/services/prototypesSupabase.service.ts` (line 90) — Catalan: "Deuria comprovar-se per mateix nom i mateix projecte"
- Various files have comments in Catalan, English, and Spanish

**Problem:**
While not a functional issue, inconsistent language choices in comments reduce professionalism and can confuse new team members.

**Fix:**
Standardize on one language for all comments.

---

### M3. `app.config.ts` has duplicate icon registration

**Severity:** 🟢 LOW

**File:** `src/app/app.config.ts` (line 21)

```typescript
lib.addIcons(faHouse, faFile, faTrash);
```

**Problem:**
Only 3 icons registered globally via `FaIconLibrary`, while individual components import dozens of others directly. The global registration serves no purpose since those 3 icons may not even be used.

---

### M4. Environment files are identical

**Severity:** 🟢 LOW

**Files:**
- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

**Problem:**
Both files contain the same Supabase URL and key. The `baseUrl` exists only in development. There's no distinction between environments.

**Fix:**
Use different Supabase projects for dev/prod, or at least document that they're intentionally shared.

---

### M5. Unused `JsonPipe` import in dialog components

**Severity:** 🟢 LOW

**Files:**
- `src/app/projects/components/dialog-project/dialog-project.ts` (line 4)
- `src/app/prototypes/components/dialog-prototype/dialog-prototype.ts` (line 1)

```typescript
import { JsonPipe } from '@angular/common';
```

**Problem:**
`JsonPipe` is imported but not used in either dialog component or their templates.

**Fix:** Remove unused imports.

---

## Edge Cases & Potential Runtime Errors

### E1. `authFacade.signInWithPassword()` throws on error, but caller expects error in return

**File:** `src/app/auth/pages/login/login.ts` (line 57-60)
```typescript
try {
    await this.authFacade.signInWithPassword(this.email, this.password);
    this.navigateAfterLogin();
} catch (_error) {
    this.errorMessage.set('Invalid email or password');
}
```

**Problem:**
`AuthFacade.signInWithPassword()` throws the error (line 70), but other sign-in methods like `signInWithGoogle()` (line 53) just log errors silently. This inconsistency means the OAuth methods silently fail with no user feedback.

**Fix:**
Make error handling consistent across all sign-in methods.

---

### E2. `confirm-modal` doesn't use native `<dialog>`

**File:** `src/app/shared/components/confirm-modal/confirm-modal.ts`

**Problem:**
Looking at the implementation, the modal uses `isOpen` as an input but doesn't use the native `<dialog>` element. Meanwhile, `dialog-shell` uses a proper `<dialog>` with `showModal()`/`close()`. This inconsistency means the confirm modal may not behave correctly with keyboard navigation (no Escape key handling) or accessibility tools.

---

### E3. Pagination shows incorrect "Showing X-Y of Z" for empty lists

**File:** `src/app/shared/components/pagination/pagination.ts` (line 50-53)

```typescript
getShowingInfo(): string {
    const from = (this.currentPage - 1) * this.limit + 1;
    const to = Math.min(this.currentPage * this.limit, this.total);
    return `Showing ${from}-${to} of ${this.total}`;
}
```

**Problem:**
When `total` is 0, this shows "Showing 1-0 of 0" — incorrect. Also, this logic doesn't account for last pages where the range might be smaller.

**Fix:**
Add a guard for empty lists and handle edge cases:
```typescript
if (this.total === 0) return 'No items';
const from = Math.min((this.currentPage - 1) * this.limit + 1, this.total);
const to = Math.min(this.currentPage * this.limit, this.total);
```

---

## Portfolio / Interview Considerations

### What looks junior to a hiring manager:

1. **`as any` everywhere** — This is the #1 red flag in a TypeScript project. It shows the developer doesn't know how to properly type their code or doesn't care about type safety.

2. **Tests that test mocks** — If a candidate shows tests that only verify "method was called with X" and not "state changed to Y", an interviewer will immediately spot shallow testing experience.

3. **Mixed state management patterns** — Using RxJS in some places and signals in others without a clear rationale shows lack of architectural decision-making.

4. **Inconsistent component API** — mixing `input()` signals with `@Input()` decorators (Pagination, FrontSidebar) shows lack of consistency in Angular conventions.

5. **Dead code branch** — `DialogPrototype` has a `console.log('UPDATE PROTOTYPE')` in a branch that's never reached from the UI. If someone adds an Edit button later, it silently does nothing.

6. **3-second debounce** — Shows lack of UX awareness and not testing your own product.

7. **`@for (ver of [previewVersion()]; track ver)`** — This hack would raise eyebrows in any code review.

### What would impress:

1. Consolidated signal-based state management across all facades
2. Proper error boundaries and user-facing error messages
3. A dedicated error handling strategy (HttpInterceptor, global error handler)
4. Proper Supabase RLS and type generation
5. Integration tests with actual Supabase (local or test instance)
6. Accessible modals (keyboard navigation, focus trapping, ARIA attributes)

---

## Recommendations (Priority Order)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | 🔴 Fix auth guard to not access private properties | Stability | Low |
| 2 | 🔴 Fix all subscription memory leaks | Stability | Medium |
| 3 | ⚠️ Remove direct service injection from components | Architecture | Medium |
| 4 | ⚠️ Add error handling to all fetch() calls and subscriptions | UX/Stability | Low |
| 5 | ⚠️ Reduce search debounce to 300ms | UX | Low |
| 6 | ⚠️ Rebuild test suite to test behavior, not implementation | Quality | High |
| 7 | ⚠️ Audit Supabase RLS policies | Security | Low |
| 8 | ⚠️ Add pagination LIMIT to prototype queries | Performance | Low |
| 9 | 🟡 Consolidate state management to signals | Architecture | High |
| 10 | 🟡 Update Supabase types from database schema | Type safety | Low |
| 11 | 🟡 Fix pagination component to use input()/output() signals | Consistency | Low |
| 12 | 🟡 Replace effect() debounce with RxJS debounceTime | Correctness | Low |
| 13 | 🟡 Remove dead code (getUser(), unused projects$, JsonPipe) | Maintainability | Low |
| 14 | 🟡 Replace dead `console.log('UPDATE PROTOTYPE')` with throw | Maintainability | Low |

---

## Conclusion

The project has a solid structural foundation (standalone components, feature-based organization, facade pattern intent) but suffers from **inconsistent execution**. The critical issues (broken update, private access, leaks) are blocking for production. The medium issues (inconsistent patterns, testing approach, performance) would slow down future development and make the codebase harder to maintain as it grows.

**Estimated time to fix all critical issues:** 2-3 days
**Estimated time to fix all issues:** 2-3 weeks depending on refactoring depth
