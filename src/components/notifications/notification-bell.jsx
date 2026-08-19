/* eslint-disable react/prop-types */
// Campanita de notificaciones montada una sola vez en el header de Dashboard
// (que no se desmonta al cambiar de vista interna), así que sigue visible
// sin importar qué sección esté abierta. Se actualiza por polling: es la
// opción que no requiere infraestructura nueva en el servidor (sin
// WebSockets/SSE) y para el tamaño de equipo actual el retraso de unos
// segundos no se nota.
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { authHeaders } from "@components/project-detail/task-constants.js";

const POLL_INTERVAL_MS = 20000;

export default function NotificationBell({ urlApi, onOpenTask }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const seenIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  const fetchNotifications = useCallback(() => {
    axios
      .get(`${urlApi}notifications`, { headers: authHeaders() })
      .then((response) => {
        if (response.data.status !== "ok") return;

        const data = response.data.data;

        // A partir de la segunda carga, cualquier notificación no vista antes
        // dispara un toast (con el mismo sonner que ya usa el resto de la app),
        // para que se sienta inmediata y no solo un numerito cambiando en silencio.
        if (!isFirstLoad.current) {
          data
            .filter((n) => !n.is_read && !seenIds.current.has(n.id))
            .forEach((n) => toast.info(n.message));
        }

        data.forEach((n) => seenIds.current.add(n.id));
        isFirstLoad.current = false;

        setNotifications(data);
        setUnread(response.data.unread || 0);
      })
      .catch((error) => console.error(error));
  }, [urlApi]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));

    axios
      .put(`${urlApi}notifications/${id}/read`, {}, { headers: authHeaders() })
      .catch((error) => console.error(error));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnread(0);

    axios
      .put(`${urlApi}notifications/read-all`, {}, { headers: authHeaders() })
      .catch((error) => console.error(error));
  };

  const handleClickNotification = (n) => {
    if (!n.is_read) markAsRead(n.id);
    setOpen(false);
    if (n.related_task_id && onOpenTask) onOpenTask(n.related_task_id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Marcar todas leídas
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground text-center">
              Sin notificaciones
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClickNotification(n)}
                className={`w-full text-left p-3 border-b last:border-0 hover:bg-muted/50 ${
                  !n.is_read ? "bg-blue-50/60" : ""
                }`}
              >
                <p className={`text-xs ${!n.is_read ? "font-medium" : "text-muted-foreground"}`}>
                  {n.message}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
