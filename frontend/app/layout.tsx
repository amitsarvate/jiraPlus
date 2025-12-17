import "./globals.css";
import React from "react";

export const metadata = {
  title: "JiraPlus",
  description: "Sprint metrics dashboard for Jira teams"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
