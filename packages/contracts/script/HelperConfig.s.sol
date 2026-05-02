// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";

contract HelperConfig is Script {
    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/
    struct NetworkConfig {
        address implementation;
        address intentRegistry;
        address complianceRegistry;
        address owner;
        address entryPoint;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    NetworkConfig public localNetwork;
    uint256 constant ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;
    uint256 constant LOCAL_CHAIN_ID = 31337;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error HelperConfig__UnsupportedNetwork();

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getConfig() external returns (NetworkConfig memory) {
        return getConfigByChainId(block.chainid);
    }

    function getConfigByChainId(uint256 chainId) public returns (NetworkConfig memory) {
        if (chainId == LOCAL_CHAIN_ID) {
            return getAnvilEthConfig();
        } else if (chainId == ETHEREUM_SEPOLIA_CHAIN_ID) {
            return getEthereumSepoliaConfig();
        } else {
            revert HelperConfig__UnsupportedNetwork();
        }
    }

    function getEthereumSepoliaConfig() public view returns (NetworkConfig memory) {
        return NetworkConfig({
            implementation: vm.envOr("SEPOLIA_SMART_WALLET_IMPLEMENTATION", address(0)),
            intentRegistry: vm.envOr("SEPOLIA_INTENT_REGISTRY", address(0)),
            complianceRegistry: vm.envOr("SEPOLIA_COMPLIANCE_REGISTRY", address(0)),
            owner: vm.envOr("SEPOLIA_OWNER", msg.sender),
            entryPoint: 0x0000000071727De22E5E9d8BAf0edAc6f37da032
        });
    }

    function getAnvilEthConfig() public returns (NetworkConfig memory) {
        if (localNetwork.owner != address(0)) {
            return localNetwork;
        }

        localNetwork = NetworkConfig({
            implementation: address(0), 
            intentRegistry: address(0), 
            complianceRegistry: address(0),
            owner: msg.sender,
            entryPoint: 0x0000000071727De22E5E9d8BAf0edAc6f37da032
        });

        return localNetwork;
    }
}
