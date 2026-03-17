# AGENTS.md - Developer Guide for ang-crud

## Project Overview

Angular 21 standalone components application with Supabase backend, Tailwind CSS + DaisyUI for styling, and Vitest for testing.

## Build / Lint / Test Commands

### Development
```bash
npm start          # Start dev server at http://localhost:4200
npm run watch      # Build with watch mode for development
```

### Building
```bash
npm run build      # Production build
```

### Testing
```bash
npm run test              # Run all tests (Vitest + Angular test runner)
npm run test -- --run     # Run tests once (no watch mode)
```

To run a **single test file**, use Vitest directly:
```bash
npx vitest run src/app/app.spec.ts
```

To run a **single test** (test name match):
```bash
npx vitest run -t "should create the app"
```

### Code Quality
- **No ESLint/TSLint configured** - rely on TypeScript strict mode
- **Formatting**: Uses Prettier (see `package.json` prettier config):
  - Print width: 100
  - Single quotes: true
  - Angular parser for `.html` files
- Run prettier: `npx prettier --write .`

---

## Code Style Guidelines

### Architecture Pattern

The project uses **Facade Pattern** for state management:
- **Services**: Handle data fetching (e.g., `*Supabase.service.ts`)
- **Facades**: Manage state and expose observables (e.g., `*.facade.ts`)
- **Components**: Standalone components using dependency injection via `inject()`

### File Organization

```
src/app/
├── {feature}/
│   ├── components/
│   │   └── {component-name}/
│   │       ├── {component-name}.ts
│   │       └── {component-name}.html
│   ├── interfaces/
│   │   └── {entity}.interface.ts
│   ├── services/
│   │   └── {feature}Supabase.service.ts
│   ├── facades/
│   │   └── {feature}.facade.ts
│   └── types/
│       └── datatypes.types.ts
└── shared/
    └── services/
```

### TypeScript Conventions

- **Strict mode enabled** in `tsconfig.json`
- **Path aliases** configured:
  - `@prototypes/*` → `./src/app/prototypes/*`
  - `@projects/*` → `./src/app/projects/*`
  - `@web-front/*` → `./src/app/web-front/*`
  - `@shared/*` → `./src/app/shared/*`
  - `@images/*` → `./public/assets/images/*`

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase (file: kebab-case) | `Projects.ts`, `project-card/` |
| Services | PascalCase + `Service` suffix | `ProjectSupabaseService` |
| Facades | PascalCase + `Facade` suffix | `ProjectsFacade` |
| Interfaces | PascalCase + `Interface` suffix | `ProjectInterface` |
| Types | PascalCase | `ProjectStatus` |
| Constants | PascalCase + `Constant` suffix | `SidebarOptionsConstant` |
| Observables | PascalCase + `$` suffix | `projects$`, `project$` |

### Imports

- Use path aliases (`@projects/`, `@shared/`, etc.)
- Group imports: Angular core → external → internal
- Use **standalone components** with `imports: []` array
- Use `inject()` for dependency injection in constructors

```typescript
import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ProjectCard } from '@projects/components/project-card/project-card';
import { ProjectsFacade } from '@projects/facades/projects.facade';
```

### Component Structure

```typescript
@Component({
    selector: 'app-{name}',
    imports: [/* standalone child components */],
    templateUrl: './{name}.html',
})
export class ComponentName {
    private facade = inject(FeatureFacade);
    data$ = this.facade.data$;
}
```

### Error Handling

- Use RxJS `subscribe()` with error callbacks
- Log errors with `console.error()` in facades
- Throw errors from services (see `projectsSupabase.service.ts:31-35`)
- Handle null/undefined with Elvis operator `?.` and nullish coalescing `??`

```typescript
this.service.getData().subscribe({
    next: (data) => { /* handle success */ },
    error: (err) => { console.error('Error message', err); },
});
```

### Templates (HTML)

- Use **Angular 17+ control flow** syntax (`@if`, `@for`, `@switch`)
- Use **deferrable views** (`@defer`) for lazy loading
- Event binding: `(click)="handler()"`
- Property binding: `[property]="value"`
- Two-way binding: `[(ngModel)]="variable"`

### CSS / Styling

- **Tailwind CSS v4** with `@import "tailwindcss"`
- **DaisyUI** via `@plugin "daisyui"`
- Custom styles in `src/styles.css`
- Component styles in inline `styles: []` or separate `.css` files

### Testing

- Use **Vitest** (configured in `tsconfig.spec.json`)
- Use Angular TestBed for component testing
- Follow existing test patterns in `app.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';

describe('ComponentName', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ComponentName);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

---

## Important Notes

- **Angular 21** with standalone components (no NgModules)
- **Supabase** client initialized in `@shared/services/supabase.client.ts`
- **No lazy loading** configured via routes (all loaded eagerly)
- Environment files: `src/environments/environment.ts` (prod), `environment.development.ts`
