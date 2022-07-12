// const IPFS = require("ipfs");
const OrbitDB = require("orbit-db");

// async function main() {
//   try {
//     // Create IPFS instance
//     // const ipfsOptions = { repo: "./ipfs" };
//     // const ipfs = await IPFS.create(ipfsOptions);
//     // // Create OrbitDB instance
//     // const orbitdb = await OrbitDB.createInstance(ipfs);
//     // // Create database instance
//     // const db = await orbitdb.keyvalue("first-database");
//   } catch (e) {
//     console.log("Error : ", e);
//   }
// }
// main();

async function loadIpfs() {
  const { create } = await import("ipfs");

  const node = await create({
    url: "http://localhost:5001",
    repo: "./ipfs",
  });

  return node;
}

async function main() {
  const node = await loadIpfs();
  // console.log({ node });
  const id = await node.id();
  console.log({ id: id?.id?.PeerId });

  const orbitdb = await OrbitDB.createInstance(node, {
    id: "12D3KooWD3VhKCEWM9YAhPT11iHtH6yG6vWsBh6sKUR5CMWmuAUU",
  });
  const options = {
    // Give write access to ourselves
    accessController: {
      write: [orbitdb.identity.id],
    },
  };
  // Create database instance
  const db = await orbitdb.keyvalue("first-database", options);
  console.log({ address: db.address });
  const identity = db.identity;
  console.log(identity.toJSON());

  const db2 = await orbitdb.keyvalue(db.address.toString());
  console.log({ address: db2.address });
}

main();
