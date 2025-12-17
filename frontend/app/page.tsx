/* eslint-disable @next/next/no-img-element */
"use client";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function startJiraConnect() {
  // Redirect to the backend OAuth start endpoint.
  window.location.href = `${apiBase}/auth/jira/start`;
}

export default function Home() {
  return (
    <section style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <p style={{ fontSize: "0.9rem", color: "#5f6c7b", marginBottom: "0.5rem" }}>
        JiraPlus
      </p>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
        Sprint insights are coming soon
      </h1>
      <p style={{ maxWidth: "28rem", lineHeight: 1.6, color: "#243447" }}>
        We&apos;re setting up the dashboard, Jira connection flow, and background
        sync so you can track velocity, created vs. completed, spillover, and developer
        activity across sprints.
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={startJiraConnect}
          style={{
            padding: "0.75rem 1.1rem",
            borderRadius: "0.5rem",
            border: "1px solid #0f66ff",
            background: "#0f66ff",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 6px 12px rgba(15, 102, 255, 0.25)"
          }}
        >
          Connect Jira
        </button>
      </div>
    </section>
  );
}
