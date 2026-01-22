# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-22

### Added
- Production-ready zkLogin SDK for Stellar
- Full Groth16 ZK proof generation and verification
- Google and Apple OAuth integration
- React hooks and components (`useZkLogin`, `useWallet`, `useXRay`)
- X-Ray Protocol client for BN254/Poseidon operations
- x402 HTTP Payment Protocol support
- Embedded wallet with full transaction support
- Session persistence with AES-GCM encryption
- Soroban smart contract integration

### Security
- Proper Poseidon hash implementation using poseidon-lite
- AES-GCM encryption with PBKDF2 key derivation for session export
- Secure ephemeral key generation

### Technical
- Full Stellar SDK transaction building with XDR serialization
- TypeScript 5.3 with strict mode
- ESM and CJS dual module support
- Tree-shakeable exports

## [1.0.0] - 2025-01-15

### Added
- Initial SDK release
- Basic zkLogin functionality
- OAuth flow support
