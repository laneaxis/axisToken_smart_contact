// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MockedUSDC is ERC20 {
    constructor() public ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1e36);
        _setupDecimals(2);
    }

    function mint(address account, uint256 amount) external returns (bool success) {
        _mint(account, amount);
        return true;
    }
}
