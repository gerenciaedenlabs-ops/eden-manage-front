/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Eye, Edit, Undo2, MoreHorizontal } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Progress } from "@components/ui/progress";
import { Badge } from "@components/ui/badge";
import axios from "axios";
import EditProjectActive from "@components/active-project/modal/edit-active-project.jsx";
import DeleteProjectActive from "@components/active-project/modal/delete-active-project.jsx";
import ViewProjectActive from "@components/active-project/modal/view-active-project.jsx";

export default function ActiveProjects({ urlApi, onViewDetails }) {
  const [listActive, setListActive] = useState([]);

  const [openViewModal, setOpenViewModal] = useState(false);
  const [infoViewModal, setInfoViewModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [infoEditModal, setInfoEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [infoDeleteModal, setInfoDeleteModal] = useState(false);

  function getProjectActive() {
    axios
      .get(`${urlApi}project/project-active`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setListActive(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  const getStatusLabel = (progress) => {
    if (progress <= 25) return { label: "Iniciado", color: "bg-blue-500" };
    if (progress <= 75) return { label: "En curso", color: "bg-yellow-500" };
    return { label: "Finalizando", color: "bg-green-500" };
  };

  useEffect(() => {
    getProjectActive();
  }, []);

  return (
    <div className="space-y-6">
      <div className="items-center justify-between">
        <h1 className="text-3xl font-bold">Proyectos activos</h1>
        <p className="text-muted-foreground">
          Gestione sus proyectos internos en curso
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listActive.map((project) => {
          const status = getStatusLabel(project.progress);

          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="items-center justify-between">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onClick={() => {
                            setOpenViewModal(true);
                            setInfoViewModal(project);
                          }}
                        >
                          <Eye className="h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onClick={() => {
                            setOpenEditModal(true);
                            setInfoEditModal(project);
                          }}
                        >
                          <Edit className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onClick={() => {
                            setOpenDeleteModal(true);
                            setInfoDeleteModal(project.id);
                          }}
                        >
                          <Undo2 className="h-4 w-4" /> Degradar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge className={`${status.color} text-white`}>
                    {status.label}
                  </Badge>
                </div>
                <CardDescription>
                  {project.description.length > 150
                    ? project.description.slice(0, 150) + "..."
                    : project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progreso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>
                <Button
                  onClick={() => onViewDetails(project)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalles
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <ViewProjectActive
        isOpen={openViewModal}
        onClose={() => setOpenViewModal(false)}
        info={infoViewModal}
      ></ViewProjectActive>

      <EditProjectActive
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        info={infoEditModal}
        urlApi={urlApi}
        refresh={() => getProjectActive()}
      ></EditProjectActive>

      <DeleteProjectActive
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        info={infoDeleteModal}
        urlApi={urlApi}
        refresh={() => getProjectActive()}
      ></DeleteProjectActive>
    </div>
  );
}
