import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/data">Data</NavLink>
      <NavLink to="/dashboard">Dashboard</NavLink>
    </nav>
  );
}
