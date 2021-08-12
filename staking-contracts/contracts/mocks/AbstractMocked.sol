// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Staking.sol";

abstract contract AbstractMocked {
    uint256 public mockedTimestamp;

    function increaseTime(uint256 count) public {
        mockedTimestamp += count;
    }
}
