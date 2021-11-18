import { useEffect, useState } from 'react';
import Web3 from 'web3';
import TokenContract from '../contracts/build/Token.json';
import EthSwapContract from '../contracts/build/EthSwap.json';

const initAlert = {
  message: '',
  color: '',
  dismissable: false,
};

export default function Home() {
  const [account, setAccount] = useState({
    address: '0x00',
    eth: 0,
    kit: 0,
  });
  const [option, setOption] = useState('Buy');
  const [isSelling, setIsSelling] = useState(0);
  const [token, setToken] = useState();
  const [ethswap, setEthswap] = useState();
  const [amount, setAmount] = useState(0);

  const [contractsLoaded, setContractsLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(initAlert);

  useEffect(() => {
    resetUI();
    window.ethereum.on('accountsChanged', resetUI);
    window.ethereum.on('chainChanged', resetUI);
  }, []);

  useEffect(() => {
    alert.dismissable && setTimeout(() => setAlert(initAlert), 5000);
  }, [alert]);

  const resetUI = () => {
    setLoading(true);
    setAmount(0);
    setIsSelling(0);
    setToken();
    setEthswap();
    setOption('Buy');
    setAlert(initAlert);
    setContractsLoaded(false);
    loadWeb3().then(loadBlockchainData).then(setLoading);
  };

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      setAlert({
        color: 'red',
        message: 'Non-Etherium browser detected. Try MetaMask',
        dismissable: false,
      });
    }
  };

  const loadBlockchainData = async () => {
    // Load web3
    const web3 = window.web3;
    if (!web3) return;
    // Data vars
    let address, eth, kit;
    // Get account
    const accounts = await web3.eth.getAccounts();
    address = accounts[0];
    // Get the network ID
    const netId = await web3.eth.net.getId();
    // Get ether balance for address
    const ethb = await web3.eth.getBalance(address);
    eth = web3.utils.fromWei(ethb.toString());
    // Load token contract
    const tokenData = TokenContract.networks[netId];
    if (tokenData) {
      const tokenContract = new web3.eth.Contract(
        TokenContract.abi,
        tokenData.address
      );
      setToken(tokenContract);
      // Get kits owned by user
      const kitb = await tokenContract.methods.balanceOf(accounts[0]).call();
      kit = web3.utils.fromWei(kitb.toString());
    }
    // Load ethswap contract
    const ethswapData = EthSwapContract.networks[netId];
    if (ethswapData) {
      const ethswapContract = new web3.eth.Contract(
        EthSwapContract.abi,
        ethswapData.address
      );
      setEthswap(ethswapContract);
    }
    // If tokens are not deployed, then show error
    if (!tokenData || !ethswapData) {
      setAlert({
        color: 'red',
        message:
          'Contracts not deployed to this network. Switch to Ropsten Network.',
        dismissable: false,
      });
    }
    if (tokenData && ethswapData) {
      setContractsLoaded(true);
    }

    setAccount({ address, eth, kit });
  };

  const _checkLoaded = () => {
    if (!contractsLoaded) {
      setAlert({
        color: 'red',
        message:
          'Contracts not deployed to this network. Switch to Ropsten Network.',
        dismissable: false,
      });
      return false;
    }
    if (alert.message) return false;
    return true;
  };

  const handleBuyTokens = async () => {
    const amountInWei = web3.utils.toWei(amount);
    await ethswap.methods
      .buyTokens()
      .send({ value: amountInWei, from: account.address });
    setAlert({
      color: 'green',
      message: 'Purchase successful',
      dismissable: true,
    });
  };

  const handleSellTokens = async () => {
    const amountInWei = web3.utils.toWei(amount);
    // Approve contract to sell for buyer
    await token.methods
      .approve(ethswap._address, amountInWei)
      .send({ from: account.address });
    // Sell the tokens
    await ethswap.methods
      .sellTokens(amountInWei)
      .send({ from: account.address });
    setAlert({
      color: 'green',
      message: 'Sale successful',
      dismissable: true,
    });
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      if (!_checkLoaded()) return;
      isSelling ? await handleSellTokens() : await handleBuyTokens();
      resetUI();
    } catch (error) {
      setAlert({
        color: 'red',
        message: error.message,
        dismissable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='px-12 py-2'>
      <p className='bg-red-500'></p>
      <p className='bg-green-500'></p>
      {loading ? (
        <p className='bg-yellow-500 text-white p-1 text-sm text-center'>
          Loading...
        </p>
      ) : null}
      {alert.message ? (
        <div
          className={`bg-${alert.color}-500 text-white text-center text-sm p-1`}
        >
          {alert.message}
        </div>
      ) : null}
      {/* Header */}
      <header className='py-3 flex justify-between'>
        <p className='text-2xl font-medium'>
          <span className='text-pink-500 font-black'>KIT</span>
          <span className='text-gray-400'> Swap</span>
        </p>
        <div className='text-right text-sm'>
          <p className='font-semibold'>Your Account Address</p>
          <p className='font-medium opacity-50'>{account.address}</p>
        </div>
      </header>
      {/* Main */}
      <main className='pb-6'>
        <div className='grid grid-cols-2 gap-4'>
          {/* Hero Section */}
          <div className='mt-20'>
            <h1 className='text-4xl text-gray-800 font-black mx-2'>
              {isSelling ? 'Sell your' : 'Exchange your Ether for'}
            </h1>
            <h1 className='text-7xl text-pink-500 font-black mt-2 mb-8'>
              Cute KITty Coins
            </h1>
            <p className='text-2xl font-semibold text-gray-600 mx-2 mb-1'>
              Your KIT Balance: {account.kit}
            </p>
            <p className='text-gray-400 mx-3 text-sm'>
              {isSelling ? 'Get 1 ETH for 100 KITs' : 'Get 100 KITs for 1 ETH'}
            </p>
          </div>
          {/* Exchange table */}
          <div className='mt-8 ml-20'>
            <ul className='flex justify-center'>
              {['Buy', 'Sell'].map((op, i) => (
                <li
                  key={op}
                  className={`cursor-pointer mx-4 pl-2 pr-3 py-3 mb-5  ${
                    option === op
                      ? 'text-pink-500 font-medium border-b-2 border-pink-500'
                      : 'text-gray-500'
                  }`}
                  onClick={() => {
                    setOption(op);
                    setIsSelling(i);
                  }}
                >
                  {op}
                </li>
              ))}
            </ul>
            <div className='border p-5 rounded-lg hover:shadow-2xl focus-within:shadow-2xl'>
              <div className='mb-6'>
                <p className='flex justify-between text-xs'>
                  <label htmlFor='' className='font-semibold'>
                    Enter {isSelling ? 'KIT' : 'ETH'}
                  </label>
                  <span htmlFor=''>
                    Balance:{' '}
                    {isSelling ? `${account.kit} KIT` : `${account.eth} ETH`}
                  </span>
                </p>
                <div className='border flex mt-1 rounded overflow-hidden  focus-within:border-pink-500'>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type='number'
                    min='1'
                    className='border-none outline-none flex-1 w-auto p-4'
                    disabled={loading}
                  />
                  <span className='bg-gray-200 p-4'>
                    {isSelling ? 'KIT' : 'ETH'}
                  </span>
                </div>
              </div>

              <div className='mb-6'>
                <p className='flex justify-between text-xs'>
                  <label htmlFor='' className='font-semibold'>
                    {isSelling ? 'ETH' : 'KIT'} you'll get
                  </label>
                  <span htmlFor=''>
                    Balance:{' '}
                    {isSelling ? `${account.eth} ETH` : `${account.kit} KIT`}
                  </span>
                </p>
                <div className='border flex mt-1 rounded'>
                  <p className='border-none outline-none flex-1 w-auto p-4 bg-gray-100'>
                    {isSelling ? amount / 100 : amount * 100}
                  </p>
                  <span className='bg-gray-200 p-4'>
                    {isSelling ? 'ETH' : 'KIT'}
                  </span>
                </div>
                <div htmlFor='' className='flex justify-between text-xs mt-2'>
                  <span>Exchange Rate</span>
                  <span>
                    {isSelling ? '100 KIT = 1 ETH' : '1 ETH = 100 KIT'}
                  </span>
                </div>
              </div>

              <button
                className='bg-pink-500 font-bold text-white text-center w-full p-4 rounded disabled:opacity-50 disabled:cursor-not-allowed active:bg-pink-600'
                disabled={loading}
                onClick={handleClick}
              >
                {isSelling ? 'Sell' : 'Buy'} KITties
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
