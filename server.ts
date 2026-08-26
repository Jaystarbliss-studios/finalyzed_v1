import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { cert } from "firebase-admin/app";

// Lazy initialize Firebase Admin
let firebaseAdminApp = null;
function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
      console.warn("FIREBASE_SERVICE_ACCOUNT is missing. Backend Firebase operations will fail.");
      return null;
    }
    try {
      const serviceAccount = JSON.parse(serviceAccountStr);
      firebaseAdminApp = admin.initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", e);
      return null;
    }
  }
  return firebaseAdminApp;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Paystack verification
  app.post("/api/paystack/verify", async (req, res) => {
    const { reference, projectId, userId } = req.body;
    if (!reference || !projectId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return res.status(500).json({ error: "Paystack secret key is missing." });
    }

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackKey}`,
        }
      });
      
      const data = await response.json();
      if (!data.status || data.data.status !== "success") {
        return res.status(400).json({ error: "Transaction verification failed", details: data });
      }

      // Securely update Firestore
      const adminApp = getFirebaseAdmin();
      if (adminApp) {
        const db = getFirestore(adminApp);
        
        // Update Project Status
        await db.collection("projects").doc(projectId).update({
          status: "PAYMENT_CONFIRMED",
          paymentReference: reference,
          paymentAmount: data.data.amount / 100, // stored in kobo
          updatedAt: FieldValue.serverTimestamp()
        });

        // Ledger Entry (Transaction)
        await db.collection("walletTransactions").add({
          userId,
          projectId,
          reference,
          type: "CREDIT",
          amount: data.data.amount / 100,
          currency: data.data.currency,
          status: "COMPLETED",
          description: `Payment for project ${projectId}`,
          createdAt: FieldValue.serverTimestamp()
        });
      } else {
        console.warn("Skipping Firestore secure update because Admin SDK is not configured. (Demo mode)");
      }

      res.json({ success: true, data: data.data });
    } catch (error) {
      console.error("Paystack verify error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mock initial data setup for the platform
  app.get("/api/specialists", (req, res) => {
    res.json([
      {
        id: "sp-1",
        name: "Dr. Jane Doe",
        isVerified: true,
        rating: 4.9,
        reviews: 127,
        completedProjects: 94,
        averageDeliveryDays: 3.8,
        approvalRate: 98,
        specialties: ["Computer Science", "Software Engineering", "IT"],
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60"
      }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
