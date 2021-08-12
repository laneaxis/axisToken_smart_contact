// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AbstractMocked.sol";
import "../StakingMonthly.sol";

contract MockedStakingMonthly is StakingMonthly, AbstractMocked {

    function getTimestamp() internal override(StakingMonthly) view returns (uint256) {
        return mockedTimestamp;
    }

    constructor(
        address owner_,
        IERC20 stakingToken_,
        uint256 revenue_,
        uint256 intervalDuration_
    ) public StakingMonthly(owner_, stakingToken_, revenue_, intervalDuration_) {
        mockedTimestamp = block.timestamp;
    }
}
