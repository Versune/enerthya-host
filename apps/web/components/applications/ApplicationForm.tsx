"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { applicationSchema } from "@/lib/validation/application";
import { firstIssue } from "@/lib/validation/auth";

type EnvironmentOption = { id: string; label: string };

export function ApplicationForm({ environments }: { environments: EnvironmentOption[] }) {
  const router = useRouter();
  const ids = {
    name: useId(),
    environment: useId(),
    source: useId(),
    repo: useId(),
    branch: useId(),
    build: useId(),
    port: useId(),
    kind: useId(),
    mounts: useId(),
  };

  const [name, setName] = useState("");
  const [environmentId, setEnvironmentId] = useState(environments[0]?.id ?? "");
  const [kind, setKind] = useState<"web" | "service">("web");
  const [sourceType, setSourceType] = useState<"git" | "image">("git");
  const [gitUrl, setGitUrl] = useState("");
  const [dockerImage, setDockerImage] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [buildType, setBuildType] = useState<"dockerfile" | "nixpacks" | "docker-compose">(
    "dockerfile",
  );
  const [port, setPort] = useState("3000");
  const [mounts, setMounts] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // One per line, "host path:container path".
    const volumes = mounts
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [source, ...rest] = line.split(":");
        return { source: source ?? "", target: rest.join(":") };
      });
    const parsed = applicationSchema.safeParse({
      name,
      environmentId,
      sourceType,
      kind,
      volumes,
      gitUrl,
      dockerImage,
      gitBranch,
      buildType,
      port,
      healthcheckPath: "/",
    });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
      setName("");
      setGitUrl("");
      setDockerImage("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="form server-form"
      noValidate
      data-hydrated={hydrated ? "true" : undefined}
      onSubmit={onSubmit}
    >
      <div className="field">
        <label className="field__label" htmlFor={ids.name}>
          Name
        </label>
        <input
          className="field__input"
          id={ids.name}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={ids.environment}>
          Environment
        </label>
        <select
          className="field__input"
          id={ids.environment}
          value={environmentId}
          onChange={(event) => setEnvironmentId(event.target.value)}
        >
          {environments.map((environment) => (
            <option key={environment.id} value={environment.id}>
              {environment.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={ids.kind}>
          Type
        </label>
        <select
          className="field__input"
          id={ids.kind}
          value={kind}
          onChange={(event) => setKind(event.target.value as "web" | "service")}
        >
          <option value="web">Web application — answers HTTP on a port</option>
          <option value="service">Background service — a process, no port</option>
        </select>
      </div>

      <div className="server-form__row">
        <div className="field">
          <label className="field__label" htmlFor={ids.source}>
            Source
          </label>
          <select
            className="field__input"
            id={ids.source}
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as "git" | "image")}
          >
            <option value="git">Git repository</option>
            <option value="image">Docker image</option>
          </select>
        </div>

        {sourceType === "git" ? (
          <div className="field">
            <label className="field__label" htmlFor={ids.repo}>
              Repository
            </label>
            <input
              className="field__input"
              id={ids.repo}
              value={gitUrl}
              onChange={(event) => setGitUrl(event.target.value)}
              placeholder="https://github.com/owner/repo or git@github.com:owner/repo.git"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="field">
            <label className="field__label" htmlFor={ids.repo}>
              Image
            </label>
            <input
              className="field__input"
              id={ids.repo}
              value={dockerImage}
              onChange={(event) => setDockerImage(event.target.value)}
              placeholder="nginx:1.27-alpine"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
        )}

        {sourceType === "git" ? (
          <div className="field">
            <label className="field__label" htmlFor={ids.branch}>
              Branch
            </label>
            <input
              className="field__input"
              id={ids.branch}
              value={gitBranch}
              onChange={(event) => setGitBranch(event.target.value)}
              spellCheck={false}
            />
          </div>
        ) : null}
      </div>

      <div className="server-form__row">
        <div className="field">
          <label className="field__label" htmlFor={ids.build}>
            Build
          </label>
          <select
            className="field__input"
            id={ids.build}
            value={buildType}
            onChange={(event) =>
              setBuildType(event.target.value as "dockerfile" | "nixpacks" | "docker-compose")
            }
          >
            <option value="dockerfile">Dockerfile</option>
            <option value="nixpacks" disabled>
              Nixpacks — not supported yet
            </option>
            <option value="docker-compose" disabled>
              docker-compose — not supported yet
            </option>
          </select>
          <p className="field__hint">
            The pipeline builds the repository&apos;s Dockerfile today. Nixpacks and compose are
            refused with a reason instead of failing silently.
          </p>
        </div>

        {kind === "web" ? (
          <div className="field">
            <label className="field__label" htmlFor={ids.port}>
              Port
            </label>
            <input
              className="field__input"
              id={ids.port}
              type="number"
              min={1}
              max={65535}
              value={port}
              onChange={(event) => setPort(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      {kind === "service" ? (
        <div className="field">
          <label className="field__label" htmlFor={ids.mounts}>
            Mounts — one per line, host path:container path
          </label>
          <textarea
            className="field__input"
            id={ids.mounts}
            rows={3}
            value={mounts}
            onChange={(event) => setMounts(event.target.value)}
            placeholder="/data/enerthya/apps/<id>/config.yml:/app/config.yml"
            spellCheck={false}
          />
        </div>
      ) : null}

      <div className="form__actions">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create application"}
        </button>
      </div>

      {error ? (
        <p className="status" role="alert">
          <strong>The panel refused the request.</strong>
          {error}
        </p>
      ) : null}
    </form>
  );
}
