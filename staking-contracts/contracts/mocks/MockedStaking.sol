// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Staking.sol";

contract MockedStaking is Staking {
    uint256 public mockedTimestamp;

    function getTimestamp() internal override(Staking) view returns (uint256) {
        return mockedTimestamp;
    }

    constructor(
        address owner_,
        IERC20 stakingToken_,
        uint256 revenue_,
        uint256 intervalsCount_,
        uint256 intervalDuration_,
        uint256 size_
    ) public Staking(owner_, stakingToken_, revenue_, intervalsCount_, intervalDuration_, size_) {
        mockedTimestamp = block.timestamp;
    }

    function increaseTime(uint256 count) public {
        mockedTimestamp += count;
    }
}
