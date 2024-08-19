/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {onRequest, onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const helloOnCall = onCall(async (req) => {
  logger.info(`helloOnCall start: req.data=${JSON.stringify(req.data)}`);
  const db = getFirestore();
  const docRef = db.doc("test/counter");
  const count = ((await docRef.get()).get("count") ?? 0) + 1;
  await docRef.set({count});
  return {echoBack: req.data.msg, count};
});
