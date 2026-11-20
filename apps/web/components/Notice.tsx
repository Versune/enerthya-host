export function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="notice" role="status">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
