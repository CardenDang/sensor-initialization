export default function AuthLayout({ title, children }) {
  return (
    <main className="auth-layout">
      {title && <h1>{title}</h1>}
      {children}
    </main>
  );
}
