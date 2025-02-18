// pages/api/consolidated-rate.js

export default function handler(req, res) {
    const { from, to } = req.query;
  
    // Validate query parameters
    if (!from || !to) {
      return res.status(400).json({ error: "Missing 'from' or 'to' parameter." });
    }
  
    // For demo purposes, generate a simulated conversion rate
    const rate = (Math.random() * (1.5 - 0.5) + 0.5).toFixed(6);
    res.status(200).json({ from, to, rate: parseFloat(rate) });
  }
  