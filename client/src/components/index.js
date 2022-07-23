import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  DAI_CONTRACT_ADDRESS,
  ConvertDAIPreciseToReadable,
  INTERAKT_CONTRACT_ADDRESS,
  MINT_TOKEN,
} from "../utils/constants";
import DAIAbi from "../utils/dai_abi.json";
import { useStore } from "../global_stores";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import { DID } from "dids";
import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { TileDocument } from "@ceramicnetwork/stream-tile";

export const CheckIfWalletIsConnected = ({
  setConnectionStatus,
  setMyAddress,
  myAddress,
  connectionStatus,

  setDaiBalance,
  ceramic,
  threeID,
}) => {
  const [isCheckingConnectionStatus, setIsCheckingConnectionStatus] =
    useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const showToastFunc = useStore((state) => state.showToastFunc);

  const populateEthereumValues = async (ethereum) => {
    try {
      const chainId = await ethereum.request({ method: "eth_chainId" });
      const rinkebyTestChainId = 4;
      console.log("hex", ethers.utils.hexValue(rinkebyTestChainId));
      if (chainId !== rinkebyTestChainId) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [
              {
                chainId: ethers.utils.hexValue(rinkebyTestChainId),
              },
            ],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            console.log(
              "This network is not available in your metamask, please add it"
            );
            return showToastFunc(
              "Please enable test-network on your metamask and try again"
            );
          }
          console.log("Failed to switch to the network");
        }
      }
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      const address = await signer.getAddress();
      console.log({ address });
      const daiAddress = DAI_CONTRACT_ADDRESS;
      const daiContract = new ethers.Contract(daiAddress, DAIAbi, provider);
      console.log({ daiContract });
      await authenticateWithEthereum(ethereum);
      const balance = await daiContract.balanceOf(address);
      if (balance > 0) setDaiBalance(ConvertDAIPreciseToReadable(balance));
      else setDaiBalance(0);
      setMyAddress(address);
      setConnectionStatus(true);
    } catch (e) {
      console.log("Error : ", e);
    }
  };

  async function authenticateWithEthereum(ethereumProvider) {
    try {
      // Request accounts from the Ethereum provider
      const accounts = await ethereumProvider.request({
        method: "eth_requestAccounts",
      });
      // Create an EthereumAuthProvider using the Ethereum provider and requested account
      const authProvider = new EthereumAuthProvider(
        ethereumProvider,
        accounts[0]
      );
      // Connect the created EthereumAuthProvider to the 3ID Connect instance so it can be used to
      // generate the authentication secret
      await threeID.current.connect(authProvider);

      const did = new DID({
        // Get the DID provider from the 3ID Connect instance
        provider: threeID.current.getDidProvider(),
        resolver: {
          ...get3IDResolver(ceramic.current),
          ...getKeyResolver(),
        },
      });
      // Authenticate the DID using the 3ID provider
      await did.authenticate();
      ceramic.current.did = did;
      console.log("Authenticated!");
    } catch (e) {
      console.log("Error : ", e);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Make sure you have metamask!");
        setIsCheckingConnectionStatus(true);
        return;
      }
      let accounts = await ethereum.request({ method: "eth_accounts" });
      console.log({ accounts });
      if (accounts.length !== 0) {
        const account = accounts[0];
        await populateEthereumValues(ethereum);
      }
      setIsCheckingConnectionStatus(true);
    } catch (error) {
      console.log(error);
      showToastFunc("Something went wrong!");
      setIsCheckingConnectionStatus(true);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        // Prompt user for account connections
        await provider.send("eth_requestAccounts", []);
        await populateEthereumValues(ethereum);
        const accounts = await ethereum.request({ method: "eth_accounts" });
        const account = accounts[0];
        // setCurrentAccount(account);
      } else {
        alert("Install Metamask");
      }
      setIsConnecting(false);
    } catch (e) {
      console.log({ e });
      showToastFunc("Something went wrong!");
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    ceramic.current = new CeramicClient("https://ceramic-clay.3boxlabs.com");
    threeID.current = new ThreeIdConnect();
    checkIfWalletIsConnected();
  }, []);

  return (
    <div>
      {!isCheckingConnectionStatus ? (
        <span>checking connection status ..</span>
      ) : (
        <div>
          {connectionStatus === true ? (
            <div>
              Connected to :
              <b>
                {" "}
                {`${myAddress.substring(0, 7)}...${myAddress.substring(
                  myAddress.length - 5,
                  myAddress.length
                )}`}{" "}
              </b>
            </div>
          ) : (
            <button onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? "Connecting" : "Connect to Wallet"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const Toast = ({ showToast, toastMessage }) => {
  return (
    <div
      className="snackbar"
      style={{ visibility: showToast ? "visible" : "hidden" }}
    >
      {toastMessage}
    </div>
  );
};

export const Video = ({ stream, muted }) => {
  const localVideo = React.createRef();

  // localVideo.current is null on first render
  // localVideo.current.srcObject = stream;

  useEffect(() => {
    // Let's update the srcObject only after the ref has been set
    // and then every time the stream prop updates
    if (localVideo.current) localVideo.current.srcObject = stream;
  }, [stream, localVideo]);

  return muted ? (
    <video
      muted={muted ? "muted" : false}
      className="flipped"
      style={{ width: "100%" }}
      ref={localVideo}
      autoPlay
    />
  ) : (
    <video
      className="flipped"
      style={{ width: "100%" }}
      ref={localVideo}
      autoPlay
    />
  );
};

export const Timer = ({ shouldRecordAudio }) => {
  const [seconds, setSeconds] = useState(0);

  const setMinutes = useStore((state) => state.setMinutes);
  const minutes = useStore((state) => state.minutes);

  useEffect(() => {
    let _minutes = +(seconds + 1) / 60;
    setMinutes(_minutes);
  }, [seconds]);

  const increaseTimer = () => {
    setSeconds((seconds) => seconds + 1);
  };

  useEffect(() => {
    console.log("Executed!");
    let timer = setInterval(increaseTimer, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);
  return (
    <div
      className="container center"
      style={{
        backgroundColor: "#ffff",
        padding: "10px",
        borderRadius: "20px",
      }}
    >
      <span>{`${Math.floor(minutes / 60)}:${Math.floor(minutes)}:${Math.floor(
        seconds % 60
      )}`}</span>

      <span style={{ color: "brown" }}>
        {shouldRecordAudio ? "Recording audio" : null}
      </span>
    </div>
  );
};

export const StopCall = ({
  endSession,
  minutes,
  setMinutes,
  shouldRecordAudio,
}) => {
  return (
    <div
      style={{
        width: "140px",
        marginLeft: "-70px",
        padding: "10px",
        position: "Fixed",
        bottom: "30px",
        left: "50%",
      }}
    >
      <div
        className="clickable"
        style={{
          width: "100px",
          padding: "20px",

          borderRadius: "20px",
          backgroundColor: "red",
          color: "#ffff",
        }}
        onClick={endSession}
      >
        End Call
      </div>
      <br />
      <Timer
        minutes={minutes}
        setMinutes={setMinutes}
        shouldRecordAudio={shouldRecordAudio}
      />
    </div>
  );
};

const mintAndApproveState = {
  SING_FOR_MINTING: {
    name: "SING_FOR_MINTING",
    text: "1) Please sign to mint the DAI token to your wallet.",
  },
  WAITING_FOR_MINTING: {
    name: "WAITING_FOR_MINTING",
    text: "1) Waiting for mint transaction to be mined.",
  },
  SIGN_FOR_APPROVAL: {
    name: "SIGN_FOR_APPROVAL",
    text: "2) Please sign to approve the contract to spend the DAI tokens.",
  },
  WAITING_FOR_APPROVAL: {
    name: "WAITING_FOR_APPROVAL",
    text: "2) Waiting for approve transaction to be mined.",
  },
  SIGN_TO_DEPOSIT: {
    name: "SIGN_TO_DEPOSIT",
    text: "3) Please sign to deposit minted DAI to the smart contract.",
  },
  WAITING_FOR_DEPOSIT: {
    name: "WAITING_FOR_DEPOSIT",
    text: "3) Waiting for deposit transaction to be mined.",
  },
  FETCHING_LATEST_BALANCE: {
    name: "FETCHING_LATEST_BALANCE",
    text: "Waiting for deposit transaction to be mined.",
  },
};

export const MintAndDeposit = ({
  minting,
  setMinting,
  daiContract,
  streamContract,
  myAddress,
  setLlamaTimeBalance,
}) => {
  const [showInfoPopUp, setShowInfoPopUp] = useState(false);
  const [mintText, setMintText] = useState(
    mintAndApproveState["SING_FOR_MINTING"]["text"]
  );
  const closeInfoPopUP = () => setShowInfoPopUp(false);

  const mintAndDepositTestDAI = async () => {
    try {
      closeInfoPopUP();
      setMinting(true);
      console.log({ daiContract });
      const _mint = await daiContract["mint(uint256)"](MINT_TOKEN);
      setMintText(mintAndApproveState["WAITING_FOR_MINTING"]["text"]);
      await _mint.wait();
      // approve
      setMintText(mintAndApproveState["SIGN_FOR_APPROVAL"]["text"]);
      const approve = await daiContract.approve(
        INTERAKT_CONTRACT_ADDRESS,
        MINT_TOKEN
      );
      setMintText(mintAndApproveState["WAITING_FOR_APPROVAL"]["text"]);
      await approve.wait();
      // deposit
      setMintText(mintAndApproveState["SIGN_TO_DEPOSIT"]["text"]);
      const deposit = await streamContract.deposit(MINT_TOKEN);
      setMintText(mintAndApproveState["WAITING_FOR_DEPOSIT"]["text"]);
      await deposit.wait();
      setMintText(mintAndApproveState["FETCHING_LATEST_BALANCE"]["text"]);
      // update the balance
      const Balance = await streamContract.getPayerBalance(myAddress);
      setLlamaTimeBalance(+ConvertDAIPreciseToReadable(Balance).toFixed(2));
      setMinting(false);
    } catch (e) {
      console.log("Error : ", e);
    }
  };

  return (
    <div>
      {showInfoPopUp && (
        <MintAndDepositInfo
          closeInfoPopUP={closeInfoPopUP}
          mintAndDepositTestDAI={mintAndDepositTestDAI}
        />
      )}
      <button
        disabled={minting ? true : false}
        onClick={() => {
          setShowInfoPopUp(true);
        }}
      >
        {" "}
        Mint and Deposit
      </button>
      <br />
      {minting && (
        <span>
          Please wait... <br />
          {mintText}
        </span>
      )}
    </div>
  );
};

export const Popup = (props) => {
  return (
    <div className="popup">
      <div className="popup_open">{props.children}</div>
    </div>
  );
};

export const MintAndDepositInfo = ({
  mintAndDepositTestDAI,
  closeInfoPopUP,
}) => {
  return (
    <Popup>
      <div className="container center">
        <div
          style={{
            width: "70%",
            margin: "auto",
            textAlign: "left",
            padding: "40px",
            marginTop: "40px",
            marginButton: "40px",
          }}
        >
          <p>
            <b>
              You need to sing thrice to mint the DAI stable coin and deposit
              into your Interakt wallet (stored in smart contract)
            </b>
          </p>
          <br />
          <ol>
            <li>
              To mint the stable coin from{" "}
              <a
                href={`https://rinkeby.etherscan.io/address${DAI_CONTRACT_ADDRESS}`}
                target="_balnk"
              >
                DAI smart contract
              </a>{" "}
              deployed on the Rinkeby blockchain
            </li>
            <li>
              To approve the owner ship to{" "}
              <a
                href={`https://rinkeby.etherscan.io/address${INTERAKT_CONTRACT_ADDRESS}`}
                target="_balnk"
              >
                Interact smart contract{" "}
              </a>
              to spend the DAI token
            </li>
            <li>To deposit the DAI token into the smart contract</li>
          </ol>
          <br />
          <span>
            <i>
              Since the application is on testnet we mint and deposit 1000 $
              worth stable coin for you to test.
            </i>
          </span>
          <br />
          <br />
          <div
            style={{
              width: "80%",
              display: "grid",
              gridTemplateColumns: "40% 20% 40%",
            }}
          >
            <button onClick={mintAndDepositTestDAI}>Continue</button>
            <div></div>
            <button
              style={{ backgroundColor: "lightcoral" }}
              onClick={closeInfoPopUP}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Popup>
  );
};

export const load = async (ceramic, id) => {
  try {
    return await TileDocument.load(ceramic.current, id);
  } catch (e) {
    console.log("Error : ", e);
  }
};

export const createDocument = async (ceramic, content, schema) => {
  try {
    // The following call will fail if the Ceramic instance does not have an authenticated DID
    const doc = await TileDocument.create(ceramic.current, content, {
      schema,
    });
    // The stream ID of the created document can then be accessed as the `id` property
    return doc.id;
  } catch (e) {
    console.log("Error : ", e);
  }
};
