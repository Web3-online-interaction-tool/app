# POC-planning-

This repo is to build POC and planning

- Test out the the following
  - WebRCT test  DONE
  - Streaming contract ( sablier.finance or superfluid )  DONE
  - Media recorder
  - IPFS stoe using web.storage
  - Test orbit DB  
  - test authentication store on the IPFS.

Build :

1. make simple video chat using Peerjs
2. Attach payments using streaming contract to the webRTC
3. Add recorder
4. Save the recording file on IPFS NFT gated ( TO do decided exact architechtutre )

References :

WebRTC :

https://peerjs.com/docs/#start
https://peerjs.com/docs/#api
https://github.com/jmcker/Peer-to-Peer-Cue-System

StreamContract : 


Decided to use ceramic network for user to upload his/her own data


https://developers.ceramic.network


Using ceramic to store the data on IPFS

https://blog.ceramic.network/how-to-store-signed-and-encrypted-data-on-ipfs/


NFT storage to mint NFT 

https://nft.storage/docs/how-to/mint-erc-1155/#minting-your-nft

https://support.nftify.network/hc/en-us/articles/4409618795417-Metadata-Standards
https://docs.opensea.io/docs/metadata-standards



Steps to store the recorded data : 

1) Create a blob out of the the data
2) store the item in IPFS using web3.storage
3) using ceramic store the cid in the user's profile document



When user visits the recording page,

1) retrieve the profile details from ceramic
2) get the cid file using web3 storage
3) Show option to mint NFT
4) We would have NFT contract deployed on ploygon
5) When users mints NFT use NFT.storage, the file will be fetched from CID of the file
