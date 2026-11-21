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
  };

  const [name, setName] = useState("");
  const [environmentId, setEnvironmentId] = useState(environments[0]?.id ?? "");
  const [sourceType, setSourceType] = useState<"git" | "image">("git");
  const [gitUrl, setGitUrl] = useState("");
  const [dockerImage, setDockerImage] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [buildType, setBuildType] = useState<"dockerfile" | "nixpacks" | "docker-compose">(
    "nixpacks",
  );
  const [port, setPort] = useState("3000");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = applicationSchema.safeParse({
      name,
      environmentId,
      sourceType,
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
              placeholder="https://github.com/owner/repo"
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
            <option value="nixpacks">Nixpacks</option>
            <option value="dockerfile">Dockerfile</option>
            <option value="docker-compose">docker-compose</option>
          </select>
        </div>

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
      </div>

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
