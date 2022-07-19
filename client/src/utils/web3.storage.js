import { Web3Storage } from "web3.storage";
import { WEB_STORAGE_TOKEN } from "./constants";

const client = new Web3Storage({ token: WEB_STORAGE_TOKEN });

export const storeFile = async (blob, fineName, address) => {
  const _files = [new File(blob, "hello.mp3")];
  console.log({ _files });
  const rootCid = await client.put(_files, {
    name: "testet123436576",
    maxRetries: 3,
  });
  return rootCid;
};

export const getFile = async (rootCid) => {
  const res = await client.get(rootCid); // Web3Response
  const files = await res.files(); // Web3File[]
  return files;
};
