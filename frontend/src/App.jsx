import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Data from "./pages/Data";


function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/data" element={<Data />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
