import React, { useRef, useState, useEffect } from "react";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { DID } from "dids";
import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import { IDX } from "@ceramicstudio/idx";
import config from "./config";
import { CERAMIC_SESSION_SCHEMA_ID } from "../utils/constants";
export default function Test_storage() {
  const ceramic = useRef(null);
  const threeID = useRef(null);

  // `seed` must be a 32-byte long Uint8Array
  async function authenticateWithEthereum(ethereumProvider) {
    try {
      // Request accounts from the Ethereum provider
      const accounts = await ethereumProvider.request({
        method: "eth_requestAccounts",
      });
      // Create an EthereumAuthProvider using the Ethereum provider and requested account
      const authProvider = new EthereumAuthProvider(
        ethereumProvider,
        accounts[0]
      );
      // Connect the created EthereumAuthProvider to the 3ID Connect instance so it can be used to
      // generate the authentication secret
      await threeID.current.connect(authProvider);

      const did = new DID({
        // Get the DID provider from the 3ID Connect instance
        provider: threeID.current.getDidProvider(),
        resolver: {
          ...get3IDResolver(ceramic.current),
          ...getKeyResolver(),
        },
      });
      // Authenticate the DID using the 3ID provider
      await did.authenticate();
      ceramic.current.did = did;
    } catch (e) {
      console.log("Error : ", e);
    }
  }

  const InteractProfileSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "interaktProfile",
    type: "object",
    properties: {
      sessions: {
        type: "array",
        title: "sessions",
        items: {
          type: "object",
          title: "session",
          properties: {
            id: {
              $ref: "#/definitions/CeramicStreamId",
            },
            description: {
              type: "string",
              title: "description",
              maxLength: 500,
            },
          },
        },
      },
    },
    definitions: {
      CeramicStreamId: {
        type: "string",
        pattern: "^ceramic://.+(\\\\?version=.+)?",
        maxLength: 150,
      },
    },
  };

  const InteractSessionSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "interakt-session",
    type: "object",
    properties: {
      date: {
        type: "string",
        title: "date",
        maxLength: 30,
      },
      description: {
        type: "string",
        title: "description",
        maxLength: 4000,
      },
      receiver: {
        type: "string",
        title: "receiver",
        maxLength: 500,
      },
      moneyPaid: {
        type: "string",
        title: "Money paid",
        maxLength: 500,
      },
      totalTimeInMin: {
        type: "string",
        title: "total Time In Min",
        maxLength: 5,
      },
      fileLink: {
        type: "string",
        title: "File",
      },
      access: {
        type: "string",
        title: "access",
      },
    },
    required: ["fileLink"],
  };

  async function createSchemaDocument(schema) {
    // The following call will fail if the Ceramic instance does not have an authenticated DID
    const doc = await TileDocument.create(ceramic.current, schema);
    // The stream ID of the created document can then be accessed as the `id` property
    return doc.commitId;
  }

  async function load(id) {
    try {
      return await TileDocument.load(ceramic.current, id);
    } catch (e) {
      console.log("Error : ", e);
    }
  }

  async function createDocument(content, schema) {
    try {
      // The following call will fail if the Ceramic instance does not have an authenticated DID
      const doc = await TileDocument.create(ceramic.current, content, {
        schema,
      });
      // The stream ID of the created document can then be accessed as the `id` property
      return doc.id;
    } catch (e) {
      console.log("Error : ", e);
    }
  }

  useEffect(() => {
    ceramic.current = new CeramicClient("https://ceramic-clay.3boxlabs.com");
    threeID.current = new ThreeIdConnect();
    if (window.ethereum == null) {
      throw new Error("No injected Ethereum provider");
    }
    authenticateWithEthereum(window.ethereum)
      .then(() => {
        console.log("Authenticated");

        createDocument(
          {
            date: Date.now().toString(),
            description: "Testing the storage",
            receiver: "0xb21805e1D5c438984D05AB8e5291f0d8DD489013",
            moneyPaid: "234",
            totalTimeInMin: "3423",
            fileLink: "https://ipfs/ipfs/dsfsgsg",
            access: "private",
          },
          CERAMIC_SESSION_SCHEMA_ID
        )
          .then((_id) => {
            console.log("Stream id after storing : ", _id);
            console.log("Now trying to load the document");
            load(_id)
              .then(async (data) => {
                console.log("Loaded data : ", data.content);

                const idx = new IDX({
                  ceramic: ceramic.current,
                  aliases: config.definitions,
                });

                console.log({ idx });

                // Load the existing notes
                const sessions = await idx.get("interaktProfile");
                console.log({ sessions });
                const _sessions = sessions?.sessions || [];

                await idx.set("interaktProfile", {
                  sessions: [
                    {
                      id: _id.toUrl(),
                      description: data.content.description,
                    },
                    ..._sessions,
                  ],
                });
                const profile2 = await idx.get("interaktProfile");
                console.log({ profile2 });
              })
              .catch((e) => {
                console.log("Error in loading document : ", e);
              });
          })
          .catch((e) => {
            console.log("Error in creating document");
          });
      })
      .catch((e) => {
        console.log("Error in authenticating");
      });
  }, []);

  return <div>Test_storage</div>;
}
