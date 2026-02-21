import admin from "firebase-admin";
import fs from "fs";

// In production (Render): reads from FIREBASE_SERVICE_ACCOUNT env variable
// In local dev: reads from firebase-service-account.json file
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    serviceAccount = JSON.parse(
        fs.readFileSync("./firebase-service-account.json", "utf8")
    );
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const db = admin.firestore();
export default admin;
