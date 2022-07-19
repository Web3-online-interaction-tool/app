const Identities = require("orbit-db-identity-provider");
const OrbitDB = require("orbit-db");

/**
 * Can not use require in the new version of IPFS.
 * Expects the local instance IPFS daemon running
 */
const loadIpfs = async () => {
  try {
    const { create } = await import("ipfs");
    node = await create({
      url: "http://localhost:5001",
      repo: "./ipfs",
    });
    return node;
  } catch (e) {
    console.log("Looking the IPFS node is not running. Error : ", e);
    throw e;
  }
};
// global because, we want to create only one instance per server and will not want it to be garbage collected
let node, orbitDB;

/**
 * Generates a Identity from the identity ID  which provides access to the database
 */
const generateId = async () => {
  if (!process.env.IDENTITY_ID) {
    console.debug("IDENTITY_ID env variable not set ");
    process.exit(1);
  }
  const options = { id: process.env.IDENTITY_ID };
  const identity = await Identities.createIdentity(options);
  return identity;
};

/**
 * generates the identity and creates a orbit db instance
 *
 */
const createOrbitDbInstance = async () => {
  try {
    node = await loadIpfs();
    // passing the node ID explicitly in the options as node.id() does not return id-string in its promise.
    /*if (!process.env.IPFS_NODE_ID) {
      const nodeId = await node.id();
      console.debug("IPFS_NODE_ID env variable not set ", nodeId);
      process.exit(1);
    }*/
    const identityId = await generateId();
    orbitDB = await OrbitDB.createInstance(node, {
      identity: identityId,
    });
  } catch (e) {
    console.log("Error in creating orbit db instance : ", e);
  }
};

/**
 * return session Db Instance
 *
 */
const sessionDbInstance = async () => {
  try {
    // if the orbitDb instance is not created create one
    if (!orbitDB) await createOrbitDbInstance();

    let db;
    if (!process.env.DB_ADDRESS) {
      console.log("Creating a new session db");
      const options = {
        // Give write access to ourselves
        accessController: {
          write: [orbitDB.identity.id],
        },
      };
      db = await orbitDB.keyvalue("session", options);
      process.env.DB_ADDRESS = db.address.toString();
      console.log("Address of the new db created : ", process.env.DB_ADDRESS);
    } else db = await orbitDB.keyvalue(process.env.DB_ADDRESS);
    await db.load();
    return db;
  } catch (e) {
    console.log("Error in getting session db instance. Error : ", e);
    throw e;
  }
};

module.exports = {
  sessionDbInstance,
  createOrbitDbInstance,
};
