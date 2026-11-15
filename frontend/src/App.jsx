import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Data from "./pages/Data";
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';


function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/data" element={<Data />} />
        <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
