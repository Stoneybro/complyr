// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {Script} from "forge-std/Script.sol";

contract HelperConfig is Script {
    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/
    struct NetworkConfig {
        address implementation;
        address registry;
        address complianceBridge;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    NetworkConfig public localNetwork;
    uint256 constant FLOW_CHAIN_ID = 545;
    uint256 constant LOCAL_CHAIN_ID = 31337;
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error HelperConfig__UnsupportedNetwork();

    /*CONSTRUCTOR*/

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getConfig() external returns (NetworkConfig memory) {
        return getConfigByChainId(block.chainid);
    }

    function getConfigByChainId(uint256 chainId) public returns (NetworkConfig memory) {
        if (chainId == LOCAL_CHAIN_ID) {
            return getAnvilEthConfig();
        } else if (chainId == FLOW_CHAIN_ID) {
            return getFlowEthConfig();
        } else {
            revert HelperConfig__UnsupportedNetwork();
        }
    }

    function getFlowEthConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            implementation: 0xd63E841AAb10D118a3cb541FbeF011eBae6437C6,
            registry: 0x37c5c677146A19e61295E40F0518bAf3f94305fE,
            complianceBridge: address(0) // Default to 0, update when deployed
        });
    }

    function getAnvilEthConfig() public returns (NetworkConfig memory) {
        if (localNetwork.implementation != address(0)) {
            return localNetwork;
        }

        localNetwork = NetworkConfig({implementation: address(0), registry: address(0), complianceBridge: address(0)});

        return localNetwork;
    }
}
