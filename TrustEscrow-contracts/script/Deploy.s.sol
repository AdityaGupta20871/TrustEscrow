// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TrustEscrowFactory.sol";
import "../src/Arbitration.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Arbitration with 0.5 ETH min stake
        Arbitration arbitration = new Arbitration(0.5 ether);
        
        // Deploy Factory
        TrustEscrowFactory factory = new TrustEscrowFactory();
        
        vm.stopBroadcast();
        
        // Output the contract addresses - these will be needed for the frontend
        console.log("Arbitration deployed at:", address(arbitration));
        console.log("TrustEscrowFactory deployed at:", address(factory));
    }
}
