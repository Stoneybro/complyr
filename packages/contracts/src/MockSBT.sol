// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockSBT is Ownable {
    mapping(address => bool) private _isHuman;
    mapping(address => string) private _ensNames;
    mapping(address => uint8) private _levels;
    mapping(address => uint256) private _createTimes;

    event Verified(address indexed account, string ensName, uint8 level);

    constructor() Ownable(msg.sender) {}

    function setVerified(address account, string calldata ensName, uint8 level, bool status) external onlyOwner {
        _isHuman[account] = status;
        _ensNames[account] = ensName;
        _levels[account] = level;
        if (status && _createTimes[account] == 0) {
            _createTimes[account] = block.timestamp;
        }
        emit Verified(account, ensName, level);
    }

    function isHuman(address account) external view returns (bool, uint8) {
        return (_isHuman[account], _levels[account]);
    }

    function getKycInfo(address account) external view returns (string memory, uint8, uint8, uint256) {
        uint8 status = _isHuman[account] ? 1 : 0;
        return (_ensNames[account], _levels[account], status, _createTimes[account]);
    }
}
