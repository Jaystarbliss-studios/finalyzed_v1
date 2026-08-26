import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mock initial data setup for the platform
  app.get("/api/specialists", (req, res) => {
    // Demo data for the marketplace
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
      },
      {
        id: "sp-2",
        name: "Samuel O.",
        isVerified: true,
        rating: 4.8,
        reviews: 86,
        completedProjects: 112,
        averageDeliveryDays: 4.1,
        approvalRate: 96,
        specialties: ["Business Administration", "Accounting", "Finance"],
        imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&auto=format&fit=crop&q=60"
      },
      {
        id: "sp-3",
        name: "Dr. A. Rahman",
        isVerified: true,
        rating: 5.0,
        reviews: 42,
        completedProjects: 45,
        averageDeliveryDays: 5.2,
        approvalRate: 99,
        specialties: ["Civil Engineering", "Architecture", "Project Management"],
        imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60"
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
