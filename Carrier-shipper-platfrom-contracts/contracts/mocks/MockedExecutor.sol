// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "../Executor.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IQuoter.sol";
import "../interfaces/ISwapRouter.sol";

contract MockedExecutor is Executor {
    uint256 public RATE = 1;

    constructor(
        address[] memory owners_,
        address axisToken_,
        address sUsdcToken_,
        address usdcToken_,
        uint256 sUSDCPerLoad_
    ) public Executor(owners_, axisToken_, sUsdcToken_, usdcToken_, address(0), address(0), sUSDCPerLoad_) {
    }

    function _swapInput(
        address tokenIn,
        address tokenOut,
        uint24 fee1,
        address recepient,
        uint256 deadline,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint160 sqrtPriceLimitX96
    ) internal override returns (uint256) {
        fee1; recepient; deadline; amountOutMinimum; sqrtPriceLimitX96;
        // TODO: use safe math
        uint256 amountOut = priceInput(tokenIn, tokenOut, fee1, amountIn, sqrtPriceLimitX96);
        require(IERC20(tokenIn).balanceOf(address(this)) >= amountIn, "not enough token in");
        require(IERC20(tokenOut).balanceOf(address(this)) >= amountOut, "not enough token out");
        IERC20(tokenOut).transfer(recepient, amountOut);
        return amountOut;
    }

    function _swapOutput(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        address recepient,
        uint256 deadline,
        uint256 amountOut,
        uint256 amountInMaximum,
        uint160 sqrtPriceLimitX96
    ) internal override returns (uint256) {
        fee; recepient; deadline; amountInMaximum; sqrtPriceLimitX96;
        uint256 amountIn = priceOutput(tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96);
        require(IERC20(tokenIn).balanceOf(address(this)) >= amountIn, "not enough token in");
        require(IERC20(tokenOut).balanceOf(address(this)) >= amountOut, "not enough token out");
        IERC20(tokenOut).transfer(recepient, amountOut);
        return amountIn;
    }

}
