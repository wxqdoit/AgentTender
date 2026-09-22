// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AgentTender} from "../src/AgentTender.sol";

contract DeployOfficialScript is Script {
    function run() external returns (address tenderAddress) {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        address officialUsdc = 0x3600000000000000000000000000000000000000;

        vm.startBroadcast(deployerPrivateKey);

        AgentTender tender = new AgentTender(officialUsdc);
        tenderAddress = address(tender);
        console.log("Deployed AgentTender with Official Arc USDC at:", tenderAddress);

        vm.stopBroadcast();
    }
}
