import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import axios from "axios";
import { toast } from "sonner";

const API_URL =
  window.location.hostname == "localhost"
    ? import.meta.env.VITE_API_URL
    : import.meta.env.VITE_API_KEY;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Por favor completa todos los campos");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}auth/login`, {
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Inicio de sesión exitoso");

      // Aquí puedes redirigir dependiendo del rol si quieres
      // Por ahora solo redirigir
      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Error al iniciar sesión");
      } else {
        toast.error("Error del servidor");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-light text-black">Arvix Manager</h1>
        </div>

        <div action="" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-normal text-black">
              Correo
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Introduce tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-gray-200 focus:border-black focus:ring-0 bg-white text-black placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-normal text-black"
            >
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-gray-200 focus:border-black focus:ring-0 bg-white text-black placeholder:text-gray-400"
              required
            />
          </div>

          <Button
            onClick={handleLogin}
            className="w-full bg-black hover:bg-gray-800 text-white font-normal py-2.5"
          >
            Iniciar sesión
          </Button>
        </div>

        {/* <div className="text-center">
          <a
            href="#"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div> */}
      </div>
    </div>
  );
}
