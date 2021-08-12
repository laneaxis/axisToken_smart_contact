// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "solowei/contracts/AttoDecimal.sol";
import "./MultiOwnable.sol";
import "./Order.sol";

contract Controller is MultiOwnable, ReentrancyGuard {
    using SafeMath for uint256;
    /* openzeppelin/Address.sol
        ParserError: OVM: SELFBALANCE is not implemented in the OVM. (We have no native ETH -- use deposited WETH instead!)
            require(address(this).balance >= value, "Address: insufficient balance for call");
    */
    // using SafeERC20 for IERC20;
    using AttoDecimal for AttoDecimal.Instance;

    struct OrderData {
        bool locked;
        AttoDecimal.Instance shipperDistribution;
    }

    IERC20 private _feeToken;
    IERC20 private _paymentToken;
    AttoDecimal.Instance private _fee;
    mapping(address => OrderData) private _ordersData;

    function feeToken() public view returns (IERC20) {
        return _feeToken;
    }

    function feeTokenBalance() public view returns (uint256) {
        return _feeToken.balanceOf(address(this));
    }

    function paymentToken() public view returns (IERC20) {
        return _paymentToken;
    }

    function paymentTokenBalance() public view returns (uint256) {
        return _paymentToken.balanceOf(address(this));
    }

    function computeOrderAddress(
        bytes32 salt,
        uint256 id,
        address shipper,
        address carrier,
        AttoDecimal.Instance memory fee_
    ) public view returns (address) {
        _assertPercentIsValid(fee_);
        bytes memory bytecode = _getOrderBytecode(id, shipper, carrier, fee_);
        bytes32 _data = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode)));
        return address(uint160(uint256(_data)));
    }

    function fee() public view returns (AttoDecimal.Instance memory) {
        return _fee;
    }

    function locked(address order) public view returns (bool) {
        return _ordersData[order].locked;
    }

    function shipperDistribution(address order) public view returns (AttoDecimal.Instance memory) {
        return _ordersData[order].shipperDistribution;
    }

    event OrderCreated(uint256 id, address indexed shipper, address indexed carrier, address indexed order);
    event OrderLocked(address indexed order);
    event OrderUnlocked(address indexed order, AttoDecimal.Instance penalty);
    event FeeUpdated(AttoDecimal.Instance fee);
    event FeeWithdrawed(address indexed token, address indexed owner, address indexed to, uint256 amount);

    constructor(
        address[] memory owners_,
        address feeToken_,
        address paymentToken_,
        AttoDecimal.Instance memory fee_
    ) public MultiOwnable(owners_) {
        _feeToken = IERC20(feeToken_);
        _paymentToken = IERC20(paymentToken_);
        _setFee(fee_);
    }

    function createOrder(
        bytes32 salt,
        uint256 id,
        address shipper,
        address carrier,
        AttoDecimal.Instance memory fee_
    ) external onlyOwner nonReentrant returns (address addr) {
        require(!_ordersData[computeOrderAddress(salt, id, shipper, carrier, fee_)].locked, "Order locked");
        addr = _createOrder(salt, id, shipper, carrier, fee_);
    }

    function lock(address order) external onlyOwner returns (bool success) {
        _assertOrderAddressIsValid(order);
        bool notLocked = !_ordersData[order].locked;
        if (notLocked) {
            _ordersData[order].locked = notLocked;
            emit OrderLocked(order);
        }
        return true;
    }

    function unlock(
        address order,
        AttoDecimal.Instance memory penalty,
        bytes32 salt,
        uint256 id,
        address shipper,
        address carrier,
        AttoDecimal.Instance memory fee_
    ) external onlyOwner nonReentrant returns (address addr) {
        _assertOrderAddressIsValid(order);
        _assertPercentIsValid(penalty);
        OrderData storage orderData = _ordersData[order];
        require(orderData.locked, "Order not locked");
        orderData.locked = false;
        orderData.shipperDistribution = penalty;
        emit OrderUnlocked(order, penalty);
        addr = _createOrder(salt, id, shipper, carrier, fee_);
        require(order == addr, "Invalid order address");
    }

    function updateFee(AttoDecimal.Instance memory fee_) external onlyOwner returns (bool success) {
        _setFee(fee_);
        return true;
    }

    function withdrawFeeTokenFees(address to, uint256 amount)
        external
        onlyOwner
        onlyPositiveAmount(amount)
        returns (bool success)
    {
        require(amount <= feeTokenBalance(), "No enough fees");
        _withdrawFees(_feeToken, msg.sender, to, amount);
        return true;
    }

    function withdrawPaymentTokenFees(address to, uint256 amount)
        external
        onlyOwner
        onlyPositiveAmount(amount)
        returns (bool success)
    {
        require(amount <= paymentTokenBalance(), "No enough fees");
        _withdrawFees(_paymentToken, msg.sender, to, amount);
        return true;
    }

    function _getOrderBytecode(
        uint256 id,
        address shipper,
        address carrier,
        AttoDecimal.Instance memory fee_
    ) internal view returns (bytes memory) {
        return
            abi.encodePacked(
                type(Order).creationCode, // contract creation bytecode
                abi.encode(id, shipper, carrier, address(this), fee_) // parameters bytecode
            );
    }

    function _assertOrderAddressIsValid(address order) private pure {
        require(order != address(0), "Order is zero address");
    }

    function _assertPercentIsValid(AttoDecimal.Instance memory percent) private pure {
        require(percent.lte(AttoDecimal.one()), "Invalid percent value");
    }

    function _createOrder(
        bytes32 salt,
        uint256 id,
        address shipper,
        address carrier,
        AttoDecimal.Instance memory fee_
    ) private returns (address addr) {
        _assertPercentIsValid(fee_);
        bytes memory bytecode = _getOrderBytecode(id, shipper, carrier, fee_);
        require(bytecode.length != 0, "Create2: bytecode length is zero");
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(addr != address(0), "Create2: Failed on deploy");
        emit OrderCreated(id, shipper, carrier, addr);
    }

    function _setFee(AttoDecimal.Instance memory fee_) private {
        _assertPercentIsValid(fee_);
        _fee = fee_;
        emit FeeUpdated(_fee);
    }

    function _withdrawFees(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) private {
        require(to != address(0), "To is zero address");
        emit FeeWithdrawed(address(token), from, to, amount);
        // token.safeTransfer(to, amount); // because of SafeERC20
        token.transfer(to, amount);
    }

    modifier onlyPositiveAmount(uint256 amount) {
        require(amount > 0, "Amount not positive");
        _;
    }
}
