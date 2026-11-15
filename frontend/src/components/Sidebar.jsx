import { NavLink } from 'react-router-dom';
import { Moon, Heart, CalendarDays, Gem } from 'lucide-react';
export default function Sidebar() {
  return <aside className="sidebar">
    <NavLink className="brand" to="/" aria-label="Sleep monitor home"><Moon size={21}/></NavLink>
    <nav aria-label="Main navigation">
      <NavLink to="/" end title="Sleep overview" aria-label="Sleep overview"><Heart size={21}/></NavLink>
      <NavLink to="/data" title="Raw sleep data" aria-label="Raw sleep data"><CalendarDays size={21}/></NavLink>
      <NavLink to="/dashboard" title="ML dashboard" aria-label="ML dashboard"><Gem size={21}/></NavLink>
    </nav>
    <span className="sidebar-bottom" title="Local demo">+</span>
  </aside>;
}
