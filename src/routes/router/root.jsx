import { Route, Routes } from "react-router-dom";
import Home from "@routes/home/home.jsx";
import Dashboard from "../dashboard/dashboard.jsx";
import Login from "../login/login.jsx";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
