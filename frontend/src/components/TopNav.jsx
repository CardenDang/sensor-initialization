import { Link } from 'react-router-dom';

export default function TopNav({ children }) {
  return (
    <header className="top-nav">
      <Link to="/">Sleep Quality Monitor</Link>
      {children}
    </header>
  );
}
