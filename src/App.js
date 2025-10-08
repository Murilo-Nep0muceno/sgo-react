import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Login from "./components/Login";
import Home from "./components/Home";
function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
