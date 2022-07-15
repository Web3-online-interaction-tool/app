import OrbitDB from "orbit-db";
import { create } from "ipfs";

async function loadIpfs() {
  const node = await create({
    url: "http://localhost:5001",
    repo: "./ipfs",
  });
  s;

  return node;
}

import Identities from "orbit-db-identity-provider";

async function main() {
  try {
    const node = await loadIpfs();
    // console.log({ node });
    const identityId = Math.random();
    console.log({ identityId });
    const identityOptions = { id: identityId };
    const identity = await Identities.createIdentity(identityOptions);
    console.log(identity);
    const orbitdb = await OrbitDB.createInstance(node, {
      id: "12D3KooWD3VhKCEWM9YAhPT11iHtH6yG6vWsBh6sKUR5CMWmuAUU",
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

    // await db.set("12143242366", {
    //   test: "testing the value in the doc store",
    //   anotherValue: "Another value",
    // });
    // const value3 = await db.get("12143242366");
    // console.log({ value3 });
    // });
  } catch (e) {
    console.log("Error : ", e);
  }

  //Indentity
}

main();
