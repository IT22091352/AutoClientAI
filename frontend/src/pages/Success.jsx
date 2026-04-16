import { useEffect, useState } from "react";
import { confirmSubscription, getCurrentUser } from "../services/api";

export default function Success({ onComplete }) {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Activating your Pro plan...");

  useEffect(() => {
    const activatePlan = async () => {
      const sessionId = new URLSearchParams(window.location.search).get("session_id");

      if (!sessionId) {
        setStatus("error");
        setMessage("Missing subscription reference.");
        return;
      }

      try {
        const activation = await confirmSubscription(sessionId);
        localStorage.setItem("user", JSON.stringify(activation.data.user));

        const me = await getCurrentUser();
        localStorage.setItem("user", JSON.stringify(me.data.user));

        setStatus("success");
        setMessage(activation.data.demo ? "Demo Pro access enabled" : "Plan Activated");

        if (onComplete) {
          setTimeout(() => onComplete(), 1200);
        }
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.msg || "Subscription activation failed.");
      }
    };

    activatePlan();
  }, [onComplete]);

  return (
    <div className="auth-shell">
      <div className="auth-card glass-panel center-card">
        <div className={`status-chip ${status === "success" ? "status-pro" : status === "error" ? "status-free" : ""}`}>
          Subscription Activation
        </div>
        <h1>{message}</h1>
        <p className="muted">
          {status === "success"
            ? "Your account has been upgraded and premium features are unlocked."
            : "We are confirming the payment and updating your subscription plan."}
        </p>

        {status === "success" ? (
          <button className="primary-button" onClick={onComplete}>
            Go to Dashboard
          </button>
        ) : null}
      </div>
    </div>
  );
}