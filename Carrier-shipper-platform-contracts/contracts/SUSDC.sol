// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract SUSDC is ERC20, ERC20Burnable, Ownable {
    constructor() public ERC20("Synthetic USDC", "sUSDC") {
        _setupDecimals(2);
    }

    function mint(address account, uint256 amount) external onlyOwner returns (bool success) {
        _mint(account, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return spender == super.owner() ? uint256(-1) : super.allowance(owner, spender);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), allowance(sender, _msgSender()).sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }

}
