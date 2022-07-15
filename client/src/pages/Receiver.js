import React, { useEffect, useState, useRef } from "react";
import { Peer } from "peerjs";
import { createSessionAPI } from "../api";
import { useParams } from "react-router-dom";
import {
  getWithExpiry,
  LLAMA_APP_URL,
  SESSION_MESSAGES,
  costPerMinutes,
  stopBothVideoAndAudio,
  PEER_HOST,
  PEER_SECURE,
  PEER_PATH,
  PEER_PORT,
  PEER_DEBUG,
  DAI_CONTRACT_ADDRESS,
} from "../utils/constants";
import { useStore } from "../global_stores";
import { Video, StopCall } from "../components";

const ReceiverPaymentDetails = ({ perHourCost }) => {
  const minutes = useStore((state) => state.minutes);
  return (
    <div>
      call was about {minutes.toFixed(0)} minutes{" "}
      {((+minutes * 60) % 60).toFixed(0)} seconds. You have earned ~{" "}
      {costPerMinutes(perHourCost, minutes).toFixed(2)} $.
      <br /> You should receive it to your wallets in few seconds. <br />
      <br />
      Import the token in to your wallet. Contract address of the token is :{" "}
      {`${DAI_CONTRACT_ADDRESS}`}
    </div>
  );
};

export default function Receiver() {
  const showToastFunc = useStore((state) => state.showToastFunc);
  const [peerId, setPeerId] = useState("");
  const { id } = useParams();
  const [callerLink, setCallerLink] = useState("");
  const [sessionCreated, setSessionCreated] = useState(false);
  const [peerJoinedTheSession, setPeerJoinedTheSession] = useState(false);
  const [conn, setConn] = useState(null);
  const [call, setCall] = useState(null);

  const [executedOnce, setExecutedOnce] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const [myStream, setMyStream] = useState([]);
  const [callerStream, setCallerStream] = useState([]);
  const [perHourCost, setPerHourCost] = useState(0);

  const myLocalStream = useRef(null);

  const handleCallData = (message) => {
    console.log("Received message : ", message);
    switch (message.type) {
      case SESSION_MESSAGES.END_SESSION:
        setSessionCompleted(true);
        stopBothVideoAndAudio(myLocalStream.current);
        if (call !== null) {
          call.close();
          setCall(null);
        }
        break;
      case SESSION_MESSAGES.SUCCESSFULLY_ENDED_CONTRACT:
        if (call !== null) {
          call.close();
          setCall(null);
        }
        if (conn) {
          conn.close();
          setConn(null);
        }
        setPaymentDone(true);

        break;
      default:
        break;
    }
  };

  const ready = (_conn) => {
    let connection = conn;
    console.log("Conn in ready");
    if (!conn) connection = _conn;
    connection.on("data", function (data) {
      if (data) handleCallData(JSON.parse(data));
    });
    connection.on("close", function () {
      endSession();
    });
    connection.on("error", function (e) {
      console.log(
        "Error in the connection with the peer with Id : ",
        connection.peer
      );
      endSession();
    });
  };

  const endSession = () => {
    if (call) {
      call.close();
    }
    stopBothVideoAndAudio(myLocalStream.current);
    setSessionCompleted(true);
    if (conn) {
      conn.send(JSON.stringify({ type: SESSION_MESSAGES.END_SESSION }));
      setTimeout(() => {
        conn.close();
      }, 3000);
    }
  };

  useEffect(() => {
    console.log("Running!!!");

    if (!executedOnce && !sessionCreated) {
      setExecutedOnce(true);
      const sessionId = id;
      const sessionDetails = getWithExpiry(id);
      if (!sessionDetails)
        return showToastFunc(
          "Session expired! Please create another meeting link."
        );

      const _perHourCost = sessionDetails.perHourCost;
      const toAddress = sessionDetails.toAddress;
      setPerHourCost(_perHourCost);
      const peer = new Peer({
        host: PEER_HOST,
        port: PEER_PORT,
        path: PEER_PATH,
        secure: PEER_SECURE,
        debug: PEER_DEBUG,
      });
      peer.on("open", function (_id) {
        try {
          console.log({ _id });
          setPeerId(_id);
          setCallerLink(`${LLAMA_APP_URL}/caller/${sessionId}`);
          setSessionCreated(true);
          // make API call to update PeerId and ethereum address to create a session
          createSessionAPI({
            sessionId,
            toAddress,
            perHourCost: _perHourCost,
            peerId: _id,
          })
            .then((data) => {
              console.log({ data });
            })
            .catch((e) => {
              console.log("Error : ", e);
            });
        } catch (e) {
          console.log("Error : ", e);
        }
      });
      peer.on("connection", function (c) {
        console.log("c : ", c);
        // Allow only a single connection
        if (conn && conn.open) {
          c.on("open", function () {
            c.send("Already connected to another client");
            setTimeout(function () {
              c.close();
            }, 500);
          });
          return;
        }

        setConn(c);
        console.log("Connected to: " + c.peer);
        c.send(
          JSON.stringify({ type: SESSION_MESSAGES.ACKNOWLEDGE_CONNECTION })
        );
        setTimeout(() => {
          ready(c);
        }, 1000);
      });

      peer.on("disconnected", function () {
        console.log("Connection lost. Please reconnect");
        peer.id = peerId;
        peer._lastServerId = peerId;
        peer.reconnect();
      });
      peer.on("close", function () {
        setConn(null);
        console.log("Connection destroyed");
      });
      peer.on("error", function (err) {
        console.log(err);
      });

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setMyStream([...myStream, stream]);
          myLocalStream.current = stream;
          peer.on("call", function (_call) {
            setCall(call);

            _call.answer(stream);
            _call.on("stream", function (_stream) {
              setCallerStream([...callerStream, _stream]);
            });

            _call.on("close", () => {
              endSession();
            });
            _call.on("error", (e) => {
              console.log("Error : ", e);
              endSession();
            });

            setPeerJoinedTheSession(true);
          });
        })
        .catch((e) => {
          showToastFunc(
            "Could not retrieve the video and audio. Please allow permissions",
            e
          );
        });
    }
  }, []);

  return !sessionCreated ? (
    <div className="container center">Creating video session..</div>
  ) : !sessionCompleted ? (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateColumns: "50% 50%",
      }}
    >
      {!peerJoinedTheSession ? (
        <div
          className="container center"
          style={{ width: "100%", backgroundColor: "#eee" }}
        >
          <span>Waiting for the peer to join the call...</span>
          <br />
          <span>Share the link below to get started</span>
          <br />
          <div
            style={{
              borderStyle: "solid",
              borderRadius: "8px",
              borderColor: "#333",
              borderWidth: "1px",
              padding: "12px",
              display: "grid",
              gridTemplateColumns: "90% 10%",
              boxSizing: "border-box",
              width: "80%",
              marginTop: "10px",
            }}
          >
            <div style={{ fontSize: "24", textAlign: "left", margin: "0px" }}>
              <span>
                {callerLink}
                {/* {`${callerLink.substring(0, 38)}...${callerLink.substring(callerLink.length - 5, callerLink.length)}`} */}
              </span>{" "}
            </div>{" "}
            <div
              style={{ marginTop: "0px", marginBottom: "0px", margin: "0px" }}
            >
              <img
                className="clickable"
                width="18px"
                onClick={() => {
                  showToastFunc("Link copied!");
                  navigator.clipboard.writeText(callerLink);
                }}
                src={require("../static/copy.svg").default}
                alt="back"
              />
            </div>{" "}
          </div>{" "}
        </div>
      ) : (
        <div
          className="container center"
          style={{ width: "100%", backgroundColor: "#ddd" }}
        >
          {callerStream.map((s) => (
            <Video stream={s} muted={false} />
          ))}
        </div>
      )}
      <div
        className="container center"
        style={{ width: "100%", backgroundColor: "#ddd" }}
      >
        {myStream.map((s) => (
          <Video stream={s} muted={true} />
        ))}
      </div>
      {peerJoinedTheSession ? <StopCall endSession={endSession} /> : null}
    </div>
  ) : (
    <div className="container center">
      <ReceiverPaymentDetails perHourCost={perHourCost} />
    </div>
  );
}
