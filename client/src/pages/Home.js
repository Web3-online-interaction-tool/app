import React, { useState, useRef, useEffect } from "react";
import { CheckIfWalletIsConnected, Popup, load } from "../components/index";
import {
  setWithExpiry,
  SESSION_EXPIRY_TIME,
  INTERAKT_APP_URL,
} from "../utils/constants";
import uuid from "react-uuid";
import { useStore } from "../global_stores";
import { IDX } from "@ceramicstudio/idx";
import config from "./config";

const CreateSession = ({
  setPerHourCost,
  perHourCost,
  description,
  shouldRecordAudio,
  handleAudioRecordDecisionChange,
  createSession,
  isSessionGettingCreated,
  setDescription,
  setShowCreateSession,
}) => {
  return (
    <Popup>
      <div>
        {" "}
        <label>
          How much do you wish to get paid for 1 hour of your time in USD?
        </label>
        <br />
        <br />
        <input
          type="number"
          placeholder="amount in USD"
          onChange={(e) => setPerHourCost(e.target.value)}
          value={perHourCost}
        />
        <br />
        <br />
        <input
          type="text"
          placeholder="Short description of the session"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
        />
        <br />
        <br />
        <label>
          <input
            type="checkbox"
            checked={shouldRecordAudio}
            onChange={handleAudioRecordDecisionChange}
          />{" "}
          Record the audio
        </label>
        <br />
        <br />
        <button
          onClick={createSession}
          disabled={isSessionGettingCreated ? true : false}
        >
          {isSessionGettingCreated
            ? "Creating meeting..."
            : "Create an instant meeting"}
        </button>
        <br />
        <span
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => {
            setShowCreateSession(false);
          }}
        >
          <br />
          close
        </span>
      </div>
    </Popup>
  );
};

const Session = ({ session, ceramic }) => {
  const [date, setDate] = useState("");
  const [streamId, setStreamId] = useState(0);
  const [sessionDetails, setSessionDetails] = useState({});
  const [fetchingDetailedSession, setFetchingDetailedSession] = useState(true);

  const fetchSessionDetails = async () => {
    setStreamId(session.id.split("/")[2]);
    console.log(session.id.split("/")[2]);
    const data = await load(ceramic, session.id.split("/")[2]);
    console.log(data.content);
    setSessionDetails(data.content);
    //  eslint-disable-next-line no-undef
    setDate(dayjs(+data.content.date).format("DD/MM/YYYY HH:mm"));
    setFetchingDetailedSession(false);
  };
  useEffect(() => {
    fetchSessionDetails();
  }, []);
  return (
    <div className="session-container">
      <div className="session-header">
        <div style={{ width: "100%", textAlign: "left" }}>
          {session.description}
        </div>
        <div style={{ width: "100%", textAlign: "left" }}>
          <span
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => {
              window.open(`${INTERAKT_APP_URL}/session/${streamId}`, "_blank");
            }}
          >
            See more details
          </span>
        </div>
      </div>
      <div className="session-body">
        {!fetchingDetailedSession ? (
          <div style={{ width: "100%", textAlign: "left", padding: "10px" }}>
            <span>
              With :{" "}
              <b>
                {`${sessionDetails.receiver.substring(
                  0,
                  15
                )}...${sessionDetails.receiver.substring(
                  sessionDetails.receiver.length - 5,
                  sessionDetails.receiver.length
                )}`}
              </b>
            </span>
            <br />
            <br />
            <span>
              On : <b>{date}</b>
            </span>
          </div>
        ) : (
          <div>
            <span>Fetching more details...</span>
          </div>
        )}
      </div>
    </div>
  );
};

const PreviousRecording = ({ previousSessions, ceramic }) => {
  return (
    <div className="inner-container center">
      {previousSessions.length > 0 ? (
        <div>
          {previousSessions.map((session) => (
            <Session key={session.id} session={session} ceramic={ceramic} />
          ))}
        </div>
      ) : (
        <span>No sessions to display.</span>
      )}
    </div>
  );
};

export default function Home() {
  const showToastFunc = useStore((state) => state.showToastFunc);
  const [shouldRecordAudio, setShouldRecordAudio] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [previousSessions, setPreviousSessions] = useState([]);
  const handleAudioRecordDecisionChange = () => {
    setShouldRecordAudio(!shouldRecordAudio);
  };

  // Wallet connection states
  const [connectionStatus, setConnectionStatus] = useState(false); // false
  const [myAddress, setMyAddress] = useState("");
  // "0xb21805e1D5c438984D05AB8e5291f0d8DD489013"

  // States related to this client for this connection session
  const [perHourCost, setPerHourCost] = useState(0);
  const [description, setDescription] = useState("");

  const [daiBalance, setDaiBalance] = useState(0);

  const [isSessionGettingCreated, setIsSessionGettingCreated] = useState(false);
  const ceramic = useRef(null);
  const threeID = useRef(null);
  const [acknowledgedConnection, setAcknowledgedConnection] = useState(false);

  const [fetchingSessions, setFetchingSessions] = useState(true);

  const createSession = async () => {
    if (+perHourCost > 100)
      return showToastFunc("You can charge maximum of 100$");
    if (+perHourCost < 1) return showToastFunc("You can charge minimum of 1$");

    if (!description || description.length === 0)
      return showToastFunc("Please provide some description");
    const sessionId = uuid();
    setWithExpiry(
      sessionId,
      {
        perHourCost,
        createdAt: Date.now(),
        toAddress: myAddress,
        recordAudio: shouldRecordAudio,
        description,
      },
      SESSION_EXPIRY_TIME
    );
    setIsSessionGettingCreated(true);
    window.open(`${INTERAKT_APP_URL}/receiver/${sessionId}`, "_self");
  };

  const fetchAllSessions = async () => {
    const idx = new IDX({
      ceramic: ceramic.current,
      aliases: config.definitions,
    });
    const sessions = await idx.get("interaktProfile");
    console.log({ sessions });
    const _sessions = sessions?.sessions || [];
    setPreviousSessions(_sessions);
    setFetchingSessions(false);
  };
  useEffect(() => {
    if (connectionStatus === true && !acknowledgedConnection) {
      setAcknowledgedConnection(true);
      fetchAllSessions();
    }
  }, [connectionStatus]);

  return (
    <div className="main-container center">
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
          <div>
            <span>
              Your DAI balance: <b>{daiBalance.toFixed(2)} </b> USD
            </span>
            <br />
            <br />
            <button
              onClick={() => {
                setShowCreateSession(true);
              }}
            >
              Create an interaktion
            </button>
            <br /> <br />
            <span>Previous Interaktions : </span>
            <br /> <br />
            {showCreateSession ? (
              <CreateSession
                setPerHourCost={setPerHourCost}
                perHourCost={perHourCost}
                description={description}
                shouldRecordAudio={shouldRecordAudio}
                handleAudioRecordDecisionChange={
                  handleAudioRecordDecisionChange
                }
                createSession={createSession}
                setDescription={setDescription}
                isSessionGettingCreated={isSessionGettingCreated}
                setShowCreateSession={setShowCreateSession}
              />
            ) : null}
            {!fetchingSessions ? (
              <PreviousRecording
                previousSessions={previousSessions}
                ceramic={ceramic}
              />
            ) : (
              <div>
                <span>Fetching the previous sessions...</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
