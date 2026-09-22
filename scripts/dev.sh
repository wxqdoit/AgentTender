#!/usr/bin/env bash
set -e

echo "=== Starting AgentTender Full Stack Development Environment ==="

# 1. Start Anvil in background if not running
if ! lsof -i:8545 > /dev/null 2>&1; then
  echo "Starting local Anvil node on port 8545..."
  anvil --port 8545 --chain-id 31337 --block-time 1 > /dev/null 2>&1 &
  sleep 2
fi

# 2. Deploy contracts
echo "Deploying contracts..."
cd contracts
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast > /dev/null
cd ..

# 3. Export ABIs
python3 -c "
import json, os
os.makedirs('contracts/abi', exist_ok=True)
os.makedirs('backend/src/abi', exist_ok=True)
os.makedirs('frontend/src/abi', exist_ok=True)
with open('contracts/out/AgentTender.sol/AgentTender.json') as f:
    t = json.load(f)['abi']
with open('contracts/out/MockUSDC.sol/MockUSDC.json') as f:
    u = json.load(f)['abi']
for p in ['contracts/abi', 'backend/src/abi', 'frontend/src/abi']:
    with open(f'{p}/AgentTender.json', 'w') as f: json.dump(t, f, indent=2)
    with open(f'{p}/MockUSDC.json', 'w') as f: json.dump(u, f, indent=2)
"

echo "Environment ready! You can now start backend and frontend:"
echo "  pnpm dev:backend   (in terminal 1)"
echo "  pnpm dev:frontend  (in terminal 2)"
