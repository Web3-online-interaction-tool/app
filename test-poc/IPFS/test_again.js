const IPFS = require("ipfs");
const OrbitDB = require("orbit-db");

(async function () {
  const ipfs = await IPFS.create({
    url: "http://localhost:5001",
    repo: "./ipfs",
  });
  const orbitdb = await OrbitDB.createInstance(ipfs);

  // Create / Open a database
  const db = await orbitdb.log("hello");
  await db.load();

  // Listen for updates from peers
  db.events.on("replicated", (address) => {
    console.log(db.iterator({ limit: -1 }).collect());
  });

  // Add an entry
  const hash = await db.add("world");
  console.log(hash);

  // Query
  const result = db.iterator({ limit: -1 }).collect();
  console.log(JSON.stringify(result, null, 2));
})();
