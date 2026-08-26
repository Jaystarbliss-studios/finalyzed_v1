import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { cert } from "firebase-admin/app";

let firebaseAdminApp: admin.app.App | null = null;

function getFirebaseAdmin() {
  if (firebaseAdminApp) return firebaseAdminApp;

  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountStr) {
    console.warn("FIREBASE_SERVICE_ACCOUNT is missing. Protected backend operations are unavailable.");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    firebaseAdminApp = admin.initializeApp({ credential: cert(serviceAccount) });
    return firebaseAdminApp;
  } catch (error) {
    console.error("Failed to initialise Firebase Admin SDK:", error);
    return null;
  }
}

async function requireAuth(req: express.Request) {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) throw new Error("SERVER_NOT_CONFIGURED");

  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new Error("UNAUTHENTICATED");

  const token = header.slice("Bearer ".length);
  return admin.auth(adminApp).verifyIdToken(token);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/paystack/verify", async (req, res) => {
    const { reference, projectId } = req.body as { reference?: string; projectId?: string };
    if (!reference || !projectId) return res.status(400).json({ error: "Missing required fields" });

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const adminApp = getFirebaseAdmin();
    if (!paystackKey || !adminApp) return res.status(503).json({ error: "Payment service is not configured." });

    try {
      const decoded = await requireAuth(req);
      const db = getFirestore(adminApp);
      const projectRef = db.collection("projects").doc(projectId);
      const projectSnap = await projectRef.get();

      if (!projectSnap.exists) return res.status(404).json({ error: "Project not found" });
      const project = projectSnap.data()!;

      if (project.studentId !== decoded.uid) return res.status(403).json({ error: "You do not own this project" });
      if (!['PAYMENT_PENDING', 'DRAFT'].includes(project.status)) {
        return res.status(409).json({ error: "This project is not awaiting payment" });
      }

      const existingPayment = await db.collection("payments").where("reference", "==", reference).limit(1).get();
      if (!existingPayment.empty) return res.status(409).json({ error: "This payment reference has already been processed" });

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${paystackKey}` },
      });
      const data = await response.json();

      if (!response.ok || !data.status || data.data?.status !== "success") {
        return res.status(400).json({ error: "Transaction verification failed" });
      }

      const paidNaira = Number(data.data.amount) / 100;
      const expectedNaira = Number(project.totalAmount);
      const currency = data.data.currency;

      if (!Number.isFinite(expectedNaira) || Math.abs(paidNaira - expectedNaira) > 0.01 || currency !== "NGN") {
        return res.status(400).json({ error: "Payment amount or currency does not match the project" });
      }

      // Paystack's verified customer email should correspond to the authenticated account where possible.
      const customerEmail = String(data.data.customer?.email || "").toLowerCase();
      const accountEmail = String(decoded.email || "").toLowerCase();
      if (customerEmail && accountEmail && customerEmail !== accountEmail) {
        return res.status(400).json({ error: "Payment customer does not match the authenticated account" });
      }

      const paymentRef = db.collection("payments").doc();
      const transactionRef = db.collection("walletTransactions").doc();
      const batch = db.batch();

      batch.update(projectRef, {
        status: "PAYMENT_CONFIRMED",
        paymentReference: reference,
        paymentAmount: paidNaira,
        paymentCurrency: currency,
        paymentVerifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      batch.set(paymentRef, {
        reference,
        userId: decoded.uid,
        projectId,
        amount: paidNaira,
        currency,
        status: "COMPLETED",
        gateway: "paystack",
        createdAt: FieldValue.serverTimestamp(),
      });

      // Immutable audit ledger. This records the incoming project payment;
      // it is intentionally not treated as writer earnings.
      batch.set(transactionRef, {
        userId: decoded.uid,
        projectId,
        reference,
        type: "PROJECT_PAYMENT",
        amount: paidNaira,
        currency,
        status: "COMPLETED",
        description: `Verified Paystack payment for project ${projectId}`,
        createdAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
      return res.json({ success: true, reference, amount: paidNaira, currency });
    } catch (error: any) {
      if (error?.message === "UNAUTHENTICATED") return res.status(401).json({ error: "Authentication required" });
      if (error?.message === "SERVER_NOT_CONFIGURED") return res.status(503).json({ error: "Payment service is not configured." });
      console.error("Paystack verification error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Finalyzed server running on port ${PORT}`));
}

startServer().catch(error => {
  console.error("Unable to start Finalyzed server:", error);
  process.exit(1);
});
