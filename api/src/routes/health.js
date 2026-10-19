import { Router } from "express";

const router = Router();

// GET /api/health : indique que l'API fonctionne
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "devsecops-api",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
