// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Lockup.sol";

contract MockedLockup is Lockup {
    uint256 public mockedTimestamp;

    function getTimestamp() internal override(Lockup) view returns (uint256) {
        return mockedTimestamp;
    }

    constructor(
        address owner_,
        IERC20 token_,
        uint256 lockupDuration_,
        uint256 unlockDuration_,
        uint256 intervalUnlockDuration_
    ) public Lockup(owner_, token_, lockupDuration_, unlockDuration_, intervalUnlockDuration_) {
        mockedTimestamp = block.timestamp;
    }

    function increaseTime(uint256 count) public {
        mockedTimestamp += count;
    }
}