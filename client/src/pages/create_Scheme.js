import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { DID } from "dids";
import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import { createDefinition, publishSchema } from "@ceramicstudio/idx-tools";
import { IDX } from "@ceramicstudio/idx";

async function createSchemaDocument(ceramic, schema) {
  // The following call will fail if the Ceramic instance does not have an authenticated DID
  const doc = await TileDocument.create(ceramic, schema);
  // The stream ID of the created document can then be accessed as the `id` property
  return doc.commitId;
}

// `seed` must be a 32-byte long Uint8Array
async function authenticateWithEthereum(ethereumProvider) {
  try {
    let ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com");
    let threeID = new ThreeIdConnect();
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
    await threeID.connect(authProvider);

    const did = new DID({
      // Get the DID provider from the 3ID Connect instance
      provider: threeID.getDidProvider(),
      resolver: {
        ...get3IDResolver(ceramic),
        ...getKeyResolver(),
      },
    });
    // Authenticate the DID using the 3ID provider
    await did.authenticate();
    ceramic.did = did;
    return ceramic;
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
    encSecret: {
      type: "string",
      title: "encSecret",
    },
    mimeType: {
      type: "string",
      title: "mimeType",
    },
    publicURL: {
      type: "string",
      title: "publicURL",
    },
    nft: {
      title: "nft",
      type: "object",
      properties: {
        contract: {
          type: "string",
          title: "contract",
        },
        itemId: {
          type: "string",
          title: "itemId",
        },
      },
    },
  },
  required: ["fileLink"],
};

export const run = async () => {
  const ceramic = await authenticateWithEthereum(window.ethereum);
  const sessionSchemaId = await createSchemaDocument(
    ceramic,
    InteractSessionSchema
  );
  console.log({ sessionSchemaId: sessionSchemaId.toString() });
  // const profileSchema = await publishSchema(ceramic, {
  //   content: InteractProfileSchema,
  // });

  // const sessionsDefinition = await createDefinition(ceramic.current, {
  //   name: "sessions",
  //   description: "Interakt session",
  //   schema: profileSchema.commitId.toUrl(),
  // });

  // const config = {
  //   definitions: {
  //     interaktProfile: sessionsDefinition.id.toString(),
  //   },
  //   schemas: {
  //     profile: profileSchema.commitId.toUrl(),
  //   },
  // };
};
