import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Data from "./pages/Data";
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import { AuthProvider } from './lib/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';


function App() {
  return(
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/data" element={<Data />} />
        <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
