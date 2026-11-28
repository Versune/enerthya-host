export function PageHeader({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="page__head">
      <div className="page__title-row">
        <h1 className="page__title">{title}</h1>
        <span className="page__label">{label}</span>
      </div>
      <p className="page__lede">{children}</p>
    </header>
  );
}
