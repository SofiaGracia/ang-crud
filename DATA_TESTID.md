# DATA-TESTID Map for E2E Playwright Tests

## 1. Login (`src/app/auth/pages/login/login.html`)
- `login-error-message`: Error message container
- `login-email-input`: Email input field
- `login-password-input`: Password input field
- `login-submit-button`: Sign In submit button

## 2. Project List (`src/app/projects/components/projects/projects.html`)
- `create-project-button`: New Project button in header
- `create-first-project-button`: Create First Project button (empty state)

## 3. Project Card (`src/app/projects/components/project-card/project-card.html`)
- `project-card`: Project card container (navigates to project)
- `project-title`: Project title text
- `project-menu`: Project menu button

## 4. Shared Dialog Shell (`src/app/shared/components/dialog-shell/dialog-shell.html`)
- `dialog-close-button`: Dialog close (X) button
- `dialog-name-input`: Name input (reused in project/prototype dialogs)
- `dialog-description-textarea`: Description textarea (reused in project/prototype dialogs)
- `dialog-error-list`: Validation error list container
- `dialog-submit-button`: Dialog submit (Create) button

## 5. Prototypes List (`src/app/prototypes/components/prototypes/prototypes.html`)
- `add-prototype-button`: Add prototype button in project view

## 6. Prototype Card (`src/app/prototypes/components/prototype-card/prototype-card.html`)
- `prototype-card`: Prototype card container (navigates to prototype view)

## 7. Prototype Creation Dialog (`src/app/prototypes/components/dialog-prototype/dialog-prototype.html`)
- `prototype-dropzone`: HTML file upload drop zone label
- `prototype-html-file-input`: HTML file input (triggered by dropzone)

## 8. Prototype View (`src/app/prototypes/components/prototype/prototype.html`)
- `prototype-loading`: Loading spinner during prototype load
- `prototype-error-message`: Error message container
- `prototype-tab-preview`: Preview tab button
- `prototype-tab-code`: Code view tab button
- `prototype-render-iframe`: Render sandbox iframe
- `prototype-code-view`: Raw HTML code view container
