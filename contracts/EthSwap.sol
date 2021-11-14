// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import './Token.sol';

contract EthSwap {
    string public name = "EthSwap Instant Exchange";
    uint public rate = 100;
    Token public token;

    constructor(Token _token) {
        token = _token;
    }

    event TokensPurchased(address account, address token, uint amount, uint rate);
    event TokensSold(address account, address token, uint amount, uint rate);

    function buyTokens() public payable {
        // Determine the amount of tokens buyer will be getting
        uint256 tokenAmount = msg.value * rate;
        // Require that much tokens to be available in the contract
        require(token.balanceOf(address(this)) >= tokenAmount, "Not much tokens available");
        // Transfer the tokens to buyer
        token.transfer(msg.sender, tokenAmount);
        // Emit the event
        emit TokensPurchased(msg.sender, address(token), tokenAmount, rate);
    }

    function sellTokens(uint _amount) public {
        // Get the Ether buyer will get for selling the contract tokens
        uint etherAmount = _amount / rate;
        // Check the ether balance of contract
        require(address(this).balance >= etherAmount,"Not enough Ether at current moment, please try after some time");
        // Require that tokens being sold are correct
        require(_amount <= token.balanceOf(msg.sender), "Redeeming invalid amount of tokens");
        // Transfer tokens back to contract
        token.transferFrom(msg.sender, address(this), _amount);
        // Transfer Ether back to buyer
        payable(msg.sender).transfer(etherAmount);
        // Emit the event
        emit TokensPurchased(msg.sender, address(token), _amount, rate);
    }
}