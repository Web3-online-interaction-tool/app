import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import { useViewerConnection, Provider } from "@self.id/framework";
import { EthereumAuthProvider } from "@self.id/web";
import { ethers } from "ethers";
import { ShowViewerName, SetViewerName } from "./test_ceramic";

function ConnectButton() {
  const [connection, connect, disconnect] = useViewerConnection();

  const populateEthereumValues = async (ethereum) => {
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
          alert("Please enable test-network on your metamask and try again");
        }
        console.log("Failed to switch to the network");
      }
    }
  };

  const connectWallet = async () => {
    const { ethereum } = window;
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    await populateEthereumValues(ethereum);
    await connect(new EthereumAuthProvider(ethereum, accounts[0]));
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();

    const address = await signer.getAddress();
    console.log({ address });
  };

  useEffect(() => {
    console.log({ connection });
  }, [connection]);

  return connection.status === "connected" ? (
    <div>
      <button
        onClick={() => {
          disconnect();
        }}
      >
        Disconnect ({connection.selfID.id})
      </button>
      <ShowViewerName />
      <SetViewerName />
    </div>
  ) : "ethereum" in window ? (
    <button
      disabled={connection.status === "connecting"}
      onClick={connectWallet}
    >
      Connect
    </button>
  ) : (
    <p>
      An injected Ethereum provider such as{" "}
      <a href="https://metamask.io/">MetaMask</a> is needed to authenticate.
    </p>
  );
}

function App() {
  return (
    <Provider>
      <div className="App">
        <ConnectButton />
      </div>
    </Provider>
  );
}

export default App;
