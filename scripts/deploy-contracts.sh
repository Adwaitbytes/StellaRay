#!/bin/bash
# Deploy all Stellar zkLogin contracts to testnet

set -e

echo "🚀 Deploying Stellar zkLogin Gateway contracts..."

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ soroban CLI not found. Install it with: cargo install --locked soroban-cli"
    exit 1
fi

# Load environment
if [ -f .env ]; then
    source .env
fi

NETWORK=${STELLAR_NETWORK:-testnet}
RPC_URL=${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}

echo "📡 Network: $NETWORK"
echo "🔗 RPC: $RPC_URL"

# Build contracts
echo ""
echo "🔨 Building contracts..."
cd contracts
cargo build --release --target wasm32-unknown-unknown

# Optimize WASM files
echo ""
echo "📦 Optimizing WASM..."
for contract in zk-verifier smart-wallet jwk-registry gateway-factory x402-facilitator; do
    wasm_path="target/wasm32-unknown-unknown/release/${contract//-/_}.wasm"
    if [ -f "$wasm_path" ]; then
        echo "  Optimizing $contract..."
        soroban contract optimize --wasm "$wasm_path"
    fi
done

# Deploy contracts
echo ""
echo "📤 Deploying contracts..."

# 1. Deploy ZK Verifier
echo "  Deploying ZK Verifier..."
ZK_VERIFIER_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/zk_verifier.optimized.wasm \
    --source $DEPLOYER_SECRET \
    --rpc-url $RPC_URL \
    --network-passphrase "Test SDF Network ; September 2015" 2>&1 | tail -1)
echo "  ✅ ZK Verifier: $ZK_VERIFIER_ID"

# 2. Deploy JWK Registry
echo "  Deploying JWK Registry..."
JWK_REGISTRY_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/jwk_registry.optimized.wasm \
    --source $DEPLOYER_SECRET \
    --rpc-url $RPC_URL \
    --network-passphrase "Test SDF Network ; September 2015" 2>&1 | tail -1)
echo "  ✅ JWK Registry: $JWK_REGISTRY_ID"

# 3. Upload Smart Wallet WASM (for factory deployment)
echo "  Uploading Smart Wallet WASM..."
SMART_WALLET_HASH=$(soroban contract install \
    --wasm target/wasm32-unknown-unknown/release/smart_wallet.optimized.wasm \
    --source $DEPLOYER_SECRET \
    --rpc-url $RPC_URL \
    --network-passphrase "Test SDF Network ; September 2015" 2>&1 | tail -1)
echo "  ✅ Smart Wallet WASM Hash: $SMART_WALLET_HASH"

# 4. Deploy Gateway Factory
echo "  Deploying Gateway Factory..."
GATEWAY_FACTORY_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/gateway_factory.optimized.wasm \
    --source $DEPLOYER_SECRET \
    --rpc-url $RPC_URL \
    --network-passphrase "Test SDF Network ; September 2015" 2>&1 | tail -1)
echo "  ✅ Gateway Factory: $GATEWAY_FACTORY_ID"

# 5. Deploy x402 Facilitator
echo "  Deploying x402 Facilitator..."
X402_FACILITATOR_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/x402_facilitator.optimized.wasm \
    --source $DEPLOYER_SECRET \
    --rpc-url $RPC_URL \
    --network-passphrase "Test SDF Network ; September 2015" 2>&1 | tail -1)
echo "  ✅ x402 Facilitator: $X402_FACILITATOR_ID"

# Initialize contracts
echo ""
echo "⚙️ Initializing contracts..."

# Initialize Gateway Factory
echo "  Initializing Gateway Factory..."
soroban contract invoke \
    --id $GATEWAY_FACTORY_ID \
    --source $DEPLOYER_SECRET \
    --rpc-url $RPC_URL \
    --network-passphrase "Test SDF Network ; September 2015" \
    -- initialize \
    --admin $DEPLOYER_ADDRESS \
    --wallet_wasm_hash $SMART_WALLET_HASH \
    --zk_verifier $ZK_VERIFIER_ID \
    --jwk_registry $JWK_REGISTRY_ID

# Output summary
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Contract Addresses:"
echo "   ZK_VERIFIER_CONTRACT_ID=$ZK_VERIFIER_ID"
echo "   SMART_WALLET_WASM_HASH=$SMART_WALLET_HASH"
echo "   GATEWAY_FACTORY_CONTRACT_ID=$GATEWAY_FACTORY_ID"
echo "   JWK_REGISTRY_CONTRACT_ID=$JWK_REGISTRY_ID"
echo "   X402_FACILITATOR_CONTRACT_ID=$X402_FACILITATOR_ID"
echo ""
echo "Add these to your .env file!"
