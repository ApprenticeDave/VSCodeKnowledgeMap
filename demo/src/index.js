// Demo entry point — placeholder for graph testing
const express = require("express");
const app = express();
app.get("/api/v1/health", (req, res) => res.json({ status: "ok" }));
app.listen(process.env.PORT || 3000);
