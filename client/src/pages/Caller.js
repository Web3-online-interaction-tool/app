import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import {
  INTERAKT_CONTRACT_ADDRESS,
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
  DAI_CONTRACT_ADDRESS,
  INTERAKT_APP_URL,
  CERAMIC_SESSION_SCHEMA_ID,
  unit8ArrayToString,
} from "../utils/constants";
import contractABI from "../utils/llama_pay_abi.json";
import daiContractABI from "../utils/dai_abi.json";
import {
  CheckIfWalletIsConnected,
  Video,
  StopCall,
  MintAndDeposit,
  createDocument,
} from "../components/index";
import { getSessionDetailsAPI } from "../api";
import { useStore } from "../global_stores";
import { Peer } from "peerjs";
import { storeFile } from "../utils/web3.storage";
import { IDX } from "@ceramicstudio/idx";
import config from "./config";
import LitJsSdk from "lit-js-sdk";

const CallerPaymentDetails = ({ receiverPerHourCost }) => {
  const minutes = useStore((state) => state.minutes);
  return (
    <div className="container center">
      <span>
        Session was for {Math.floor(minutes)} minutes{" "}
        {Math.floor((minutes * 60) % 60)} seconds.
      </span>
      <br />
      <br />
      <span>
        You paid{" "}
        <b>~{costPerMinutes(receiverPerHourCost, minutes).toFixed(2)} $</b>
      </span>
      <br />
    </div>
  );
};

const WaitMessage = () => {
  const minutes = useStore((state) => state.minutes);
  useEffect(() => {
    localStorage.setItem("minutes", minutes);
  }, []);
  return (
    <div className="container center">
      <span>
        Completed the session. Please approve the transaction to stop streaming
        payment...
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
      <span>Current Balance : {+currentBalance.toFixed(2)}$</span>
    </div>
  );
};

const Caller = () => {
  const [myAddress, setMyAddress] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [daiBalance, setDaiBalance] = useState(0);
  const [acknowledgedConnection, setAcknowledgedConnection] = useState(false);
  const [llamaTimeBalance, setLlamaTimeBalance] = useState(0);
  const [fetchedLlamaTimeBalance, setFetchedLlamaTimeBalance] = useState(false);
  const [streamContract, setStreamContract] = useState({});
  const [daiContract, setDaiContract] = useState({});
  const [calculatedNumberOfMinutesLeft, setCalculatedNumberOfMinutedLeft] =
    useState(false);
  const [numberOfMinutedLeft, setNumberOfMinutedLeft] = useState(0);
  const showToastFunc = useStore((state) => state.showToastFunc);
  const [receiverPeerId, setReceiverPeerId] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverPerHourCost, setReceiverPerHourCost] = useState(0);
  const [receiverDescription, setReceiverDescription] = useState("");
  const [shouldRecordAudio, setShouldRecordAudio] = useState(false);
  const { id } = useParams();
  const [sessionCreated, setSessionCreated] = useState(false);
  const [requestedToStartTheSession, setRequestedToStartTheSession] =
    useState(false);
  const [myStream, setMyStream] = useState([]);
  const [receiverStream, setReceiverStream] = useState([]);
  const currentBalance = useStore((state) => state.currentBalance);
  const [conn, setConn] = useState(null);
  const [call, setCall] = useState(null);
  const [recordingBinary, setRecordingBinary] = useState(null);
  const [recordingObjectUrl, setRecordingObjectUrl] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(false);
  const [minting, setMinting] = useState(false);
  const [ipfsURL, setIpfsURL] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [savingInIPFS, setSavingInIPFS] = useState(false);

  const myLocalStream = useRef(null);
  const remoteStream = useRef(null);
  const recorder = useRef(null);
  const audioElementRef = useRef(null);
  const ceramic = useRef(null);
  const threeID = useRef(null);

  const prepareRecording = async (chunks, mimeType) => {
    const blob = new Blob(chunks, { type: mimeType });
    const audioURL = URL.createObjectURL(blob);
    setRecordingObjectUrl(audioURL);
    audioElementRef.current.src = audioURL;
    // store in web3 storage
    setSavingInIPFS(true);
    console.log("Attempting to store file in IPFS");
    // encrypt the blob
    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({
      file: blob,
    });
    // store it on IPFS using web3.storage
    const cid = await storeFile([encryptedFile], sessionId);
    console.log({ cid });

    // store the CID and more information in the ceramic
    const minutes = +localStorage.getItem("minutes");

    const streamId = await createDocument(
      ceramic,
      {
        date: Date.now().toString(),
        description: receiverDescription,
        receiver: receiverAddress,
        moneyPaid: costPerMinutes(receiverPerHourCost, minutes).toFixed(2),
        totalTimeInMin: minutes ? minutes.toFixed(2) : "0",
        fileLink: `https://ipfs.io/ipfs/${cid}/${sessionId}`,
        access: "private",
        encSecret: unit8ArrayToString(symmetricKey),
        mimeType,
      },
      CERAMIC_SESSION_SCHEMA_ID
    );
    // store the ID from the ceramic in the sessionList using IDX
    const idx = new IDX({
      ceramic: ceramic.current,
      aliases: config.definitions,
    });
    const sessions = await idx.get("interaktProfile");
    const _sessions = sessions?.sessions || [];
    console.log({ _sessions });
    await idx.set("interaktProfile", {
      sessions: [
        {
          id: streamId.toUrl(),
          description: receiverDescription,
        },
        ..._sessions,
      ],
    });
    setSavingInIPFS(false);
    setIpfsURL(`${INTERAKT_APP_URL}/session/${streamId}`);
  };

  // start audio recorder
  function startRecorder(localStream, remoteStream) {
    const audioContext = new AudioContext();

    let audioIn_01 = audioContext.createMediaStreamSource(localStream);
    let audioIn_02 = audioContext.createMediaStreamSource(remoteStream);

    let dest = audioContext.createMediaStreamDestination();

    audioIn_01.connect(dest);
    audioIn_02.connect(dest);

    // create recorder object
    var mediaRecorder = new MediaRecorder(dest.stream);

    // storing the recorder in the ref if needed to be used outside the function
    recorder.current = mediaRecorder;
    // start recording
    mediaRecorder.start();

    // chunks to store the blobs when available
    let chunks = [];

    // we derive the mimType fron the recorder itself
    let mimeType = mediaRecorder.mimeType;

    // appends the blobs to chuks when available
    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    // when recording is stopped do the following
    mediaRecorder.onstop = function (e) {
      prepareRecording(chunks, mimeType);
    };
  }

  // end session of the call and close all the video and audio tracks
  const endSession = async () => {
    // stop all the tracks from the stream
    stopBothVideoAndAudio(myLocalStream.current);
    if (call) {
      // end call if not ended
      call.close();
      if (conn)
        conn.send(JSON.stringify({ type: SESSION_MESSAGES.END_SESSION }));
      await endStreaming();
    }
  };

  // end the token streaming
  const endStreaming = async () => {
    const localSessionEnded = localStorage.getItem("session_ended");
    if (!sessionEnded && localSessionEnded !== "true") {
      stopBothVideoAndAudio(myLocalStream.current);
      setSessionEnded(true);
      localStorage.setItem("session_ended", "true");
      // if opted for recording end recording
      if (shouldRecordAudio) recorder.current.stop();
      const streamCreation = await streamContract.cancelStream(
        receiverAddress,

        ConvertPerHourCostToContractPerSecondCost(+receiverPerHourCost) /
          // eslint-disable-next-line no-undef
          BigInt(3600)
      );

      await streamCreation.wait();

      setCompletedPayment(true);

      const Balance = await streamContract.getPayerBalance(myAddress);
      setLlamaTimeBalance(+ConvertDAIPreciseToReadable(Balance).toFixed(2));

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
        break;
      default:
        break;
    }
  };
  useEffect(() => {
    if (llamaTimeBalance && receiverPerHourCost) {
      const numberOfHourCallWithBalance =
        +llamaTimeBalance / +receiverPerHourCost;
      const numberOfMinutes = Math.floor(+numberOfHourCallWithBalance * 60);
      setCalculatedNumberOfMinutedLeft(true);
      setNumberOfMinutedLeft(numberOfMinutes);
    }
  }, [llamaTimeBalance]);

  const prepareForTheSession = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const _streamContract = new ethers.Contract(
          INTERAKT_CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        setStreamContract(_streamContract);

        const _daiContract = new ethers.Contract(
          DAI_CONTRACT_ADDRESS,
          daiContractABI,
          signer
        );

        setDaiContract(_daiContract);
        let balance = await _streamContract.getPayerBalance(myAddress);
        if (balance > 0) {
          balance = ConvertDAIPreciseToReadable(balance);
          setLlamaTimeBalance(balance);
        } else setLlamaTimeBalance(0);
        setFetchedLlamaTimeBalance(true);

        const { toAddress, peerId, perHourCost, recordAudio, description } =
          await getSessionDetailsAPI(id);
        setSessionId(id);
        setReceiverPeerId(peerId);
        setReceiverAddress(toAddress);
        setReceiverPerHourCost(perHourCost);
        setShouldRecordAudio(recordAudio);
        setReceiverDescription(description);
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

    setTimeout(() => {
      var _conn = peer.connect(receiverPeerId, {
        reliable: true,
      });
      setConn(_conn);
      _conn.on("open", function (data) {
        console.log("connected to peer");
      });
      _conn.on("close", function (data) {
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
        startStream().then(() => {
          const _call = peer.call(receiverPeerId, stream);
          setCall(_call);
          _call.on("stream", function (_stream) {
            // start Streaming the moneys
            console.log("Received Stream : ", _stream);
            setReceiverStream([...receiverStream, _stream]);
            remoteStream.current = _stream;
            setTimeout(() => {
              setSessionCreated(true);
              if (shouldRecordAudio) startRecorder(stream, _stream);
            }, 1000);
          });
          setMyStream([...myStream, stream]);
          myLocalStream.current = stream;
          _call.on("close", () => {
            console.log("Closed the call session!");
            setTimeout(() => {
              endSession();
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
            ceramic={ceramic}
            threeID={threeID}
            setConnectionStatus={setConnectionStatus}
            setMyAddress={setMyAddress}
            myAddress={myAddress}
            connectionStatus={connectionStatus}
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
                      Your DAI balance in Interackt account is :{" "}
                      <b>{llamaTimeBalance.toFixed(2)} $</b>
                    </span>
                    <br />
                  </div>
                ) : (
                  <div>Fetching Interackt account balance..</div>
                )}
                <br />
                {llamaTimeBalance !== 0 ? (
                  <div>
                    {calculatedNumberOfMinutesLeft ? (
                      <div>
                        <span>
                          description : <b>{receiverDescription}</b>
                        </span>
                        <br />
                        <br />
                        <span>
                          Charge per hour : <b>{receiverPerHourCost}$</b>
                        </span>
                        <br />
                        <br />
                        <span>
                          You can talk for{" "}
                          <b> {numberOfMinutedLeft} minutes </b>
                          with your current balance.{" "}
                        </span>

                        {shouldRecordAudio ? (
                          <div>
                            <br />
                            <br />
                            <span style={{ color: "brown" }}>
                              The audio of this call will be recorded
                            </span>
                          </div>
                        ) : null}

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
                            <MintAndDeposit
                              minting={minting}
                              setMinting={setMinting}
                              daiContract={daiContract}
                              streamContract={streamContract}
                              myAddress={myAddress}
                              setLlamaTimeBalance={setLlamaTimeBalance}
                            />
                          </div>
                          <div>
                            <button
                              disabled={minting ? true : false}
                              onClick={startSession}
                            >
                              Continue with the call
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
                      <MintAndDeposit
                        minting={minting}
                        setMinting={setMinting}
                        daiContract={daiContract}
                        streamContract={streamContract}
                        myAddress={myAddress}
                        setLlamaTimeBalance={setLlamaTimeBalance}
                      />
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
              <p>Preparing for the call...</p>
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
                    <Video stream={s} muted={false} />
                  ))}
                </div>
                <div
                  className="container center"
                  style={{ width: "100%", backgroundColor: "#eeee" }}
                >
                  {myStream.map((s) => (
                    <Video stream={s} muted={true} />
                  ))}
                </div>
              </div>
              <StopCall
                shouldRecordAudio={shouldRecordAudio}
                endSession={endSession}
              />
            </div>
          ) : (
            <div className="container center">
              {!completedPayment ? (
                <WaitMessage />
              ) : (
                <CallerPaymentDetails
                  receiverPerHourCost={receiverPerHourCost}
                />
              )}
              <br />
              <span>Recording of your interaction.</span>
              <br />

              <audio
                style={{
                  display: recordingObjectUrl !== null ? "block" : "none",
                }}
                controls={true}
                ref={audioElementRef}
              ></audio>
              <br />
              <br />
              {ipfsURL ? (
                <div>
                  <span>
                    Stored in IPFS. URL for you for the file is <br />
                    <br />
                    <a rel="noreferrer" href={ipfsURL} target="_blank">
                      {ipfsURL}
                    </a>
                  </span>
                  <br />
                  <br />
                  <button
                    onClick={() => {
                      window.open(INTERAKT_APP_URL, "_blank");
                    }}
                  >
                    {" "}
                    Home{" "}
                  </button>
                </div>
              ) : (
                <span>Storing the file in IPFS....</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Caller;
