import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <TopNav />
      <Sidebar />
      <main>{children ?? <Outlet />}</main>
    </div>
  );
}
