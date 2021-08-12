// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface ISUSDC is IERC20 {
    function mint(address account, uint256 amount) external returns (bool success);
    function burnFrom(address account, uint256 amount) external;
}
