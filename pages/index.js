import { useEffect, useState } from 'react';
import Web3 from 'web3';
import TokenContract from '../build/contracts/Token.json';
import EthSwapContract from '../build/contracts/EthSwap.json';

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
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState({
    message: '',
    color: '',
    dismissable: false,
  });

  useEffect(() => {
    loadWeb3().then(loadBlockchainData).then(setLoading);
  }, []);

  useEffect(() => {
    alert.dismissable &&
      setTimeout(
        () =>
          setAlert({
            message: '',
            color: '',
            dismissable: false,
          }),
        5000
      );
  }, [alert]);

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
    const web3 = window.web3;
    // Get account and its balance
    const accounts = await web3.eth.getAccounts();
    const eth = await web3.eth.getBalance(accounts[0]);
    setAccount((prev) => ({
      ...prev,
      address: accounts[0],
      eth: web3.utils.fromWei(eth),
    }));
    // Get the network ID
    const netId = await web3.eth.net.getId();
    // Load token contract
    const tokenData = TokenContract.networks[netId];
    if (tokenData) {
      const tokenContract = new web3.eth.Contract(
        TokenContract.abi,
        tokenData.address
      );
      setToken(tokenContract);
      // Get kits owned by user
      const kits = await tokenContract.methods.balanceOf(accounts[0]).call();
      setAccount((prev) => ({
        ...prev,
        kit: web3.utils.fromWei(kits.toString()),
      }));
    } else {
      alert('Token contract not deployed to this network');
    }
    // Load ethswap contract
    const ethswapData = EthSwapContract.networks[netId];
    if (ethswapData) {
      const ethswapContract = new web3.eth.Contract(
        EthSwapContract.abi,
        ethswapData.address
      );
      setEthswap(ethswapContract);
    } else {
      alert('EthSwap contract not deployed to this network');
    }
  };

  const handleClick = async () => {
    setLoading(true);
    const amountInWei = web3.utils.toWei(amount);
    if (isSelling) {
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
    } else {
      await ethswap.methods
        .buyTokens()
        .send({ value: amountInWei, from: account.address });
      setAlert({
        color: 'green',
        message: 'Purchase successful',
        dismissable: true,
      });
    }
    setAmount(0);
    setLoading(false);
    loadBlockchainData();
  };
  return (
    <div className='px-12 py-2'>
      {/* Alert */}
      <div
        className={`absolute bg-green-100 text-${
          alert.color
        }-900 py-2 px-4 rounded z-20 top-32 ${
          alert.message ? 'translate-y-0' : '-translate-y-52'
        }`}
      >
        {alert.message}
      </div>
      {/* Warning */}
      <p className='bg-red-100 text-red-500 p-2 px-3 rounded text-sm'>
        <span className='font-bold'>IMPORTANT.</span> Don't spend real ETH here,
        this website is for demo purposes. Connect with a TEST ACCOUNT ONLY.
        {/* <a className='text-red-900 border-b border-red-900 cursor-pointer'>
          Read Here
        </a> */}
      </p>
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
      <main className='pb-6'>
        <div className='grid grid-cols-2 gap-4'>
          {/* Hero Section */}
          <div className='mt-20'>
            <h1 className='text-4xl text-gray-800 font-black mx-2'>
              {isSelling ? 'Sell your' : 'Buy yourself'}
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
            <div className='border p-4 rounded-lg hover:shadow-2xl focus-within:shadow-2xl'>
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
                className='bg-pink-500 font-bold text-white text-center w-full p-4 rounded disabled:opacity-50'
                disabled={loading}
                onClick={handleClick}
              >
                {isSelling ? 'Sell' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
