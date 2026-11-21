"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

type Props = {
  databaseId: string;
  intervalHours: number | null;
  retentionDays: number | null;
  lastBackupAt: string | null;
};

/** Two numbers and a save: how often to back up, and how long to keep it. */
export function ScheduleForm({ databaseId, intervalHours, retentionDays, lastBackupAt }: Props) {
  const router = useRouter();
  const ids = useId();
  const [interval, setIntervalValue] = useState(
    intervalHours === null ? "" : String(intervalHours),
  );
  const [retention, setRetention] = useState(retentionDays === null ? "" : String(retentionDays));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const enabled = intervalHours !== null && intervalHours > 0;

  return (
    <form
      className="form server-form"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        setSaved(false);
        try {
          const response = await fetch(`/api/databases/${databaseId}/schedule`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              intervalHours: interval === "" ? null : Number(interval),
              retentionDays: retention === "" ? null : Number(retention),
            }),
          });
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          if (!response.ok) {
            setError(body.error ?? `The panel answered ${response.status}.`);
            return;
          }
          setSaved(true);
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="schedule-form__row">
        <div className="field">
          <label className="field__label" htmlFor={`${ids}-interval`}>
            Back up every (hours)
          </label>
          <input
            className="field__input"
            id={`${ids}-interval`}
            type="number"
            min={0}
            max={720}
            inputMode="numeric"
            placeholder="off"
            value={interval}
            onChange={(event) => setIntervalValue(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${ids}-retention`}>
            Keep for (days)
          </label>
          <input
            className="field__input"
            id={`${ids}-retention`}
            type="number"
            min={0}
            max={365}
            inputMode="numeric"
            placeholder="forever"
            value={retention}
            onChange={(event) => setRetention(event.target.value)}
          />
        </div>
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save schedule"}
        </button>
      </div>

      <p className="field__hint">
        {enabled
          ? `Automatic backups on${lastBackupAt ? ` · last enqueued ${lastBackupAt}` : ""}.`
          : "No automatic backups; a backup still runs when you ask for one."}{" "}
        Retention never removes the newest successful backup.
      </p>

      {saved ? (
        <p className="field__hint" role="status">
          Schedule saved.
        </p>
      ) : null}
      {error ? (
        <p className="status" role="alert">
          <strong>The panel refused the request.</strong>
          {error}
        </p>
      ) : null}
    </form>
  );
}
