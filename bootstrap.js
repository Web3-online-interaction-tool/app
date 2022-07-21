const fs = require("fs");
import Ceramic from "@ceramicnetwork/http-client";
import { createDefinition, publishSchema } from "@ceramicstudio/idx-tools";
import { Ed25519Provider } from "key-did-provider-ed25519";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import KeyDidResolver from "key-did-resolver";
import { Resolver } from "did-resolver";
import { DID } from "dids";
import fromString from "uint8arrays/from-string";

const CERAMIC_URL = "https://gateway-clay.ceramic.network";

const NoteSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Interakt-session",
  type: "object",
  properties: {
    date: {
      type: "string",
      format: "date-time",
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
      maxLength: "5",
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
};

const NotesListSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Interakt-profile",
  type: "object",
  properties: {
    sessions: {
      type: "array",
      title: "sessions",
      items: {
        type: "object",
        title: "sessionItem",
        properties: {
          id: {
            $ref: "#/definitions/CeramicStreamId",
          },
          sessionStreamId: {
            type: "string",
            title: "sessionStreamId",
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

async function run() {
  // The seed must be provided as an environment variable
  const seed = fromString(process.env.SEED, "base16");
  // Connect to the local Ceramic node
  const ceramic = new Ceramic(CERAMIC_URL);
  // Provide the DID Resolver and Provider to Ceramic
  const resolver = new Resolver({
    ...KeyDidResolver.getResolver(),
    ...ThreeIdResolver.getResolver(ceramic),
  });
  const provider = new Ed25519Provider(seed);
  const did = new DID({ provider, resolver });
  await ceramic.setDID(did);
  // Authenticate the Ceramic instance with the provider
  await ceramic.did.authenticate();

  // Publish the two schemas
  const [noteSchema, notesListSchema] = await Promise.all([
    publishSchema(ceramic, { content: NoteSchema }),
    publishSchema(ceramic, { content: NotesListSchema }),
  ]);

  // Create the definition using the created schema ID
  const notesDefinition = await createDefinition(ceramic, {
    name: "notes",
    description: "Simple text notes",
    schema: notesListSchema.commitId.toUrl(),
  });

  // Write config to JSON file
  const config = {
    definitions: {
      notes: notesDefinition.id.toString(),
    },
    schemas: {
      Note: noteSchema.commitId.toUrl(),
      NotesList: notesListSchema.commitId.toUrl(),
    },
  };
  await fs.writeFileSync(".client/src/config.json", JSON.stringify(config));

  console.log("Config written to src/config.json file:", config);
  process.exit(0);
}

run().catch(console.error);
