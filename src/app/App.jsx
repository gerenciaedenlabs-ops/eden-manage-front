import AppRouter from "@routes/router/root";
import { Toaster } from "sonner";
import "./App.css";

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster richColors />
    </>
  );
}
