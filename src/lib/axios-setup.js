// Interceptor global de axios: cuando el token expira (login dura 2h) o deja
// de ser válido, cualquier ruta protegida empieza a responder 401 en
// silencio — sin esto, la UI se queda mostrando datos vacíos (ej. Gerencia
// en $0) sin explicar por qué. Solo actúa si YA había un token guardado, para
// no interferir con un intento de login fallido (que también responde 401
// pero antes de que exista sesión).
import axios from "axios";
import { toast } from "sonner";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem("token");

      if (hadToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (window.location.hash !== "#/login") {
          toast.error("Tu sesión expiró, inicia sesión de nuevo");
          window.location.hash = "#/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
