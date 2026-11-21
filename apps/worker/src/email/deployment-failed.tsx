/**
 * The email a failed deployment sends.
 *
 * Plain React elements with inline styles: react-email's components are not
 * installed, and email clients need the styles inlined anyway. `render()` from
 * @react-email/render turns this into the HTML part; notify.ts builds the text
 * part from the same fields.
 */
export type DeploymentFailedEmailProps = {
  applicationName: string;
  error: string;
  deploymentId: string;
  panelUrl?: string;
};

const ink = "#111111";
const rule = "#d9d9d9";

export function DeploymentFailedEmail({
  applicationName,
  error,
  deploymentId,
  panelUrl,
}: DeploymentFailedEmailProps) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        color: ink,
        maxWidth: "36rem",
        padding: "24px",
        border: `1px solid ${rule}`,
      }}
    >
      <p style={{ fontSize: "11px", letterSpacing: "0.12em", margin: 0 }}>DEPLOYMENT FAILED</p>
      <h1 style={{ fontSize: "22px", margin: "8px 0 16px", fontWeight: 600 }}>{applicationName}</h1>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontSize: "13px",
          lineHeight: 1.5,
          background: "#f6f6f6",
          padding: "12px",
          margin: "0 0 16px",
        }}
      >
        {error}
      </pre>
      <p style={{ fontSize: "12px", color: "#555555", margin: 0 }}>
        deployment {deploymentId.slice(0, 8)}
        {panelUrl ? (
          <>
            {" · "}
            <a
              href={`${panelUrl.replace(/\/$/, "")}/deployments/${deploymentId}`}
              style={{ color: ink }}
            >
              open in the panel
            </a>
          </>
        ) : null}
      </p>
    </div>
  );
}
