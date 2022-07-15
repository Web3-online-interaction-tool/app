import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import {
  LLAMA_TIME_CONTRACT_ADDRESS,
  ConvertDAIPreciseToReadable,
  SESSION_MESSAGES,
  ConvertPerHourCostToContractPerSecondCost,
  costPerMinutes,
  stopBothVideoAndAudio,
  PEER_HOST,
  PEER_SECURE,
  PEER_PATH,
  PEER_PORT,
  PEER_DEBUG,
} from "../utils/constants";
import contractABI from "../utils/llama_pay_abi.json";
import { CheckIfWalletIsConnected, Video, StopCall } from "../components/index";
import { getSessionDetailsAPI } from "../api";
import { useStore } from "../global_stores";
import { Peer } from "peerjs";

const CallerPaymentDetails = ({ receiverPerHourCost }) => {
  const minutes = useStore((state) => state.minutes);
  return (
    <div className="container center">
      <span>
        Session was for {Math.floor(minutes)} minutes {(minutes * 60) % 60}
        seconds.
      </span>
      <br />
      <br />
      <span>
        You paid ~{costPerMinutes(receiverPerHourCost, minutes).toFixed(2)}
      </span>
    </div>
  );
};

const CurrentBalance = ({ receiverPerHourCost, llamaTimeBalance }) => {
  const [currentBalance, setCurrentBalance] = useState(0);
  const minutes = useStore((state) => state.minutes);
  useEffect(() => {
    setCurrentBalance(
      +llamaTimeBalance - +costPerMinutes(+receiverPerHourCost, +minutes)
    );
  }, [minutes]);
  return (
    <div
      className="container center"
      style={{
        height: "5vh",
        backgroundColor: "#eeee",
        color: "#333",
      }}
    >
      <span>Current Balance : {+currentBalance.toFixed(8)}$</span>
    </div>
  );
};
function Caller() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [myAddress, setMyAddress] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [daiBalance, setDaiBalance] = useState(0);
  const [acknowledgedConnection, setAcknowledgedConnection] = useState(false);
  const [llamaTimeBalance, setLlamaTimeBalance] = useState(0);
  const [fetchedLlamaTimeBalance, setFetchedLlamaTimeBalance] = useState(false);
  const [streamContract, setStreamContract] = useState({});
  const [calculatedNumberOfMinutesLeft, setCalculatedNumberOfMinutedLeft] =
    useState(false);
  const [numberOfMinutedLeft, setNumberOfMinutedLeft] = useState(0);

  const showToastFunc = useStore((state) => state.showToastFunc);
  const [receiverPeerId, setReceiverPeerId] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverPerHourCost, setReceiverPerHourCost] = useState(0);

  const { id } = useParams();

  const [sessionCreated, setSessionCreated] = useState(false);
  const [requestedToStartTheSession, setRequestedToStartTheSession] =
    useState(false);
  // const receiverStream = useRef([]);
  // const myStream = useRef([]);
  const [myStream, setMyStream] = useState([]);
  const [receiverStream, setReceiverStream] = useState([]);
  // const [peerConnection, setPeerConnection] = useState({});
  const currentBalance = useStore((state) => state.currentBalance);
  const [conn, setConn] = useState(null);
  const [call, setCall] = useState(null);

  const myLocalStream = useRef(null);

  const [sessionEnded, setSessionEnded] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(false);

  const endSession = async () => {
    console.log("Ending session");
    console.log("call : ", call, conn);
    stopBothVideoAndAudio(myLocalStream.current);
    if (call) {
      call.close();
      if (conn)
        conn.send(JSON.stringify({ type: SESSION_MESSAGES.END_SESSION }));

      await endStreaming();
    }
  };

  const endStreaming = async () => {
    console.log("Ending stream");
    const localSessionEnded = localStorage.getItem("session_ended");
    if (!sessionEnded && localSessionEnded !== "true") {
      stopBothVideoAndAudio(myLocalStream.current);
      setSessionEnded(true);
      localStorage.setItem("session_ended", "true");
      const streamCreation = await streamContract.cancelStream(
        receiverAddress,

        ConvertPerHourCostToContractPerSecondCost(+receiverPerHourCost) /
          // eslint-disable-next-line no-undef
          BigInt(3600)
      );
      console.log(
        "Mining...",
        streamCreation.hash,
        receiverAddress,

        ConvertPerHourCostToContractPerSecondCost(+receiverPerHourCost) /
          // eslint-disable-next-line no-undef
          BigInt(3600)
      );
      await streamCreation.wait();
      setCompletedPayment(true);

      const Balance = await streamContract.getPayerBalance(myAddress);
      setLlamaTimeBalance(+ConvertDAIPreciseToReadable(Balance).toFixed(2));
      console.log(
        "ENded stream, checking for conn to send Success Ended contract message : ",
        conn
      );
      if (conn) {
        conn.send(
          JSON.stringify({
            type: SESSION_MESSAGES.SUCCESSFULLY_ENDED_CONTRACT,
          })
        );
        setTimeout(() => {
          conn.close();
          setConn(null);
        }, 2000);
      }
    }
  };

  const startStream = async () => {
    console.log("Start streaming contract called.");
    console.log({
      receiverAddress,
      amount: ConvertPerHourCostToContractPerSecondCost(+receiverPerHourCost),
      streamContract,
    });
    const streamCreation = await streamContract.createStream(
      receiverAddress,

      ConvertPerHourCostToContractPerSecondCost(+receiverPerHourCost) /
        // eslint-disable-next-line no-undef
        BigInt(3600)
    );
    console.log("Mining...", streamCreation.hash);
    await streamCreation.wait();
  };

  const handleIncomingData = (message) => {
    console.log("Received message : ", message);
    switch (message.type) {
      case SESSION_MESSAGES.END_SESSION:
        endSession();
        break;
      case SESSION_MESSAGES.ACKNOWLEDGE_CONNECTION:
        console.log("Peer acknowledged the connection. Connection is active!");
        break;
      default:
        console.log("Why here!!!!");
        break;
    }
  };

  const prepareForTheSession = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const _streamContract = new ethers.Contract(
          LLAMA_TIME_CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        setStreamContract(_streamContract);
        console.log({ myAddress });
        let balance = await _streamContract.getPayerBalance(myAddress);
        if (balance > 0) {
          balance = ConvertDAIPreciseToReadable(balance);
          setLlamaTimeBalance(balance);
        } else setLlamaTimeBalance(0);
        setFetchedLlamaTimeBalance(true);

        console.log({ id });
        const sessionId = id;
        const { toAddress, peerId, perHourCost } = await getSessionDetailsAPI(
          sessionId
        );

        // TODO check if the session is already completed
        console.log({ toAddress, peerId, perHourCost });
        setReceiverPeerId(peerId);
        setReceiverAddress(toAddress);
        setReceiverPerHourCost(perHourCost);
        if (balance > 0) {
          const numberOfHourCallWithBalance = +balance / +perHourCost;
          const numberOfMinutes = Math.floor(+numberOfHourCallWithBalance * 60);
          setCalculatedNumberOfMinutedLeft(true);
          setNumberOfMinutedLeft(numberOfMinutes);
        } else {
          setCalculatedNumberOfMinutedLeft(true);
          setNumberOfMinutedLeft(0);
        }
      }
    } catch (e) {
      console.log("Error : ", e);
      showToastFunc(e.message || "Session invalid or expired");
    }
  };

  const startSession = () => {
    setRequestedToStartTheSession(true);
    // request the media permission

    const peer = new Peer({
      host: PEER_HOST,
      port: PEER_PORT,
      path: PEER_PATH,
      secure: PEER_SECURE,
      debug: PEER_DEBUG,
    });

    peer.on("connection", function (c) {
      // Disallow incoming connections
      c.on("open", function () {
        c.send("Sender does not accept incoming connections");
        setTimeout(function () {
          c.close();
        }, 500);
      });
    });
    peer.on("disconnected", function () {
      console.log("Connection lost. Please reconnect");
    });
    peer.on("close", function () {
      console.log("Connection destroyed");
    });
    peer.on("error", function (err) {
      console.log(err);
      alert("" + err);
    });

    console.log({ receiverPeerId });
    setTimeout(() => {
      console.log("Attempting to connect to the Peer!");
      var _conn = peer.connect(receiverPeerId, {
        reliable: true,
      });
      setConn(_conn);
      _conn.on("open", function (data) {
        console.log("connected to peer");
      });
      _conn.on("close", function (data) {
        console.log("dis connected to peer");
        console.log("Closed the call session!");
        setTimeout(() => {
          endStreaming();
        }, 5000);
      });
      // Receive messages
      _conn.on("data", function (data) {
        if (data) handleIncomingData(JSON.parse(data));
      });
    }, 5000);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("Fetched audio and video stream , ", stream);
        startStream().then(() => {
          console.log("started payment streaming " + receiverAddress);
          console.log("Attempting to call peerId : ", receiverPeerId);

          const _call = peer.call(receiverPeerId, stream);
          setCall(_call);

          _call.on("stream", function (_stream) {
            // start Streaming the moneys
            console.log("Received Stream : ", _stream);
            setReceiverStream([...receiverStream, _stream]);

            setTimeout(() => {
              console.log("Set stream started true");
              setSessionCreated(true);
            }, 4000);
          });
          setMyStream([...myStream, stream]);
          myLocalStream.current = stream;
          _call.on("close", () => {
            console.log("Closed the call session!");
            setTimeout(() => {
              endStreaming();
            }, 5000);
          });
          _call.on("error", (e) => {
            console.log("Error : ", e);
            endSession();
          });
        });
      })
      .catch((e) => {
        console.log(
          "Could not get the audio and video stream. Please allow permissions",
          e
        );
      });
    // // make a call to the
    // setTimeout(() => {
    //   console.log({ myStream });

    // }, 5000);
    peer.on("error", (e) => {
      console.log("Error on peer connection : ", e);
    });
  };

  useEffect(() => {
    if (connectionStatus === true && !acknowledgedConnection) {
      setAcknowledgedConnection(true);
      prepareForTheSession();
      localStorage.setItem("session_ended", "false");
    }
  }, [connectionStatus]);

  return (
    <div className="container center">
      {!requestedToStartTheSession ? (
        <div>
          <CheckIfWalletIsConnected
            setConnectionStatus={setConnectionStatus}
            setMyAddress={setMyAddress}
            myAddress={myAddress}
            connectionStatus={connectionStatus}
            setCurrentAccount={setCurrentAccount}
            setDaiBalance={setDaiBalance}
          />
          <br />
          <div>
            {connectionStatus ? (
              <div style={{ width: "700px" }}>
                {/* <span>
              {" "}
              Your DAI balance in wallet is :<b>
                {daiBalance.toFixed(2)} $
              </b>{" "}
            </span>{" "}
            <br /> <br /> */}

                {fetchedLlamaTimeBalance ? (
                  <div>
                    <span>
                      Your DAI balance in llamapay account is :{" "}
                      <b>{llamaTimeBalance.toFixed(2)} $</b>
                    </span>
                    <br />
                  </div>
                ) : (
                  <div>Fetching Llamatime account balance..</div>
                )}
                <br />
                {llamaTimeBalance !== 0 ? (
                  <div>
                    {calculatedNumberOfMinutesLeft ? (
                      <div>
                        <span>
                          You can talk for{" "}
                          <b> {numberOfMinutedLeft} minutes </b>
                          with your current balance.{" "}
                        </span>

                        <div
                          style={{
                            width: "60%",
                            margin: "auto",
                            marginTop: "64px",
                            display: "grid",
                            gridTemplateColumns: "50% 50%",
                          }}
                        >
                          <div>
                            <button> Mint and Deposit</button>
                          </div>
                          <div>
                            <button onClick={startSession}>
                              {" "}
                              Continue with the call{" "}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        Calculating number of minutes you can speak with your
                        current Balance...
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div>
                      <span>
                        You can not initiate call since your account balance is
                        <b> 0</b>.
                      </span>
                      <br />
                      <br />
                      <button>Mint and Deposit</button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div style={{ width: "100vw" }}>
          {!sessionCreated ? (
            <div>
              <p>Preparing for the call</p>
            </div>
          ) : !sessionEnded ? (
            <div>
              <CurrentBalance
                receiverPerHourCost={receiverPerHourCost}
                llamaTimeBalance={llamaTimeBalance}
              />

              <div
                style={{
                  width: "100%",
                  height: "95vh",
                  display: "grid",
                  gridTemplateColumns: "50% 50%",
                }}
              >
                <div
                  className="container center"
                  style={{ width: "100%", backgroundColor: "#eeee" }}
                >
                  {receiverStream.map((s) => (
                    <Video stream={s} />
                  ))}
                </div>
                <div
                  className="container center"
                  style={{ width: "100%", backgroundColor: "#eeee" }}
                >
                  {myStream.map((s) => (
                    <Video stream={s} />
                  ))}
                </div>
              </div>
              <StopCall endSession={endSession} />
            </div>
          ) : !completedPayment ? (
            <div className="container center">
              <span>
                Completed the session. Please approve the transaction to stop
                streaming payment...
              </span>
            </div>
          ) : (
            <CallerPaymentDetails receiverPerHourCost={receiverPerHourCost} />
          )}
        </div>
      )}
    </div>
  );
}

export default Caller;
