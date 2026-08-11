/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import {
  Plus,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
} from "lucide-react";
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

import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";
import EditProjectIdea from "@components/project-ideas/modal/edit-project-idea";
import DeleteProjectIdea from "@components/project-ideas/modal/delete-project-idea";
import ViewProjectIdea from "@components/project-ideas/modal/view-project-idea";

export default function ProjectIdeas({ urlApi }) {
  const [listIdeas, setListIdeas] = useState([]);
  // const [error, setError] = useState("");
  // const [loading, setLoading] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");

  const [openViewModal, setOpenViewModal] = useState(false);
  const [infoViewModal, setInfoViewModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [infoEditModal, setInfoEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [infoDeleteModal, setInfoDeleteModal] = useState(false);
  const [activeIdeaId, setActiveIdeaId] = useState(null);

  function getProjectIdea() {
    axios
      .get(`${urlApi}idea`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setListIdeas(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async function handleAddProjectIdea() {
    // setLoading(true);
    // setError("");

    const project_idea = {
      title: ideaTitle,
      description: ideaDescription,
      type_id: 1,
    };

    toast.promise(
      axios
        .post(`${urlApi}idea`, project_idea, {
          headers: {
            "Content-Type": "application/json",
            // "api-key": apiKey,
          },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            setIdeaTitle("");
            setIdeaDescription("");
            // setLoading(false);
            getProjectIdea();
            return "Idea agregada con éxito";
          } else {
            throw new Error(
              "Error al agregar la idea: " + response.data.message
            );
          }
        }),
      {
        loading: "Guardando cambios...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  }

  async function handleActivateProject(idActivate) {
    // if (!idActivate) {
    //   setError("No hay un curso válido para actualizar");
    //   return;
    // }

    // setLoading(true);
    // setError("");

    toast.promise(
      axios
        .put(`${urlApi}idea/active/${idActivate}`, {
          headers: {
            "Content-Type": "application/json",
            // "api-key": apiKey,
          },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            // setLoading(false);
            getProjectIdea();
            return "Idea activada con éxito";
          } else {
            throw new Error("Error al activar la idea");
          }
        }),
      {
        loading: "Activando idea...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de activación",
      }
    );
  }

  const handleConfirmActive = (idActivate) => {
    const confirmed = window.confirm("¿Estás seguro de activar esta idea?");
    if (confirmed) {
      handleActivateProject(idActivate);
    }
  };

  useEffect(() => {
    getProjectIdea();
  }, []);

  return (
    <div className="space-y-6">
      <div className="items-center justify-between">
        <h1 className="text-3xl font-bold">Ideas de proyectos</h1>
        <p className="text-muted-foreground">
          Transforma tus ideas en proyectos activos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Añadir nueva idea</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="idea-title">Título</Label>
            <Input
              id="idea-title"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
              placeholder="Introduzca el título del proyecto"
            />
          </div>
          <div>
            <Label htmlFor="idea-description">Descripción</Label>
            <Textarea
              id="idea-description"
              value={ideaDescription}
              onChange={(e) => setIdeaDescription(e.target.value)}
              placeholder="Describe tu idea de proyecto"
            />
          </div>
          <Button
            onClick={handleAddProjectIdea}
            disabled={!ideaTitle.trim() || !ideaDescription.trim()}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir idea
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listIdeas.map((idea) => (
          <Card key={idea.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg select-none">
                  {idea.title}
                </CardTitle>
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
                        setInfoViewModal(idea);
                      }}
                    >
                      <Eye className="h-4 w-4" /> Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:cursor-pointer"
                      onClick={() => {
                        setOpenEditModal(true);
                        setInfoEditModal(idea);
                      }}
                    >
                      <Edit className="h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:cursor-pointer"
                      onClick={() => {
                        setOpenDeleteModal(true);
                        setInfoDeleteModal(idea.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="select-none">
                {idea.description.length > 150
                  ? idea.description.slice(0, 150) + "..."
                  : idea.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeIdeaId === idea.id ? (
                <div>
                  <CardDescription className="pb-2">
                    ¿Estás seguro de guardar los cambios?
                  </CardDescription>
                  <div className="flex gap-4">
                    <Button
                      className="w-full"
                      onClick={() => handleConfirmActive(idea.id)}
                    >
                      Sí
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => setActiveIdeaId(null)}
                    >
                      No
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setActiveIdeaId(idea.id)}
                  className="w-full"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Activar
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ViewProjectIdea
        isOpen={openViewModal}
        onClose={() => setOpenViewModal(false)}
        info={infoViewModal}
      ></ViewProjectIdea>

      <EditProjectIdea
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        info={infoEditModal}
        urlApi={urlApi}
        refresh={() => getProjectIdea()}
      ></EditProjectIdea>

      <DeleteProjectIdea
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        info={infoDeleteModal}
        urlApi={urlApi}
        refresh={() => getProjectIdea()}
      ></DeleteProjectIdea>
    </div>
  );
}
