import React, { useState, useRef } from "react";
import { CheckIfWalletIsConnected } from "../components/index";
import {
  setWithExpiry,
  SESSION_EXPIRY_TIME,
  INTERAKT_APP_URL,
} from "../utils/constants";
import uuid from "react-uuid";
import { useStore } from "../global_stores";

const CreateSession = ({
  setPerHourCost,
  perHourCost,
  description,
  shouldRecordAudio,
  handleAudioRecordDecisionChange,
  createSession,
  isSessionGettingCreated,
  setDescription,
}) => {
  return (
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
    </div>
  );
};

export default function Home() {
  const showToastFunc = useStore((state) => state.showToastFunc);
  const [shouldRecordAudio, setShouldRecordAudio] = React.useState(false);

  const handleAudioRecordDecisionChange = () => {
    setShouldRecordAudio(!shouldRecordAudio);
  };

  // Wallet connection states
  const [connectionStatus, setConnectionStatus] = useState(true); // false
  const [myAddress, setMyAddress] = useState(
    "0xb21805e1D5c438984D05AB8e5291f0d8DD489013"
  );
  // "0xb21805e1D5c438984D05AB8e5291f0d8DD489013"

  // States related to this client for this connection session
  const [perHourCost, setPerHourCost] = useState(0);
  const [description, setDescription] = useState("");

  const [daiBalance, setDaiBalance] = useState(0);

  const [isSessionGettingCreated, setIsSessionGettingCreated] = useState(false);
  const ceramic = useRef(null);
  const threeID = useRef(null);

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

  return (
    <div className="container center">
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
            <CreateSession
              setPerHourCost={setPerHourCost}
              perHourCost={perHourCost}
              description={description}
              shouldRecordAudio={shouldRecordAudio}
              handleAudioRecordDecisionChange={handleAudioRecordDecisionChange}
              createSession={createSession}
              setDescription={setDescription}
              isSessionGettingCreated={isSessionGettingCreated}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
