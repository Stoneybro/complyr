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
        address verifyingSigner;
        address entryPoint;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    NetworkConfig public localNetwork;
    uint256 constant HASHKEY_TESTNET_CHAIN_ID = 133;
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
        } else if (chainId == HASHKEY_TESTNET_CHAIN_ID) {
            return getHashkeyTestnetConfig();
        } else {
            revert HelperConfig__UnsupportedNetwork();
        }
    }

    function getHashkeyTestnetConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            implementation: 0x5D16F29E70e90ac48C7F4fb2c1145911a774eFbF,
            intentRegistry: 0x6A0C73162c20Bc56212D643112c339f654C45198,
            complianceRegistry: 0x6c6b5c86752D8B5330Cb055A967E2f6253D09195,
            owner: 0x0D96081998fd583334fd1757645B40fdD989B267,
            verifyingSigner: 0xb1640Df792f8549e545023c3f298E7af90532642,
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
            verifyingSigner: msg.sender,
            entryPoint: 0x0000000071727De22E5E9d8BAf0edAc6f37da032
        });

        return localNetwork;
    }
}
