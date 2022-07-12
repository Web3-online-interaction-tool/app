import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import contractABI from "./abi.json";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { ethers } from "ethers";

const contractAddress = "0x5A1f011E8F010f8B6Abf81e75Db34866b685ca54";

// const etherJsExample= () =>{
//   const sablier = new ethers.Contract(0xabcd..., sablierABI, signerOrProvider); // get a handle for the Sablier contract
// const recipient = 0xcdef...;
// const deposit = "2999999999999998944000"; // almost 3,000, but not quite
// const now = Math.round(new Date().getTime() / 1000); // get seconds since unix epoch
// const startTime = now + 3600; // 1 hour from now
// const stopTime = now + 2592000 + 3600; // 30 days and 1 hour from now

// const token = new ethers.Contract(0xcafe..., erc20ABI, signerOrProvider); // get a handle for the token contract
// const approveTx = await token.approve(sablier.address, deposit); // approve the transfer
// await approveTx.wait();

// const createStreamTx = await sablier.createStream(recipient, deposit, token.address, startTime, stopTime);
// await createStreamTx.wait();
// }

function App() {
  const TestSigner = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        console.log({ contractAddress, contractABI, signer });
        const streamContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Execute the actual wave from your smart contract
         */
        const address = await signer.getAddress();
        console.log({ address, streamContract });
        const Balance = await streamContract.balances(address);
        console.log({
          Balance: +Balance.toString(),
          Dai: +Balance.toString() / 1000000000000000000,
        });
        setTimeout(async () => {
          const streamCreation = await streamContract.createStreamWithReason(
            "0x0cC2622aF5D1b22B7f57AC8944B4cBaa0D7b59F3",
            100000000000000000n,
            "Testing"
          );
          console.log("Mining...", streamCreation.hash);
          await streamCreation.wait();
          console.log("Mined -- ", streamCreation.hash);
          setInterval(async () => {
            const Balance = await streamContract.balances(address);
            console.log({
              Balance: +Balance.toString(),
              Dai: +Balance.toString() / 1000000000000000000,
            });
          }, 3000);
        }, 30000);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
      <div>
        <button>start</button>
      </div>
      <div>
        <button>Stop</button>
      </div>
    </div>
  );
}

export default App;
