import { Web3Storage } from "web3.storage";
import { WEB_STORAGE_TOKEN } from "./constants";

const client = new Web3Storage({ token: WEB_STORAGE_TOKEN });

export const storeFile = async (blob, fineName) => {
  try {
    const _files = [new File(blob, fineName)];
    console.log({ _files });
    const rootCid = await client.put(_files, {
      name: fineName,
      maxRetries: 3,
    });
    return rootCid;
  } catch (e) {
    console.log({ e });
  }
};

export const getFile = async (rootCid) => {
  const res = await client.get(rootCid); // Web3Response
  const files = await res.files(); // Web3File[]
  return files;
};
