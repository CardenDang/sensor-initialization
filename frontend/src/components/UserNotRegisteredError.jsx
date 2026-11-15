export default function UserNotRegisteredError({ children }) {
  return (
    <section role="alert" className="user-not-registered-error">
      <h1>Account not registered</h1>
      <p>Please contact your administrator to request access.</p>
      {children}
    </section>
  );
}
