const Identities = require("orbit-db-identity-provider");
const OrbitDB = require("orbit-db");
const IPFS = require("ipfs");

async function main() {
  try {
    const ipfs = await IPFS.create({
      url: "http://localhost:5001",
      repo: "./ipfs",
      EXPERIMENTAL: {
        pubsub: true,
      },
    });
    // console.log({ node });
    const identityId = Math.random();
    console.log({ identityId });
    const identityOptions = { id: identityId };
    const identity = await Identities.createIdentity(identityOptions);
    console.log(identity);
    const orbitdb = await OrbitDB.createInstance(ipfs, {
      identity,
    });
    console.log({ accessId: orbitdb.identity.id });
    const options = {
      // Give write access to ourselves
      accessController: {
        write: [orbitdb.identity.id],
      },
    };
    // Create database instance
    const db = await orbitdb.keyvalue("test4", options);
    console.log({ address: db.address.toString() });
    await db.load();
    // db.events.on("ready", async () => {
    console.log("Database is now ready");
    await db.set("121432423668888", {
      test: "testing the value in the doc store",
    });

    const value1 = db.get("121432423668888");
    console.log({ value1 });
    await db.set("121432423668888", {
      test: "testing the value in the doc store",
      anotherValue: "another value",
    });
    const value2 = db.get("121432423668888");
    console.log({ value2 });
  } catch (e) {
    console.log("Error : ", e);
  }

  //Indentity
}

main();
