import React, { useState } from "react";
import { CheckIfWalletIsConnected } from "../components/index";
import {
  setWithExpiry,
  SESSION_EXPIRY_TIME,
  INTERAKT_APP_URL,
} from "../utils/constants";
import uuid from "react-uuid";
import { useStore } from "../global_stores";

export default function Home() {
  const showToastFunc = useStore((state) => state.showToastFunc);
  const [shouldRecordAudio, setShouldRecordAudio] = React.useState(false);

  const handleAudioRecordDecisionChange = () => {
    setShouldRecordAudio(!shouldRecordAudio);
  };

  // Wallet connection states
  const [connectionStatus, setConnectionStatus] = useState(false); // false
  const [myAddress, setMyAddress] = useState("");
  const [currentAccount, setCurrentAccount] = useState({});

  // States related to this client for this connection session
  const [perHourCost, setPerHourCost] = useState(0);

  const [daiBalance, setDaiBalance] = useState(0);

  const [isSessionGettingCreated, setIsSessionGettingCreated] = useState(false);

  const createSession = async () => {
    if (+perHourCost > 100)
      return showToastFunc("You can charge maximum of 100$");
    if (+perHourCost < 1) return showToastFunc("You can charge minimum of 1$");
    const sessionId = uuid();
    setWithExpiry(
      sessionId,
      {
        perHourCost,
        createdAt: Date.now(),
        toAddress: myAddress,
        recordAudio: shouldRecordAudio,
      },
      SESSION_EXPIRY_TIME
    );
    setIsSessionGettingCreated(true);
    window.open(`${INTERAKT_APP_URL}/receiver/${sessionId}`, "_self");
  };

  return (
    <div className="container center">
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
          <div>
            <span>
              Your DAI balance: <b>{daiBalance.toFixed(2)} </b> USD
            </span>
            <br />
            <br />
            <br />
            <br />
            <br />

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
        ) : null}
      </div>
    </div>
  );
}
