const Token = artifacts.require('Token');
const EthSwap = artifacts.require('EthSwap');

require('chai').use(require('chai-as-promised')).should();

// const tokens = (tk) => tk + '0'.repeat(18);
const tokens = (tk) => web3.utils.toWei(tk, 'ether');

contract('EthSwap', ([deployer, buyer]) => {
  let token, ethSwap;

  before(async () => {
    token = await Token.new();
    ethSwap = await EthSwap.new(token.address);
    await token.transfer(ethSwap.address, tokens('1000000'));
  });

  describe('EthSwap deployment', async () => {
    it('has a name', async () => {
      assert.equal(await ethSwap.name(), 'EthSwap Instant Exchange');
    });
  });

  describe('Joy Token deployment', async () => {
    it('has a name', async () => {
      assert.equal(await token.name(), 'Joy Token');
    });
  });

  describe('EthSwap contract has tokens', async () => {
    it('has a balance of 1M JOY tokens', async () => {
      const balance = await token.balanceOf(ethSwap.address);
      assert.equal(balance.toString(), tokens('1000000'));
    });
  });

  describe('buyTokens()', () => {
    let result;

    before(async () => {
      result = await ethSwap.buyTokens({ from: buyer, value: tokens('1') });
    });

    it('allows buyer to purchase tokens from ethSwap for a fixed price', async () => {
      const buyerBalance = await token.balanceOf(buyer);
      assert.equal(buyerBalance.toString(), tokens('100'));

      let ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens('999900'));

      ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens('1'));

      const event = result.logs[0].args;
      assert.equal(event.account, buyer);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens('100'));
      assert.equal(event.rate.toString(), '100');
    });
  });

  describe('sellTokens()', () => {
    let result;

    before(async () => {
      await token.approve(ethSwap.address, tokens('100'), { from: buyer });
      result = await ethSwap.sellTokens(tokens('100'), { from: buyer });
    });

    it('allows buyer to sell tokens to ethSwap for a fixed price', async () => {
      const buyerBalance = await token.balanceOf(buyer);
      assert.equal(buyerBalance.toString(), tokens('0'));

      let ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens('1000000'));

      ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens('0'));

      const event = result.logs[0].args;
      assert.equal(event.account, buyer);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens('100'));
      assert.equal(event.rate.toString(), '100');
    });
  });
});
