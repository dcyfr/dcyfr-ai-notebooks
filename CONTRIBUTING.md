# Contributing to @dcyfr/ai-notebooks

## Development Setup

```bash
git clone https://github.com/dcyfr/dcyfr-ai-notebooks.git
cd dcyfr-ai-notebooks
npm install
npm test
```

## Guidelines

- Write tests for all new functionality
- Use TypeScript strict mode
- Follow existing code patterns (immutable data, pure functions)
- Export all public APIs through barrel files (`index.ts`)
- Include JSDoc comments on all public functions

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Write tests and implementation
4. Ensure all tests pass: `npm test`
5. Ensure types check: `npm run typecheck`
6. Submit a pull request

## Code Style

- Use `const` by default
- Prefer explicit return types on public functions
- Use Zod schemas for runtime validation
- Keep functions small and focused
