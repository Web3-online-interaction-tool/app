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

export const fetchFile =  (url) =>{
  return new Promise((resolve,reject)=>{
    fetch(url)
    // fetch() returns a promise. When we have received a response from the server,
    // the promise's `then()` handler is called with the response.
    .then(response => {
      // Our handler throws an error if the request did not succeed.
     
      // Otherwise (if the response succeeded), our handler fetches the response
      // as text by calling response.text(), and immediately returns the promise
      // returned by `response.text()`.
      console.log({response})
      return response.blob()
    })
    // When response.text() has succeeded, the `then()` handler is called with
    // the text, and we copy it into the `poemDisplay` box.
    .then( blob =>resolve(blob) )
    // Catch any errors that might happen, and display a message
    // in the `poemDisplay` box.
    .catch( error => console.log(`Could not fetch verse: ${error}`));
  })
}
