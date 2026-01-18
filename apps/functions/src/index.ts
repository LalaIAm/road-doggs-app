/**
 * Firebase Cloud Functions - Auth Export & Deletion
 * Main entry point for HTTP-triggered functions
 */

import "./config"; // Initialize Firebase Admin
import * as functions from "firebase-functions";
import express from "express";
import { exportStart, exportStatus } from "./handlers/exportHandler";
import { deleteStart, deleteStatus } from "./handlers/deleteHandler";

// Create Express app for routing
const app = express();
app.use(express.json());

// Export endpoints
app.post("/v1/auth/export/start", exportStart);
app.get("/v1/auth/export/:jobId/status", exportStatus);

// Deletion endpoints
app.post("/v1/auth/delete/start", deleteStart);
app.get("/v1/auth/delete/:jobId/status", deleteStatus);

// Export as single HTTP function
export const authFunctions = functions
  .region("us-central1")
  .runWith({
    timeoutSeconds: 540,
    memory: "1GB",
  })
  .https.onRequest(app);

// Firestore triggers
export { onTripDelete } from "./triggers/firestore/onTripDelete";

// HTTP triggers
export { fetchAiRecommendations } from "./triggers/http/fetchAiRecommendations";
export { generateShareLink } from "./triggers/http/generateShareLink";
