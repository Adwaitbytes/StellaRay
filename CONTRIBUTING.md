# Contributing to Stellar zkLogin Gateway

Thank you for your interest in contributing to Stellar zkLogin Gateway! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [Security](#security)

---

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful**: Treat everyone with respect. Absolutely no harassment, sexism, racism, or hate speech.
- **Be constructive**: Provide constructive feedback. Critique ideas, not people.
- **Be inclusive**: We welcome contributors from all backgrounds and experience levels.
- **Be patient**: Remember that everyone is a volunteer. Response times may vary.

---

## Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **Rust** 1.75.0 or higher
- **Soroban CLI** 25.0.0-rc.2 or higher
- **Git** 2.0 or higher

### Quick Start

```bash
# Clone the repository
git clone https://github.com/stellar-zklogin/gateway.git
cd gateway

# Install dependencies
npm install

# Build contracts
cargo build --release

# Run tests
npm test
cargo test

# Start demo app
cd demo && npm run dev
```

---

## Development Setup

### SDK Development

```bash
cd sdk

# Install dependencies
npm install

# Run in watch mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

### Contract Development

```bash
# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli --version 25.0.0-rc.2

# Build contracts
cargo build --release --target wasm32-unknown-unknown

# Run tests
cargo test

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zk_verifier.wasm \
  --network testnet
```

### Prover Development

```bash
cd prover

# Build
cargo build --release

# Run tests
cargo test

# Run prover service
cargo run --release
```

---

## Project Structure

```
stellar-zklogin-gateway/
├── contracts/                 # Soroban smart contracts
│   ├── zk-verifier/          # Groth16 proof verification
│   ├── smart-wallet/         # Session-based wallet
│   ├── gateway-factory/      # Wallet deployment factory
│   ├── jwk-registry/         # OAuth provider keys
│   └── x402-facilitator/     # HTTP payment protocol
├── sdk/                       # TypeScript SDK
│   ├── src/
│   │   ├── core/             # Stellar/Soroban primitives
│   │   ├── keys/             # Ephemeral key management
│   │   ├── oauth/            # OAuth providers
│   │   ├── prover/           # Proof generation client
│   │   ├── react/            # React hooks
│   │   ├── transaction/      # Transaction building
│   │   ├── utils/            # Crypto utilities
│   │   └── x402/             # Payment integration
│   └── __tests__/            # Test files
├── prover/                    # ZK proof generation service
├── demo/                      # Demo application
├── circuits/                  # ZK circuits (Circom)
└── docs/                      # Documentation
```

---

## Making Changes

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

Example: `feature/apple-oauth-support`

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(sdk): add Apple Sign-In support

Implements AppleOAuthProvider class with SIWA flow.
Includes JWT verification and nonce validation.

Closes #123
```

```
fix(contract): prevent session replay attack

Add nullifier tracking to prevent reuse of expired sessions.
```

---

## Testing

### SDK Tests

```bash
cd sdk

# Run all tests
npm test

# Run specific test file
npm test -- crypto.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Contract Tests

```bash
# Run all contract tests
cargo test

# Run specific contract tests
cargo test -p zk-verifier

# Run with verbose output
cargo test -- --nocapture
```

### Integration Tests

```bash
# Start local testnet
./scripts/start-testnet.sh

# Run integration tests
npm run test:integration
```

### Test Coverage Requirements

| Component | Minimum Coverage |
|-----------|------------------|
| SDK Core | 80% |
| Contracts | 90% |
| Crypto | 95% |
| OAuth | 80% |

---

## Pull Request Process

### Before Submitting

1. **Fork** the repository
2. **Create** a feature branch
3. **Write** tests for new functionality
4. **Ensure** all tests pass
5. **Update** documentation if needed
6. **Run** linters and formatters

### PR Checklist

- [ ] Tests pass locally
- [ ] Coverage maintained/improved
- [ ] Documentation updated
- [ ] Changelog entry added (if applicable)
- [ ] No console.log or debug code
- [ ] No hardcoded secrets or credentials

### Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least 1 approval required
3. **Security Review**: Required for crypto/contract changes
4. **Maintainer Merge**: Final approval and merge

### Merge Strategy

We use **squash and merge** for most PRs to keep history clean.

---

## Style Guide

### TypeScript

```typescript
// Use explicit types
function computeHash(input: Uint8Array): bigint {
  // ...
}

// Use async/await over promises
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  return response.json();
}

// Use const/let, never var
const immutable = 'value';
let mutable = 0;

// Use template literals
const message = `User ${userId} logged in`;
```

### Rust

```rust
// Use descriptive variable names
let address_seed = compute_address_seed(&inputs);

// Handle errors explicitly
fn verify_proof(proof: &Proof) -> Result<bool, ContractError> {
    // ...
}

// Document public functions
/// Verifies a Groth16 proof using Protocol 25 native primitives.
///
/// # Arguments
/// * `proof` - The Groth16 proof to verify
/// * `public_inputs` - Public inputs for verification
///
/// # Returns
/// * `Ok(true)` if proof is valid
/// * `Err(ContractError::InvalidProof)` if verification fails
pub fn verify_groth16(
    env: &Env,
    proof: &Groth16Proof,
    public_inputs: &Vec<U256>,
) -> Result<bool, ContractError> {
    // ...
}
```

### Formatting

```bash
# TypeScript/JavaScript
npm run lint
npm run lint:fix

# Rust
cargo fmt
cargo clippy
```

---

## Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@stellarzklogin.dev

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Guidelines

1. **Never** commit secrets or credentials
2. **Always** validate user input
3. **Use** constant-time comparisons for secrets
4. **Avoid** integer overflow/underflow
5. **Follow** secure coding practices for ZK circuits

---

## Recognition

Contributors are recognized in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- Release notes
- Project README
- Annual community report

---

## Getting Help

- **Discord**: [Join our server](https://discord.gg/stellarzklogin)
- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Email**: team@stellarzklogin.dev

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Stellar zkLogin Gateway! 🌟
