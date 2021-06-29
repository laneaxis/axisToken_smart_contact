// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "solowei/contracts/AttoDecimal.sol";
import "./Controller.sol";

contract Order {
    using SafeMath for uint256;
    // using SafeERC20 for IERC20;
    using AttoDecimal for AttoDecimal.Instance;

    event OrderDistributed(
        uint256 indexed id,
        address indexed shipper,
        address indexed carrier,
        uint256 shipperAmount,
        uint256 carrierAmount,
        uint256 paymentFeeAmount,
        uint256 feeAmount
    );

    constructor(
        uint256 id,
        address shipper,
        address carrier,
        Controller controller,
        AttoDecimal.Instance memory fee
    ) public {
        (IERC20 feeToken, IERC20 paymentToken, AttoDecimal.Instance memory shipperDistribution) = _getControllerData(
            controller
        );
        (uint256 feeBalance, uint256 paymentBalance, uint256 paymentfeeAmount) = _distributeFees(
            address(controller),
            feeToken,
            paymentToken,
            fee
        );
        uint256 participantsAmount = paymentBalance.sub(paymentfeeAmount);
        uint256 shipperAmount = shipperDistribution.mul(participantsAmount).round();
        uint256 carrierAmount = participantsAmount.sub(shipperAmount);
        emit OrderDistributed(id, shipper, carrier, shipperAmount, carrierAmount, paymentfeeAmount, feeBalance);
        // paymentToken.safeTransfer(shipper, shipperAmount);
        paymentToken.transfer(shipper, shipperAmount);
        // paymentToken.safeTransfer(carrier, carrierAmount);
        paymentToken.transfer(carrier, carrierAmount);
    }

    function _getBalances(IERC20 feeToken, IERC20 paymentToken)
        private
        view
        returns (uint256 feeBalance, uint256 paymentBalance)
    {
        address current = address(this);
        feeBalance = feeToken.balanceOf(current);
        paymentBalance = paymentToken.balanceOf(current);
    }

    function _getControllerData(Controller controller)
        private
        view
        returns (
            IERC20 feeToken,
            IERC20 paymentToken,
            AttoDecimal.Instance memory shipperDistribution
        )
    {
        feeToken = IERC20(controller.feeToken());
        paymentToken = IERC20(controller.paymentToken());
        shipperDistribution = controller.shipperDistribution(address(this));
    }

    function _distributeFees(
        address controller,
        IERC20 feeToken,
        IERC20 paymentToken,
        AttoDecimal.Instance memory fee
    )
        private
        returns (
            uint256 feeBalance,
            uint256 paymentBalance,
            uint256 paymentfeeAmount
        )
    {
        (feeBalance, paymentBalance) = _getBalances(feeToken, paymentToken);
        paymentfeeAmount = fee.mul(paymentBalance).ceil();
        // feeToken.safeTransfer(controller, feeBalance);
        feeToken.transfer(controller, feeBalance);
        // paymentToken.safeTransfer(controller, paymentfeeAmount);
        paymentToken.transfer(controller, paymentfeeAmount);
    }
}
