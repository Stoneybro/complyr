// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice A simple ERC-20 token for hackathon testing and demo purposes.
 */
contract MockUSDC is ERC20, Ownable {
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // Mint 1 million to the deployer initially
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev USDC usually has 6 decimals on most chains.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
