import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Lightbulb,
  FolderOpen,
  Briefcase,
  Filter,
  Receipt,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@components/ui/sidebar";

import ProjectIdeas from "@components/project-ideas/project-ideas.jsx";
import ActiveProjects from "@components/active-project/active-projects.jsx";
import FreelanceProjects from "@components/freelance-projects.jsx";
import ProjectDetail from "@components/project-detail/project-detail.jsx";
import Collaborators from "@components/collaborators.jsx";
import Tracker from "@components/price-tracker/tracker.jsx";
import axios from "axios";
import { toast } from "sonner";
import Logo from "@assets/logo/manage_logo_removebg_small.png";

const API_URL =
  (window.location.hostname === "localhost"
    ? import.meta.env.VITE_API_URL || import.meta.env.VITE_API_KEY
    : import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_URL) ||
  "http://localhost:3000/edenlabs-manager/server/v1/";

const API_KEY = import.meta.env.VITE_KEY;

const SIDEBAR_ITEMS = [
  {
    id: 1,
    id_name: "project-ideas",
    title: "Ideas de proyectos",
    icon: Lightbulb,
  },
  {
    id: 2,
    id_name: "active-projects",
    title: "Proyectos activos",
    icon: FolderOpen,
  },
  {
    id: 3,
    id_name: "freelance-projects",
    title: "Proyectos empresa",
    icon: Briefcase,
  },
  {
    id: 4,
    id_name: "collaborators",
    title: "Colaboradores",
    icon: Users,
  },
  {
    id: 5,
    id_name: "price-tracker",
    title: "Cotizaciones",
    icon: Receipt,
  },
];

export default function Dashboard() {
  const [activeView, setActiveView] = useState("project-ideas");
  const [selectedProject, setSelectedProject] = useState(null);
  const [filters, setFilters] = useState({ status: "all", type: "all" });
  const [collaborators, setCollaborators] = useState([]);

  const navigate = useNavigate();

  const getCollaborators = useCallback(() => {
    axios
      .get(`${API_URL}user`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setCollaborators(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const handleLogOut = async () => {
    const token = localStorage.getItem("token");

    try {
      if (token) {
        await axios.delete(`${API_URL}auth/logout`, {
          data: { token },
        });
      }
    } catch (err) {
      console.error("Error del servidor al cerrar sesión:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
      toast.success("Sesión cerrada correctamente");
    }
  };

  // Memoizar handlers
  const handleBackToProjects = useCallback(() => {
    setActiveView("active-projects");
    setSelectedProject(null);
  }, []);

  const handleViewProject = useCallback((project) => {
    setSelectedProject(project);
    setActiveView("project-detail");
  }, []);

  // Memoizar handlers para filtros
  const handleStatusFilterChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handleTypeFilterChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, type: value }));
  }, []);

  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    const role = currentUser.role ?? currentUser.role_id;
    const dept = currentUser.department ?? currentUser.department_id;
    return (
      role == 4 ||
      dept == 2 ||
      String(role).toLowerCase() === "admin" ||
      String(role).toLowerCase() === "administradores" ||
      String(dept).toLowerCase() === "ti" ||
      String(dept).toLowerCase() === "ti admin"
    );
  }, [currentUser]);

  const visibleSidebarItems = useMemo(() => {
    return SIDEBAR_ITEMS.filter((item) => {
      if (
        item.id_name === "freelance-projects" ||
        item.id_name === "collaborators" ||
        item.id_name === "price-tracker"
      ) {
        return isAdmin;
      }
      return true;
    });
  }, [isAdmin]);

  // Memoizar el contenido renderizado
  const renderContent = useMemo(() => {
    switch (activeView) {
      case "project-ideas":
        return <ProjectIdeas urlApi={API_URL} />;
      case "active-projects":
        return (
          <ActiveProjects urlApi={API_URL} onViewDetails={handleViewProject} />
        );
      case "project-detail":
        return (
          <ProjectDetail
            urlApi={API_URL}
            project={selectedProject}
            onBack={handleBackToProjects}
            collaborators={collaborators}
            isAdmin={isAdmin}
          />
        );
      case "freelance-projects":
        return isAdmin ? (
          <FreelanceProjects
            urlApi={API_URL}
            onViewDetails={handleViewProject}
          />
        ) : (
          <ProjectIdeas urlApi={API_URL} />
        );
      case "collaborators":
        return isAdmin ? (
          <Collaborators
            urlApi={API_URL}
            apiKey={API_KEY}
            collaborators={collaborators}
            refresh={() => getCollaborators()}
          />
        ) : (
          <ProjectIdeas urlApi={API_URL} />
        );
      case "price-tracker":
        return isAdmin ? (
          <Tracker urlApi={API_URL} />
        ) : (
          <ProjectIdeas urlApi={API_URL} />
        );
      default:
        return <ProjectIdeas urlApi={API_URL} />;
    }
  }, [
    activeView,
    selectedProject,
    collaborators,
    handleViewProject,
    handleBackToProjects,
    isAdmin,
  ]);

  useEffect(() => {
    getCollaborators();
  }, [getCollaborators]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src={Logo} alt="" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-lg font-semibold">EdenLabs Manager</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSidebarItems.map((item) => (
                  <SidebarMenuItem key={item.id_name}>
                    <SidebarMenuButton
                      onClick={() => setActiveView(item.id_name)}
                      isActive={activeView === item.id_name}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-3 px-2">
              <div>
                <Label htmlFor="status-filter" className="text-xs">
                  Estado
                </Label>
                <Select
                  value={filters.status}
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="starting">Empezando</SelectItem>
                    <SelectItem value="in-progress">En curso</SelectItem>
                    <SelectItem value="finalizing">Finalizando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type-filter" className="text-xs">
                  Tipo
                </Label>
                <Select
                  value={filters.type}
                  onValueChange={handleTypeFilterChange}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="internal">Interno</SelectItem>
                    <SelectItem value="freelance">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Button onClick={handleLogOut}>Cerrar Sesión</Button>
        </header>
        <div className="flex-1 p-6">{renderContent}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
