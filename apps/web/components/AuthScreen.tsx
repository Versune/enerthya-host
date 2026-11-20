import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";

export type Fact = { term: string; detail: string };

export function AuthScreen({
  title,
  lede,
  ledgerTitle,
  facts,
  ledgerFoot,
  children,
}: {
  title: string;
  lede: string;
  ledgerTitle: string;
  facts: Fact[];
  ledgerFoot: string;
  children: React.ReactNode;
}) {
  return (
    <div className="frame">
      <header className="frame__bar">
        <Brand />
        <div className="frame__tools">
          <span className="frame__env">Self-hosted panel</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="screen" id="main">
        <div className="screen__col">
          <h1 className="title">{title}</h1>
          <p className="lede">{lede}</p>
          {children}
        </div>

        <aside className="screen__ledger" aria-labelledby="ledger-title">
          <span className="label" id="ledger-title">
            {ledgerTitle}
          </span>
          <dl className="ledger">
            {facts.map((fact) => (
              <div className="ledger__row" key={fact.term}>
                <dt>{fact.term}</dt>
                <dd>{fact.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="ledger__foot">{ledgerFoot}</p>
        </aside>
      </main>

      <footer className="frame__foot">
        <span>Enerthya Host · Apache-2.0</span>
        <span>No telemetry</span>
        <span>No third-party requests</span>
      </footer>
    </div>
  );
}
