# Contributing to SemanticSearch.js

We are thrilled that you'd like to contribute! This library is built to remain lightweight, fast, and completely local. 

## Getting Started

1. **Fork & Clone**
   Fork the repository and clone it to your local machine.
   ```bash
   git clone https://github.com/yourname/semantic-search-js.git
   cd semantic-search-js
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

## Pull Request Process

1. Create a descriptive branch name (`feat/add-mysql-adapter` or `fix/model-cache`).
2. Implement your changes.
3. Write comprehensive unit and/or integration tests.
4. Update the documentation in `README.md` if applicable.
5. Submit a PR and ensure CI passes.

## Code of Conduct
Please be respectful and kind to others in issues and PR reviews. We welcome developers of all skill levels!
