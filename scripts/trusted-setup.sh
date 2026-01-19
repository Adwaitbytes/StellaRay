#!/bin/bash
# Trusted Setup for zkLogin Circuits
# Generates proving and verification keys using Powers of Tau ceremony

set -e

echo "🔐 zkLogin Trusted Setup"
echo "========================"

CIRCUIT_DIR="circuits"
KEYS_DIR="keys"
PTAU_FILE="$KEYS_DIR/powersOfTau28_hez_final_22.ptau"
CIRCUIT_NAME="zklogin"

# Create keys directory
mkdir -p $KEYS_DIR

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ circom not found. Install it with: npm install -g circom"
    exit 1
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ snarkjs not found. Install it with: npm install -g snarkjs"
    exit 1
fi

# Download Powers of Tau if not present
if [ ! -f "$PTAU_FILE" ]; then
    echo "📥 Downloading Powers of Tau (22)..."
    echo "   This is a ~1GB file and may take a while..."
    curl -L -o "$PTAU_FILE" \
        "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau"
fi

echo ""
echo "📐 Compiling circuit..."
cd $CIRCUIT_DIR

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi

# Compile circuit
circom $CIRCUIT_NAME.circom \
    --r1cs \
    --wasm \
    --sym \
    --output ../build

echo "   ✅ Circuit compiled"
echo "   Constraints: $(grep "non-linear constraints" ../build/$CIRCUIT_NAME.r1cs | cut -d: -f2 | tr -d ' ')"

cd ..

# Phase 2 setup
echo ""
echo "🎲 Starting Phase 2 trusted setup..."

# Generate initial zkey
echo "   Generating initial zkey..."
snarkjs groth16 setup \
    build/$CIRCUIT_NAME.r1cs \
    $PTAU_FILE \
    $KEYS_DIR/${CIRCUIT_NAME}_0000.zkey

# Contribute to ceremony (in production, multiple parties would contribute)
echo "   Contributing entropy..."
snarkjs zkey contribute \
    $KEYS_DIR/${CIRCUIT_NAME}_0000.zkey \
    $KEYS_DIR/${CIRCUIT_NAME}_0001.zkey \
    --name="stellar-zklogin-dev" \
    -v -e="$(head -c 64 /dev/urandom | xxd -p)"

# Export verification key
echo "   Exporting verification key..."
snarkjs zkey export verificationkey \
    $KEYS_DIR/${CIRCUIT_NAME}_0001.zkey \
    $KEYS_DIR/${CIRCUIT_NAME}.vkey.json

# Rename final zkey
mv $KEYS_DIR/${CIRCUIT_NAME}_0001.zkey $KEYS_DIR/${CIRCUIT_NAME}.zkey
rm $KEYS_DIR/${CIRCUIT_NAME}_0000.zkey

# Generate Solidity verifier (for reference)
echo "   Generating Solidity verifier..."
snarkjs zkey export solidityverifier \
    $KEYS_DIR/${CIRCUIT_NAME}.zkey \
    $KEYS_DIR/Verifier.sol

echo ""
echo "✅ Trusted setup complete!"
echo ""
echo "📁 Generated files:"
echo "   - $KEYS_DIR/$CIRCUIT_NAME.zkey (proving key)"
echo "   - $KEYS_DIR/$CIRCUIT_NAME.vkey.json (verification key)"
echo "   - $KEYS_DIR/Verifier.sol (Solidity verifier)"
echo "   - build/$CIRCUIT_NAME.wasm (circuit WASM)"
echo ""
echo "⚠️  NOTE: This is a development setup!"
echo "   For production, run a proper MPC ceremony with multiple contributors."
