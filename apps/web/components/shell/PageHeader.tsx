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
    <div className="page__head">
      <p className="label">{label}</p>
      <h1 className="page__title">{title}</h1>
      <p className="page__lede">{children}</p>
    </div>
  );
}
