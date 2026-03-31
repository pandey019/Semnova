# Contributing to Semnova

We are thrilled that you'd like to contribute! This library is built to remain lightweight, fast, and completely local. 

## Getting Started

1. **Fork & Clone**
   Fork the repository and clone it to your local machine.
   ```bash
   git clone https://github.com/pandey019/Semnova.git
   cd Semnova
   ```

2. **Install Dependencies**
   We use `npm` for dependency management.
   ```bash
   npm install
   ```

3. **Running the Tests**
   We use `vitest` for all our tests. All PRs must maintain or improve code coverage.
   ```bash
   npm run test
   npm run test:watch
   ```

4. **Building**
   We use `tsup` to build ESM and CommonJS bundles.
   ```bash
   npm run build
   ```

## Development Guidelines

- **Zero Cloud APIs**: No API keys should ever be required for core functionality.
- **Size Matters**: We keep the core bundle as small as possible. The `pgvector` and `sqlite` adapters must remain as optional peer dependencies.
- **TypeScript First**: Write strong, generic types. `SearchIndex<T>` should safely propagate the user's data structure throughout the entire library.
- **Conventional Commits**: Please use `feat:`, `fix:`, `docs:`, `chore:`, or `test:` prefixes in your commit messages.

## Writing Tests and Test Cases

We strictly use **Vitest** for our test runner. Every new feature, logic change, or bugfix must be accompanied by relevant test cases.

1. **Location:** Place your test files in the `tests/` directory. If you are adding a test for a specific store adapter, place it in `tests/stores/`.
2. **Naming:** File names should mirror the source file but end in `.test.ts` (e.g., `src/embedder.ts` -> `tests/embedder.test.ts`).
3. **Structure:** Use `describe` blocks to group related tests and `it` for individual test cases. Always use `expect` for assertions.
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { myFunction } from '../src/my-file';

   describe('myFunction', () => {
     it('should return the correct expected output', () => {
       const result = myFunction('input');
       expect(result).toBe('expected');
     });
   });
   ```
4. **Mocking External Services:** If your test requires interacting with a heavy database or external service (like the HuggingFace pipeline or PostgreSQL instances), prefer using Vitest's `vi.mock()` to mock the implementation so that the unit tests remain fast and completely deterministic. E2E tests can interact with real instances (like in `tests/search-index.test.ts`).
5. **Running your tests:** 
   Run `npm run test` to execute the suite once, or `npm run test:watch` while actively developing to automatically re-run files on save.

## Pull Request Process

1. Create a descriptive branch name (`feat/add-mysql-adapter` or `fix/model-cache`).
2. Implement your changes.
3. Write comprehensive unit and/or integration tests.
4. Update the documentation in `README.md` if applicable.
5. Submit a PR and ensure CI passes.

## Code of Conduct
Please be respectful and kind to others in issues and PR reviews. We welcome developers of all skill levels!
