# AngCrud

An Angular project to learn core Angular concepts and prototype CRUD operations with Supabase as backend, including user authentication.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.5.

## Project Overview

This project serves as a practical learning environment for building full-stack applications with:

- **Angular 21** standalone components architecture
- **Supabase** for backend-as-a-service (database + authentication)
- **Tailwind CSS** + **DaisyUI** for styling
- **Vitest** for unit testing

### Features

- CRUD operations with pagination (Create, Read, Update, Delete)
- User authentication (signup, login, logout)
- Reactive state management using Facade pattern

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Angular 21 | Frontend framework |
| Supabase | Backend (PostgreSQL + Auth) |
| Tailwind CSS + DaisyUI | Styling |
| Vitest | Testing |
| RxJS | Reactive programming |

## Prerequisites

- [Supabase account](https://supabase.com) with a new project created
- Node.js 18+ and npm
- Configure your Supabase API credentials in `src/environments/environment.development.ts`

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure your Supabase credentials:

Create `src/environments/environment.development.ts` with your project URL and anon key:

```typescript
export const environment = {
    supabaseUrl: 'your-supabase-url',
    supabaseKey: 'your-anon-key'
};
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Project Structure

```
src/app/
├── auth/              # Authentication feature
│   ├── components/
│   ├── services/
│   └── facades/
├── projects/         # Projects CRUD feature
│   ├── components/
│   ├── services/
│   └── facades/
├── shared/           # Shared services
└── web-front/       # Frontend pages
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## Improvements

### To Do

- [ ] **Test Coverage**
  - **Description:** Currently only 6 of ~30 components have tests.
  - **Implementation:** Prioritize tests for services and facades (business logic). Tests for critical components: Projects, Prototypes, Dialogs.

- [x] **Cache for Projects**
  - **Description:** Projects and prototypes are now cached in memory, reducing API calls and improving navigation performance.
  - **Implementation:** Store paginated data in `Map` within Facades. Invalidate cache only on Create/Update/Delete operations. Cache hits are logged to console. Applied to both Projects and Prototypes features.

- [ ] **Improve UI**
  - **Description:** The interface can be more intuitive and accessible.
  - **Implementation:** Add loading skeletons while data loads. More descriptive error messages. Tooltips or contextual help. Visual validations on forms. Dark mode toggle for user preference.

- [x] **Filter Projects by User** - RLS + Frontend
  - **Description:** Projects and prototypes are now only visible to the user who created them.
  - **Implementation:** Added `user_id` column to projects/prototypes tables, Supabase RLS policies for row-level security, and user ID filtering in frontend queries.

- [x] **Complete Lazy Loading**
  - **Description:** Only login/register have lazy loading. All routes could benefit from it.
  - **Implementation:** Apply `loadComponent()` to all routes that don't load at startup (Projects, Prototypes, Landing, etc.).

### Completed

- [x] **Cache for Projects** - In-memory Map cache with invalidation for Projects and Prototypes
- [x] **Filter Projects by User** - RLS + Frontend
- [x] **Pagination** - Offset/limit queries with Previous/Next controls
- [x] **Full CRUD** - Create, Read, Update, Delete for projects and prototypes
- [x] **Supabase Authentication** - Signup, login, logout
- [x] **Facade Pattern** - Separation of state and business logic
- [x] **Testing Setup** - Vitest configured
- [x] **Modern Angular 21** - Standalone components and new control flow syntax
