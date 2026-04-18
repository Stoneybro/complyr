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
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;
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
        } else if (chainId == BASE_SEPOLIA_CHAIN_ID) {
            return getBaseSepoliaConfig();
        } else {
            revert HelperConfig__UnsupportedNetwork();
        }
    }

    function getBaseSepoliaConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            implementation: 0x64747D9b1EF8335535bD62CDaA0EA8017EAB4927,
            intentRegistry: 0x10299A9d969FB345cff44E5680D5FeD232dF6D2c,
            complianceRegistry: 0xddFFC6d14C304079F29c7F3B1ceCbCa1A591A59A,
            owner: 0x0D96081998fd583334fd1757645B40fdD989B267,
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
