// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "solowei/contracts/AttoDecimal.sol";
import "./interfaces/IQuoter.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/ISUSDC.sol";
import "./MultiOwnable.sol";

contract Executor is MultiOwnable {
    using AttoDecimal for AttoDecimal.Instance;
    using SafeMath for uint256;

    mapping(bytes16 => bool) private _payments;
    mapping(bytes16 => bool) private _payouts;
    uint256 private _sUSDCPerLoad = 100; // 1

    uint256 public payOrderFeeFixedInSusdc = 500; // including sUSDC decimals
    AttoDecimal.Instance public payOrderFeePercentInSusdc = AttoDecimal.Instance(10000000000000000); // 0.01
    AttoDecimal.Instance public buyLoadsFactor = AttoDecimal.Instance(1020000000000000000); // 1.02
    uint24 public swapFee = 3000;
    uint160 public swapSqrtPriceLimitX96 = 0;
    ISUSDC public _sUsdcToken; // not IERC20 because of mint
    IERC20 public _usdcToken;
    IERC20 public _axisToken;
    IERC20 public _ethToken = IERC20(0x4200000000000000000000000000000000000006);
    IQuoter public _uniswapQuoter;
    ISwapRouter public _uniswapRouter;

    event LoadsPurchased(address buyer, uint256 loadsAmount, uint256 sUsdcAmount);
    event LoadPriceUpdated(uint256 newValue);
    event payOrderFeeFixedInSusdcUpdated(uint256 newValue);
    event PayOrderFeePercentInSusdcUpdated(AttoDecimal.Instance newValue);

    function isPaymentHandled(bytes16 id) public view returns (bool) {
        return _payments[id];
    }

    function isPayoutHandled(bytes16 id) public view returns (bool) {
        return _payouts[id];
    }

    // Should be used as view, but cannot bc of uniswap
    function priceInput(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) public virtual returns (uint256) {
        return
            _uniswapQuoter.quoteExactInputSingle(
                tokenIn,
                tokenOut,
                fee,
                amountIn,
                sqrtPriceLimitX96
            );
    }

    // Should be used as view, but cannot bc of uniswap
    function priceOutput(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountOut,
        uint160 sqrtPriceLimitX96
    ) public virtual returns (uint256) {
        return
            _uniswapQuoter.quoteExactOutputSingle(
                tokenIn,
                tokenOut,
                fee,
                amountOut,
                sqrtPriceLimitX96
            );
    }

    constructor(
        address[] memory owners_,
        address axisToken_,
        address sUsdcToken_,
        address usdcToken_,
        address uniswapQuoter_,
        address uniswapRouter_
    ) public MultiOwnable(owners_) {
        _usdcToken = IERC20(usdcToken_);
        _sUsdcToken = ISUSDC(sUsdcToken_);
        _axisToken = IERC20(axisToken_);
        _uniswapQuoter = IQuoter(uniswapQuoter_);
        _uniswapRouter = ISwapRouter(uniswapRouter_);
    }

    function getLoadPrice() external view returns (uint256) {
        return _sUSDCPerLoad;
    }

    function handlePayment(
        bytes16 id,
        address account,
        uint256 amount
    ) external onlyOwner returns (bool) {
        require(_payments[id] == false, "payment already handlded");
        _sUsdcToken.mint(account, amount);
        _payments[id] = true;
    }

    function handlePayout(
        bytes16 id,
        address account,
        uint256 amount
    ) external onlyOwner returns (bool) {
        require(_payouts[id] == false, "payout already handlded");
        _sUsdcToken.burnFrom(account, amount);
        _payouts[id] = true;
    }

    function swapSUSDCToEth(
        address account,
        uint256 amountOut
    ) external onlyOwner returns (uint256) {
        uint256 amountIn = _swapOutput(
            address(_usdcToken),
            address(_ethToken),
            swapFee,
            account,
            block.timestamp + 1,
            amountOut,
            uint256(-1),
            swapSqrtPriceLimitX96
        );
        require(_sUsdcToken.balanceOf(account) >= amountIn, "swap: not enough sUSDC");
        require(_sUsdcToken.allowance(account, address(this)) >= amountIn, "swap: sUSDC allowance too low");
        require(_usdcToken.balanceOf(address(this)) >= amountIn, "swap: not enougn USDC");
        _sUsdcToken.burnFrom(account, amountIn);
        return amountIn;
    }

    function swapSUSDCToAXIS(
        address account,
        uint256 amountIn
    ) external onlyOwner returns (uint256) {
        require(_sUsdcToken.balanceOf(account) >= amountIn, "swap: not enough sUSDC");
        require(_sUsdcToken.allowance(account, address(this)) >= amountIn, "swap: sUSDC allowance too low");
        require(_usdcToken.balanceOf(address(this)) >= amountIn, "swap: not enougn USDC");
        _sUsdcToken.burnFrom(account, amountIn);
        return _swapInput(
            address(_usdcToken),
            address(_axisToken),
            swapFee,
            account,
            block.timestamp + 1,
            amountIn,
            0,
            swapSqrtPriceLimitX96
        );
    }

    function swapAXISToSUSDC(
        address account,
        uint256 amountIn
    ) public returns (uint256) {
        require(_axisToken.balanceOf(account) >= amountIn, "swap: not enough AXIS");
        require(_axisToken.allowance(account, address(this)) >= amountIn, "swap: AXIS allowance too low");
        _axisToken.transferFrom(account, address(this), amountIn);
        uint256 amountOut = _swapInput(
            address(_axisToken),
            address(_usdcToken),
            swapFee,
            address(this),
            block.timestamp + 1,
            amountIn,
            0,
            swapSqrtPriceLimitX96
        );
        _sUsdcToken.mint(account, amountOut);
        return amountOut;
    }

    function payOrder(
        address payer,
        address order,
        uint256 sUsdcAmount
    ) public returns (bool) {
        uint256 sUsdcSwapFeeAmount = payOrderFeeFixedInSusdc.add(payOrderFeeFixedInSusdc.mul(swapFee).div(1e5));
        uint256 sUsdcPercentFee = payOrderFeePercentInSusdc.mul(sUsdcAmount).ceil();

        uint256 totalSusdcAmount = sUsdcAmount.add(payOrderFeeFixedInSusdc).add(sUsdcPercentFee);
        require(_sUsdcToken.balanceOf(payer) >= totalSusdcAmount, "pay order: not enough sUSDC");

        _swapInput(
            address(_usdcToken),
            address(_axisToken),
            swapFee,
            order,
            block.timestamp + 1,
            sUsdcSwapFeeAmount,
            0,
            swapSqrtPriceLimitX96
        );

        _sUsdcToken.transferFrom(payer, order, sUsdcAmount);
        _sUsdcToken.burnFrom(payer, payOrderFeeFixedInSusdc.add(sUsdcPercentFee));
        return true;
    }

    function buyLoads(
        address account,
        uint256 loadsAmount
    ) external returns (bool) {
        uint256 sUsdcAmount = _sUSDCPerLoad.mul(loadsAmount);
        uint256 sUsdcAmountWithFee = buyLoadsFactor.mul(sUsdcAmount).ceil();
        uint256 balance = _sUsdcToken.balanceOf(account);

        require(sUsdcAmountWithFee <= balance, "not enough sUSDC");

        _sUsdcToken.burnFrom(account, sUsdcAmount);
        
        emit LoadsPurchased(account, loadsAmount, sUsdcAmount);
    }

    function setLoadPrice(uint256 newPrice) external onlyOwner {
        _sUSDCPerLoad = newPrice;
        emit LoadPriceUpdated(newPrice);
    }

    function setpayOrderFeeFixedInSusdc(uint256 newValue) external onlyOwner {
        payOrderFeeFixedInSusdc = newValue;
        emit payOrderFeeFixedInSusdcUpdated(newValue);
    }

    function setPayOrderFeePercentInSusdc(AttoDecimal.Instance memory newValue) external onlyOwner {
        payOrderFeePercentInSusdc = newValue;
        emit PayOrderFeePercentInSusdcUpdated(newValue);
    }

    function _swapInput(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        address recepient,
        uint256 deadline,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint160 sqrtPriceLimitX96
    ) internal virtual returns (uint256) {
        return _uniswapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: recepient,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            })
        );
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
    ) internal virtual returns (uint256) {
        return _uniswapRouter.exactOutputSingle(
            ISwapRouter.ExactOutputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: recepient,
                deadline: deadline,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            })
        );
    }

}
