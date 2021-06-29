// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "openzeppelin-solidity/contracts/utils/EnumerableSet.sol";

abstract contract MultiOwnable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _owners;

    function owners() public view returns (address[] memory owners_) {
        uint256 ownersCount = _owners.length();
        owners_ = new address[](ownersCount);
        for (uint256 i = 0; i < ownersCount; i++) {
            owners_[i] = _owners.at(i);
        }
    }

    function ownersCount() public view returns (uint256) {
        return _owners.length();
    }

    event OwnerAdded(address newOwner);
    event OwnerRemoved(address previousOwner);

    constructor(address[] memory owners_) internal {
        require(owners_.length > 0, "Owners array is empty");
        for (uint256 i = 0; i < owners_.length; i++) {
            _addOwner(owners_[i]);
        }
    }

    function addOwners(address[] memory newOwners) external onlyOwner returns (bool success) {
        for (uint256 i = 0; i < newOwners.length; i++) {
            _addOwner(newOwners[i]);
        }
        return true;
    }

    function removeOwners(address[] memory previousOwners) external onlyOwner returns (bool success) {
        for (uint256 i = 0; i < previousOwners.length; i++) {
            _removeOwner(previousOwners[i]);
        }
        require(_owners.length() > 0, "Must be at least one owner");
        return true;
    }

    function _addOwner(address newOwner) internal {
        if (_owners.add(newOwner)) emit OwnerAdded(newOwner);
    }

    function _removeOwner(address previousOwner) internal {
        if (_owners.remove(previousOwner)) emit OwnerRemoved(previousOwner);
    }

    modifier onlyOwner {
        require(_owners.contains(msg.sender), "Not owner");
        _;
    }
}
