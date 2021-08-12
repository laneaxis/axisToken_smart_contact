// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockedToken is ERC20 {
    constructor() public ERC20("Mocked Lockup Token", "MLT") {
        _mint(msg.sender, 1e36);
    }

    function mint(address account, uint256 amount) external returns (bool success) {
        _mint(account, amount);
        return true;
    }
}
