# Project Conventions & Workflow

## Project Context

- Reference project: Spring Boot backend using Gradle
- This project may use a different tech stack
- Only reuse conventions, not the framework

---

## Commit Convention

- Follow Git commit message conventions:
  - `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- All commit messages must be written in English
- Keep commits small and focused
- One logical change per commit

---

## Branch Strategy

- Use `main` as the stable branch
- Create feature branches using:
  - `feat/{name}`
- Do NOT commit directly to `main`

---

## Code Modification Rules

- Only modify files directly related to the task
- Do NOT refactor unrelated code
- Do NOT rename files or directories unless explicitly required

---

## Code Quality

- Ensure the project builds successfully before committing
- Do NOT introduce runtime or build errors
- Do NOT leave debug logs or temporary code
- Remove all debug artifacts before finalizing changes

---

## Architecture Principles

- Follow a domain-oriented structure
- Organize code by domain first (NOT by technical layer)

Each domain should contain:

- `controller` → handles external/API requests
- `service` → contains business logic
- `repository` → handles data persistence
- `model/dto` → request/response structures
- `model/entity` → data models (or equivalent)
- `model/enums` → enumerations

---

## Architecture Rules

- Do NOT put business logic in controllers
- Do NOT put persistence logic outside repositories
- Use a `global` (or equivalent) layer only for shared cross-domain logic

---

## Test Rules

- Use the given-when-then structure
- Use descriptive test names (equivalent to `@DisplayName`)
- Each test should verify only ONE behavior
- Cover both success and failure cases when applicable
- Keep tests independent (no shared state, no order dependency)
- Prefer focused unit/service-level tests over heavy integration tests
- Use mocks only when necessary
- Assert only what is relevant to the test purpose
- Use clear and meaningful test data

---

## Important

- These rules define HOW you work, not WHAT tech you must use
- You may change the tech stack, but must follow these conventions
- Maintain consistency across the entire project