//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Faucet {
    address payable public owner;
    constructor () payable {
        owner = payable(msg.sender);
    }

    function withdraw(uint _amount) public payable {
        require(_amount <= .1 ether, "You can only withdraw <= .1 ETH at a time");
        (bool sent, ) = payable(msg.sender).call{value: _amount}("");
        require(sent, "Failed to send Ether");
    }

    function withdrawAll() onlyOwner public {
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }   

    function destroyFaucet() onlyOwner public {
        selfdestruct(payable(msg.sender));
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
}