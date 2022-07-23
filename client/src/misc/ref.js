import React, { useEffect, useState } from "react";
import LitJsSdk from "lit-js-sdk";
import { storeFile, fetchFile, getFile } from "../utils/web3.storage.js";
import { run } from "./create_Scheme";

export default function TestEncNDec() {
  const [encData, setEncData] = useState("");
  const [decData, setDecData] = useState("");
  const [symmetricKey_, setSymmetricKey] = useState("");
  const data = "This is my laptop";

  const unit8ArrayToString = (unit8Array) => {
    let arr = Array.from // if available
      ? Array.from(unit8Array) // use Array#from
      : [].map.call(unit8Array, (v) => v); // otherwise map()
    return JSON.stringify(arr);
  };

  const StringToUnit8Array = (_string) => {
    return new Uint8Array(JSON.parse(_string));
  };

  const encryptData = async () => {
    // create a audio blob
    var textFile = new Blob(["Testing encryption"], {
      type: "text/plain;charset=utf-8",
    });
    console.log({ textFile });

    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({
      file: textFile,
    });
    console.log({ encryptedFile });

    const cid = await storeFile([encryptedFile], "test_encrypted_data");
    console.log({ cid });
    setEncData(cid);
    setSymmetricKey(unit8ArrayToString(symmetricKey));
  };

  // string and buffer
  const decryptData = async () => {
    try {
      // Reconstructing the original object outputed by encryption
      const file = await getFile(encData);
      console.log({ file, fileData: JSON.stringify(file) });
      const data = await fetchFile(
        `https://ipfs.io/ipfs/${encData}/test_encrypted_data`
      );

      console.log({ data });
      const decryptedFile = await LitJsSdk.decryptFile({
        file: data,
        symmetricKey: StringToUnit8Array(symmetricKey_),
      });
      console.log(decryptedFile);

      const blob = new Blob([decryptedFile], {
        type: "text/plain;charset=utf-8",
      });
      const audioURL = URL.createObjectURL(blob);
      setDecData(audioURL);
    } catch (e) {
      console.log("Error : ", e);
    }
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <div>
      <span>Data : {data}</span>
      <br />
      <button
        onClick={() => {
          encryptData();
        }}
      >
        {" "}
        encrypt
      </button>
      <br />
      <span>Encryption key data : {symmetricKey_}</span>
      <br />
      <button
        onClick={() => {
          decryptData(encData);
        }}
      >
        Decrypt
      </button>
      <br />
      <a href={decData}>{decData}</a>
    </div>
  );
}
