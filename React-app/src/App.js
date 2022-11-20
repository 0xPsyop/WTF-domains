import React , { useEffect,useState } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import contractAbi from './utils/contractABI.json'; 
import polygonLogo from './assets/polygonlogo.png';
//import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks.js';

// Constants
const TWITTER_HANDLE = '0xManujaya';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
	const tld  = ".wtf";
	const Contract_Address = '0x8202183af399B741d1F066f6A7F1951601E39786';


	const[currentAccount , setCurrentAccount] = useState('');
	const[domain , setDomain] = useState('');
	const[record , setRecord] = useState('');
	const[network, setNetwork] = useState('');
	const[editing, setEditing] = useState(false);
	const[loading, setLoading]  =useState(false);
    const[mints  , setMints]  = useState([]);

	const checkIfWalletIsConnected = async() => {
		const {ethereum} = window;
        console.log(ethereum);
		if(!ethereum){
			console.log("Make sure you have MetaMask!");
			return;
		} else {
			console.log("We have the Ethereum object", ethereum);
		}

		const accounts  = await ethereum.request({method:'eth_accounts'});

		if(accounts.length !== 0){
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else{
			console.log('No authorized account found');
		}

		 const chainId = await ethereum.request({ method: 'eth_chainId' });
		 console.log(chainId);
        setNetwork(networks[chainId]);
        
		
		ethereum.on('chainChanged', handleChainChanged)
       
		function handleChainChanged() {
			window.location.reload();
		  }

	}

	

	const mintDomain = async ()=>{
		 if(!domain) {return}

		 if(domain.length < 1) {
		 alert('Domain must be at least 2 characters long');
		 return;
		}

		const price = domain.length === 2 ? '0.5' : domain.length === 3 ? '0.4' :domain.length === 4 ? '0.3' : '0.1';
		console.log("Minting domain", domain, "with price", price);

		try{
          const {ethereum} = window;

		  if(ethereum){
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(Contract_Address , contractAbi.abi, signer);

			let txn = await contract.register(domain, {value: ethers.utils.parseEther(price)});
			
			const receipt = await txn.wait();

			if(receipt.status === 1) {
				console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+txn.hash);

				txn = await contract.setRecord(domain, record);
				await txn.wait();
				
				console.log("Record set! https://mumbai.polygonscan.com/tx/"+txn.hash);

				setTimeout(() => {
					fetchMints();
				  }, 2000);

				setRecord('');
				setDomain('');
			}

			console.log("Going to pop wallet now to pay gas...")
		  } 
		} catch(err)  {
          console.log(err); 
		}
	}
    
	const updateDomain = async ()=>{
		if(!domain || !record) {return};
        setLoading(true);
        console.log("Updating domain", domain, "with record", record);
		try{
			const{ethereum} = window
			if(ethereum){
               const provider = new ethers.providers.Web3Provider(ethereum);
			   const signer = provider.getSigner();
			   const contract = new ethers.Contract(Contract_Address, contractAbi.abi, signer);

			   let tx  = contract.setRecord(domain, record);
			   await tx.wait();
			   console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);

			   fetchMints();
			   setRecord('');
			   setDomain('');
			}
		} catch(error){
			console.log(error);
		}

		setLoading(false);
	}

	const fetchMints = async () => {
		try {
		  const { ethereum } = window;
		  if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(Contract_Address, contractAbi.abi, signer);
			  
			
			const names = await contract.getAllNames();
			  
			const mintRecords = await Promise.all(names.map(async (name) => {
			const mintRecord = await contract.records(name);
			const owner = await contract.domains(name);
			return {
			  id: names.indexOf(name),
			  name: name,
			  record: mintRecord,
			  owner: owner,
			};
		  }));
	  
		  console.log("All Mints fetched", mintRecords);
		  setMints(mintRecords);
		  }
		} catch(error){
		  console.log(error);
		}
	  }
    
	useEffect(()=>{
		if (network === 'Polygon Mumbai Testnet') {
			fetchMints();
		  }
	}, [currentAccount, network])
  
	const connectWallet = async() =>{
		 try{
           const {ethereum} = window;

		   if (!ethereum) {
			alert("Get MetaMask -> https://metamask.io/");
			return;
		}
        
		const accounts = await ethereum.request({ method: "eth_requestAccounts" });

		console.log("Connected", accounts[0]);
		setCurrentAccount(accounts[0]);

		 } catch(err){
           console.log(err);
		 }
	}

   const switchNetwork = async () => {
		if (window.ethereum) {
		  try {
			// Try to switch to the Mumbai testnet
			await window.ethereum.request({
			  method: 'wallet_switchEthereumChain',
			  params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
			});
			
		  } catch (error) {
			// This error code means that the chain we want has not been added to MetaMask
			// In this case we ask the user to add it to their MetaMask
			if (error.code === 4902) {
			  try {
				await window.ethereum.request({
				  method: 'wallet_addEthereumChain',
				  params: [
					{	
					  chainId: '0x13881',
					  chainName: 'Polygon Mumbai Testnet',
					  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
					  nativeCurrency: {
						  name: "Mumbai Matic",
						  symbol: "MATIC",
						  decimals: 18
					  },
					  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
					},
				  ],
				});
			  } catch (error) {
				console.log(error);
			  }
			}
			console.log(error);
		  }
		} else {
		  // If window.ethereum is not found then MetaMask is not installed
		  alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		} 
	  }

	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://media.giphy.com/media/VRKheDy4DkBMrQm66p/giphy-downsized-large.gif" alt="WTF gif" />
			<button className="cta-button connect-wallet-button" onClick={connectWallet}>
				Connect Wallet
			</button>
		</div>
  	);

	const renderInputForm = () =>{
		if (network !== 'Polygon Mumbai Testnet') {
		  return (
			<div className="connect-wallet-container">
			  <p>Please connect to Polygon Mumbai Testnet</p>
			  <button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
			</div>
		  );
		}
	
		return (
		  <div className="form-container">
			<div className="first-row">
			  <input
				type="text"
				value={domain}
				placeholder='domain'
				onChange={e => setDomain(e.target.value)}
			  />
			  <p className='tld'> {tld} </p>
			</div>
	
			<input
			  type="text"
			  value={record}
			  placeholder='whats ur ninja power?'
			  onChange={e => setRecord(e.target.value)}
			/>
			  {/* If the editing variable is true, return the "Set record" and "Cancel" button */}
			  {editing ? (
				<div className="button-container">
				  {/* This will call the updateDomain function we just made */}
				  <button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
					Set record
				  </button>  
				  {/* This will let us get out of editing mode by setting editing to false */}
				  <button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
					Cancel
				  </button>  
				</div>
			  ) : (
				// If editing is not true, the mint button will be returned instead
				<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
				  Mint
				</button>  
			  )}
		  </div>
		);
	  }
  

	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);
    
	
	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
		  return (
			<div className="mint-container">
			  <p className="subtitle"> Recently minted domains!</p>
			  <div className="mint-list">
				{ mints.map((mint, index) => {
				  return (
					<div className="mint-item" key={index}>
					  <div className='mint-row'>
						<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${Contract_Address}/${mint.id}`} target="_blank" rel="noopener noreferrer">
						  <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
						</a>
						{/* If mint.owner is currentAccount, add an "edit" button*/}
						{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
						  <button className="edit-button" onClick={() => editRecord(mint.name)}>
							<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
						  </button>
						  :
						  null
						}
					  </div>
				<p> {mint.record} </p>
			  </div>)
			  })}
			</div>
		  </div>);
		}
	  };
   
	
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	  }

	
  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
						
						<div className="left">
						<p className="title"> WTF Name Service</p>
						<p className="subtitle">Register your wtf name 😂</p>
						</div>

						<div className="right">
						
			<img alt="Network logo" className="logo" src={ polygonLogo } />
			{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
		
						</div>
					</header>
				</div>
				{!currentAccount && renderNotConnectedContainer()}
				{ currentAccount && renderInputForm()}
				{mints && renderMints()}
                <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`Built by @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
