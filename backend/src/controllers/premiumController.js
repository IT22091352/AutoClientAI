export const getPremiumInsights = (req, res) => {
  res.json({
    message: "Premium access granted",
    stats: {
      todayRevenue: "$240",
      activeLeads: 18,
      conversionRate: "34%",
      responseTime: "1.8 min",
    },
    features: [
      "Priority AI reply tuning",
      "Lead conversion suggestions",
      "Advanced analytics",
      "Priority support",
    ],
  });
};