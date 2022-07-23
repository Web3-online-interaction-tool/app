import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { CheckIfWalletIsConnected, load } from "../components/index";
import { fetchFile } from "../utils/web3.storage";
import { StringToUnit8Array } from "../utils/constants";
import LitJsSdk from "lit-js-sdk";
import { useStore } from "../global_stores";

const fetchingStateConstants = {
  FETCH_DETAILS_CERAMIC: {
    name: "FETCH_DETAILS_CERAMIC",
    text: "Fetching session details from ceramic Title Document...",
  },
  FETCH_BLOB_WEB_STORAGE: {
    name: "FETCH_BLOB_WEB_STORAGE",
    text: "Fetching encrypted file stored in IPFS using web3.storage",
  },
  DECRYPT_FILE: {
    name: "DECRYPT_FILE",
    text: "Decrypting the fetched encrypted file",
  },
  COMPLETED: {
    name: "COMPLETED",
    text: "COMPLETED",
  },
};

function Profile() {
  const { streamId } = useParams();
  const [session, setSession] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [myAddress, setMyAddress] = useState("");
  const ceramic = useRef(null);
  const threeID = useRef(null);
  const audioElementRef = useRef(null);
  const [daiBalance, setDaiBalance] = useState(0);
  const [audioURL, setAudioURL] = useState("");
  const [fetchingState, setFetchingData] = useState(
    fetchingStateConstants.FETCH_DETAILS_CERAMIC.name
  );
  const showToastFunc = useStore((state) => state.showToastFunc);
  const [errorInFetching, setErrorInFetching] = useState(false);
  const [acknowledgedConnection, setAcknowledgedConnection] = useState(false);
  const [date, setDate] = useState("");

  const fetchData = async () => {
    try {
      const data = await load(ceramic, streamId);
      setFetchingData(fetchingStateConstants.FETCH_BLOB_WEB_STORAGE.name);
      console.log({ data: data.content });
      setSession(data.content);
      const {
        date,
        // description,
        // receiver,
        // moneyPaid,
        // totalTimeInMin,
        fileLink,
        // access,
        mimeType,
        encSecret,
      } = data.content;
      //  eslint-disable-next-line no-undef
      setDate(dayjs(+date).format("DD/MM/YYYY HH:mm"));
      const encryptedBlob = await fetchFile(fileLink);
      setFetchingData(fetchingStateConstants.DECRYPT_FILE.name);
      const decryptedFile = await LitJsSdk.decryptFile({
        file: encryptedBlob,
        symmetricKey: StringToUnit8Array(encSecret),
      });

      const blob = new Blob([decryptedFile], {
        type: mimeType,
      });
      const audioURL = URL.createObjectURL(blob);
      setAudioURL(audioURL);
      // audioElementRef.current.src = audioURL;
      setFetchingData(fetchingStateConstants.COMPLETED.name);
    } catch (e) {
      console.log("Error : ", e);
      setFetchingData(fetchingStateConstants.COMPLETED.name);
      setErrorInFetching(false);
      showToastFunc("Error in fetching the data! Please try again later");
    }
  };

  useEffect(() => {
    if (connectionStatus === true && !acknowledgedConnection) {
      setAcknowledgedConnection(true);
      fetchData();
    }
  }, [connectionStatus]);

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
      {connectionStatus === true ? (
        <div className="container center">
          {fetchingState !== fetchingStateConstants.COMPLETED.name ? (
            <div className="container center">
              <span>{fetchingStateConstants[fetchingState].text}</span>
            </div>
          ) : !errorInFetching ? (
            <div
              style={{
                boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
                height: "400px",
                width: "650px",
              }}
              className="container center"
            >
              <span>Description : {session.description}</span>
              <br />

              <span>Paid : {session.moneyPaid}$</span>
              <br />

              <span>Total number of minutes : {session.totalTimeInMin}</span>
              <br />

              <span>date : {date}</span>
              <br />
              <span>Recording : </span>
              <br />
              <audio controls={true} src={audioURL}></audio>
            </div>
          ) : (
            <div className="container center">
              <span>Please try again later. Error in fetching the file</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default Profile;
