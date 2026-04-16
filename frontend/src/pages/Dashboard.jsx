import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCheckoutSession,
  generateWhatsAppQr,
  getBusinessProfile,
  getCurrentUser,
  saveBusinessDetails,
  updateBusinessDetails,
  getWhatsAppStatus,
} from "../services/api";

const initialBusinessState = {
  name: "",
  services: "",
  pricing: "",
  faqs: "",
};

const statusLabels = {
  connected: "Connected",
  connecting: "Connecting",
  qr: "Awaiting Scan",
  reconnecting: "Reconnecting",
  disconnected: "Disconnected",
  initializing: "Initializing",
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const [whatsAppStatus, setWhatsAppStatus] = useState("disconnected");
  const [whatsAppMessage, setWhatsAppMessage] = useState("Not connected yet.");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const [business, setBusiness] = useState(initialBusinessState);
  const [businessSaved, setBusinessSaved] = useState(false);
  const [hasSavedBusiness, setHasSavedBusiness] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessMessage, setBusinessMessage] = useState("");

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [generalMessage, setGeneralMessage] = useState("Loading dashboard...");

  const isPro = user?.plan === "pro";
  const canUseAutomation = user?.canUseAutomation !== false;
  const canGenerateQr = canUseAutomation && businessSaved;

  const isBusinessComplete = (profile) =>
    Boolean(
      profile.name.trim() &&
        profile.services.trim() &&
        profile.pricing.trim() &&
        profile.faqs.trim()
    );

  const planBadgeClass = useMemo(() => {
    if (isPro) return "status-pro";
    return canUseAutomation ? "status-free" : "status-warning";
  }, [isPro, canUseAutomation]);

  const refreshWhatsAppStatus = useCallback(async () => {
    try {
      const statusRes = await getWhatsAppStatus();
      const status = statusRes.data.whatsapp;

      setWhatsAppStatus(status.status || "disconnected");
      setQrCodeDataUrl(status.qrCodeDataUrl || null);

      if (status.lastError) {
        setWhatsAppMessage(status.lastError);
      } else {
        setWhatsAppMessage(
          status.connected
            ? "Your WhatsApp session is connected. AI auto-replies are active."
            : "Generate a QR and scan with WhatsApp Linked Devices."
        );
      }
    } catch (error) {
      setWhatsAppStatus("disconnected");
      setWhatsAppMessage(error.response?.data?.msg || "Unable to load WhatsApp status");
    }
  }, []);

  useEffect(() => {
    if (!["connecting", "qr", "reconnecting"].includes(whatsAppStatus)) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      refreshWhatsAppStatus();
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [refreshWhatsAppStatus, whatsAppStatus]);

  const loadBusiness = useCallback(async () => {
    try {
      const res = await getBusinessProfile();
      const profile = res.data.business;

      if (!profile) {
        setBusiness(initialBusinessState);
        setBusinessSaved(false);
        setHasSavedBusiness(false);
        return;
      }

      const nextBusiness = {
        name: profile.name || "",
        services: (profile.services || []).join("\n"),
        pricing: profile.pricing || "",
        faqs: (profile.faqs || []).join("\n"),
      };

      setBusiness(nextBusiness);
      setBusinessSaved(isBusinessComplete(nextBusiness));
      setHasSavedBusiness(true);
    } catch (error) {
      setBusinessMessage(error.response?.data?.msg || "Unable to load business profile");
      setBusinessSaved(false);
      setHasSavedBusiness(false);
    }
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const me = await getCurrentUser();
        setUser(me.data.user);

        await Promise.all([refreshWhatsAppStatus(), loadBusiness()]);

        if (me.data.user.canUseAutomation === false) {
          setGeneralMessage("Free access limit reached. Upgrade to Pro to unlock automation.");
        } else {
          setGeneralMessage("Configure your business and connect WhatsApp to go live.");
        }
      } catch (error) {
        setGeneralMessage(error.response?.data?.msg || "Unable to load dashboard");
      } finally {
        setLoadingDashboard(false);
      }
    };

    loadDashboard();
  }, [loadBusiness, refreshWhatsAppStatus]);

  const handleGenerateQr = async () => {
    if (!businessSaved) {
      setBusinessMessage("Please complete business details first");
      return;
    }

    try {
      setLoadingQr(true);
      setBusinessMessage("");
      const res = await generateWhatsAppQr();

      setQrCodeDataUrl(res.data.whatsapp?.qrCodeDataUrl || null);
      setWhatsAppStatus(res.data.whatsapp?.status || "connecting");
      setWhatsAppMessage(res.data.message || "QR generated.");

      if (!res.data.whatsapp?.qrCodeDataUrl) {
        await refreshWhatsAppStatus();
      }
    } catch (error) {
      setWhatsAppMessage(error.response?.data?.msg || "Unable to generate QR");
    } finally {
      setLoadingQr(false);
    }
  };

  const handleBusinessChange = (field, value) => {
    setBusiness((prev) => ({ ...prev, [field]: value }));

    if (!hasSavedBusiness) {
      setBusinessSaved(false);
    }
  };

  const validateBusinessForm = () => {
    const businessName = business.name.trim();
    const services = business.services.trim();
    const pricing = business.pricing.trim();
    const faqs = business.faqs.trim();

    if (!businessName || !services || !pricing || !faqs) {
      setBusinessMessage("Business name, services, pricing, and FAQs are required.");
      return null;
    }

    return {
      name: businessName,
      services,
      pricing,
      faqs,
    };
  };

  const handleSaveBusiness = async () => {
    const payload = validateBusinessForm();

    if (!payload) {
      return;
    }

    try {
      setSavingBusiness(true);
      setBusinessMessage("");

      await saveBusinessDetails(payload);

      setBusinessSaved(true);
      setHasSavedBusiness(true);
      setBusinessMessage("Business profile saved successfully.");
    } catch (error) {
      if (!hasSavedBusiness) {
        setBusinessSaved(false);
      }
      setBusinessMessage(error.response?.data?.msg || "Unable to save business profile");
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleUpdateBusiness = async () => {
    const payload = validateBusinessForm();

    if (!payload) {
      return;
    }

    try {
      setSavingBusiness(true);
      setBusinessMessage("");

      await updateBusinessDetails(payload);

      setBusinessSaved(true);
      setHasSavedBusiness(true);
      setBusinessMessage("Business profile updated successfully.");
    } catch (error) {
      setBusinessMessage(error.response?.data?.msg || "Unable to update business profile");
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setLoadingCheckout(true);
      const res = await createCheckoutSession();
      window.location.href = res.data.checkoutUrl;
    } catch (error) {
      setGeneralMessage(error.response?.data?.msg || "Unable to start checkout");
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (loadingDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-925 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-925 to-slate-900">
      {/* Top Header */}
      <div className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-slate-950/50">
        <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Dashboard</h2>
            <p className="text-sm text-slate-400 mt-1">{generalMessage}</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className={`status-badge ${planBadgeClass === "status-pro" ? "badge-pro" : "badge-free"}`}>
                {user.plan === "pro" ? "🌟 Pro Plan" : "Free Plan"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto animate-slideUp">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          <div className="glass-card p-4 md:p-6 group hover:shadow-2xl">
            <p className="text-slate-400 text-sm font-medium mb-2">💬 WhatsApp Status</p>
            <h3 className="text-2xl font-bold text-white mb-2">
              {statusLabels[whatsAppStatus] || "Disconnected"}
            </h3>
            <p className="text-slate-400 text-sm">{whatsAppMessage}</p>
          </div>

          <div className="glass-card p-4 md:p-6 group hover:shadow-2xl">
            <p className="text-slate-400 text-sm font-medium mb-2">🎯 Access Tier</p>
            <h3 className="text-2xl font-bold text-white mb-2">
              {isPro ? "Pro" : canUseAutomation ? "Free Access" : "Restricted"}
            </h3>
            <p className="text-slate-400 text-sm">First 100 users get full access free.</p>
          </div>

          <div className="glass-card p-4 md:p-6 group hover:shadow-2xl">
            <p className="text-slate-400 text-sm font-medium mb-2">✅ Readiness</p>
            <h3 className="text-2xl font-bold text-white mb-2">
              {qrCodeDataUrl ? "QR Ready" : "Pending"}
            </h3>
            <p className="text-slate-400 text-sm">Generate QR to connect WhatsApp.</p>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* Business Details Card */}
          <section className="glass-card-lg p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">🏢 Business Details</h3>
              <p className="text-slate-400 text-sm">
                AI uses this data to personalize WhatsApp replies and increase conversions.
              </p>
            </div>

            <div className="space-y-5">
              {/* Encryption Banner */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-sm text-green-200">
                <span>🔐</span> Your business data is securely encrypted end-to-end.
              </div>

              {/* Form Fields */}
              <div>
                <label className="label-text">Business Name</label>
                <input
                  type="text"
                  className="input-dark"
                  value={business.name}
                  onChange={(e) => handleBusinessChange("name", e.target.value)}
                  placeholder="Nexgynix Solutions"
                  disabled={!canUseAutomation}
                />
              </div>

              <div>
                <label className="label-text">Services (one per line)</label>
                <textarea
                  className="input-dark min-h-24 resize-y"
                  value={business.services}
                  onChange={(e) => handleBusinessChange("services", e.target.value)}
                  placeholder={"Hair treatments\nSpa packages\nBridal makeup"}
                  disabled={!canUseAutomation}
                />
              </div>

              <div>
                <label className="label-text">Pricing</label>
                <textarea
                  className="input-dark min-h-16 resize-y"
                  value={business.pricing}
                  onChange={(e) => handleBusinessChange("pricing", e.target.value)}
                  placeholder="Starter package $49, Premium package $129"
                  disabled={!canUseAutomation}
                />
              </div>

              <div>
                <label className="label-text">FAQs (one per line)</label>
                <textarea
                  className="input-dark min-h-24 resize-y"
                  value={business.faqs}
                  onChange={(e) => handleBusinessChange("faqs", e.target.value)}
                  placeholder={"Do you offer weekend appointments?\nHow long is each session?"}
                  disabled={!canUseAutomation}
                />
              </div>

              {businessMessage && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
                  {businessMessage}
                </div>
              )}

              {/* Save/Update Button */}
              <button
                className="btn-primary w-full"
                onClick={hasSavedBusiness ? handleUpdateBusiness : handleSaveBusiness}
                disabled={savingBusiness || !canUseAutomation}
              >
                {savingBusiness
                  ? "⏳ Processing..."
                  : hasSavedBusiness
                  ? "✏️ Update Business Details"
                  : "💾 Save Business Details"}
              </button>
            </div>
          </section>

          
          {/* WhatsApp Card */}
          <section className="glass-card-lg p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">💬 WhatsApp Connection</h3>
              <p className="text-slate-400 text-sm">
                Every account gets an isolated WhatsApp session. Scan the QR from WhatsApp Linked Devices.
              </p>
            </div>

            <div className="space-y-4">
              {/* Info Banner */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
                <span>✨</span> Complete your business profile to activate WhatsApp bot.
              </div>

              {/* QR Panel */}
              <div className="bg-slate-800/30 border border-white/10 rounded-lg p-4 md:p-6 flex items-center justify-center min-h-[220px] sm:min-h-[280px]">
                {qrCodeDataUrl ? (
                  <img
                    className="rounded-lg shadow-lg max-w-xs sm:max-w-sm w-full h-auto"
                    src={qrCodeDataUrl}
                    alt="WhatsApp QR code"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-slate-500 text-lg">📲 No QR generated yet</p>
                    <p className="text-slate-600 text-sm mt-2">
                      Save business details first, then generate QR code
                    </p>
                  </div>
                )}
              </div>

              {/* Locked Banners */}
              {!canUseAutomation && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-sm text-orange-200">
                  <span>⚠️</span> Free access limit reached. Upgrade plan to unlock WhatsApp automation.
                </div>
              )}

              {!businessSaved && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-200">
                  <span>🔒</span> Please complete business details first.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  className={`btn-primary w-full sm:flex-1 ${!canGenerateQr ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={handleGenerateQr}
                  disabled={loadingQr || !canGenerateQr}
                >
                  {loadingQr ? "⏳ Generating..." : "📱 Generate QR"}
                </button>
                <button
                  className="btn-secondary w-full sm:flex-1"
                  onClick={refreshWhatsAppStatus}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </section>

          
        </div>

        {/* Subscription Card */}
        <section className="glass-card-lg p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">🚀 Subscription & Upgrade</h3>
            <p className="text-slate-400 text-sm">
              Current plan: <span className="font-semibold text-white">{user?.plan || "free"}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Free Plan Info */}
            <div className="bg-slate-800/30 border border-white/10 rounded-xl p-4 md:p-6">
              <div className="badge-free mb-4">Free Plan</div>
              <h4 className="text-lg font-bold text-white mb-3">Current Plan</h4>
              <ul className="space-y-2 text-sm text-slate-300 mb-6">
                <li>✅ 100 users included</li>
                <li>✅ Basic WhatsApp automation</li>
                <li>✅ AI-powered replies</li>
                <li>❌ Advanced analytics</li>
                <li>❌ Priority support</li>
              </ul>
            </div>

            {/* Pro Plan Info */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-4 md:p-6">
              <div className="badge-pro mb-4">Pro Plan</div>
              <h4 className="text-lg font-bold text-white mb-3">Upgrade for More</h4>
              <ul className="space-y-2 text-sm text-slate-300 mb-6">
                <li>✅ Unlimited users</li>
                <li>✅ Advanced automation</li>
                <li>✅ AI-powered replies</li>
                <li>✅ Advanced analytics</li>
                <li>✅ Priority support</li>
              </ul>
              {!isPro && (
                <button
                  className="btn-primary w-full"
                  onClick={handleUpgrade}
                  disabled={loadingCheckout}
                >
                  {loadingCheckout ? "⏳ Opening..." : "⭐ Upgrade to Pro"}
                </button>
              )}
              {isPro && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center text-green-200 text-sm">
                  ✓ You're a Pro member
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
