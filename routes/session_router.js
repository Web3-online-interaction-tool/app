const express = require("express");
const router = express.Router();
const { sessionDbInstance } = require("../db/connect_to_db");
const { check, validationResult } = require("express-validator");
const CustomError = require("../exceptions/custom_error");

router.post(
  "/",
  [
    check("toAddress")
      .isString()
      .isLength({ min: 3, max: 400 })
      .withMessage("Invalid toAddress"),
    check("sessionId")
      .isString()
      .isLength({ min: 3, max: 400 })
      .withMessage("Invalid sessionId"),
    // TODO validate for the ethereum address specific
    check("peerId")
      .isString()
      .isLength({ min: 3, max: 400 })
      .withMessage("Invalid peerId"),
    check("perHourCost").isInt().withMessage("Invalid perHourCost"),
  ],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return next(
          new CustomError("Invalid fields", 400, "00002", errors.array())
        );
      }
      const { toAddress, sessionId, peerId, perHourCost } = request.body;
      const session = await sessionDbInstance.get(sessionId);
      if (session.length > 0) {
        const sessionDetails = session[0];
        // await Session.findOneAndUpdate({ sessionId }, { peerId });
        sessionDetails = { ...sessionDetails, peerId };
        // return response.status(200).send({});
      }
      const newSession = new Session({
        toAddress,
        sessionId,
        peerId,
        perHourCost,
      });
      await newSession.save();
      response.status(201).send({});
    } catch (error) {
      console.log({ error });
      response.status(500).send({
        result: 0,
        message: "Something went wrong",
        payload: { error },
      });
    }
  }
);

router.get("/:sessionId", async (request, response) => {
  try {
    const { sessionId } = request.params;
    const sessionDetails = await Session.findOne({
      sessionId,
    });

    if (!sessionDetails)
      return response
        .status(409)
        .send({ message: "Session expired or invalid" });
    const { toAddress, peerId, perHourCost, fromAddress } = sessionDetails;

    response
      .status(200)
      .send({ sessionId, toAddress, peerId, perHourCost, fromAddress });
  } catch (error) {
    console.log("Error : ", error);
    response.status(500).send({
      result: 0,
      message: "Something went wrong",
      payload: { error },
    });
  }
});
// update the from Address and the duration in seconds

router.put("/", async (request, response) => {
  try {
    const { sessionId, fromAddress } = request.body;
    await Session.findOneAndUpdate(
      {
        sessionId,
      },
      { fromAddress }
    );
    response.status(200).send({});
  } catch (error) {
    console.log("Error : ", error);
    response.status(500).send({
      result: 0,
      message: "Something went wrong",
      payload: { error },
    });
  }
});

// router.put("/upload", async (request, response) => {
//   try {
//     const { sessionId, fromAddress, durationInSeconds } = request.body;
//     await Session.findOneAndUpdate(
//       {
//         sessionId,
//       },
//       { fromAddress, durationInSeconds }
//     );
//     response.status(200).send({});
//   } catch (error) {
//     console.log("Error : ", error);
//     response.status(500).send({
//       result: 0,
//       message: "Something went wrong",
//       payload: { error },
//     });
//   }
// });
module.exports = router;
