import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, MoreHorizontal, Briefcase } from "lucide-react";
import { Button } from "@components/ui/button";
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
import EditProjectFreelance from "@components/project-ideas/modal/edit-project-idea";
import DeleteProjectFreelance from "@components/project-ideas/modal/delete-project-idea";
import ViewProjectFreelance from "@components/project-ideas/modal/view-project-idea";
import { ProgressRing, StatusBadge, ProjectsStatsRow, PageHeaderIcon } from "@components/projects-shared.jsx";

// eslint-disable-next-line react/prop-types
export default function FreelanceProjects({ urlApi, onViewDetails }) {
  const [listFreelance, setListFreelance] = useState([]);
  // const [error, setError] = useState("");
  // const [loading, setLoading] = useState("");
  const [freelanceTitle, setFreelanceTitle] = useState("");
  const [freelanceDescription, setFreelanceDescription] = useState("");

  const [openViewModal, setOpenViewModal] = useState(false);
  const [infoViewModal, setInfoViewModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [infoEditModal, setInfoEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [infoDeleteModal, setInfoDeleteModal] = useState(false);

  function getProjectFreelance() {
    axios
      .get(`${urlApi}project/project-freelance`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setListFreelance(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async function handleAddProjectFreelance() {
    // setLoading(true);
    // setError("");

    const project_freelance = {
      title: freelanceTitle,
      description: freelanceDescription,
      type_id: 2,
      status: "starting",
      activate: 1,
    };

    toast.promise(
      axios
        .post(`${urlApi}project/save-freelance`, project_freelance, {
          headers: {
            "Content-Type": "application/json",
            // "api-key": apiKey,
          },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            setFreelanceTitle("");
            setFreelanceDescription("");
            // setLoading(false);
            getProjectFreelance();
            return "Proyecto agregado con éxito";
          } else {
            throw new Error(
              "Error al agregar el proyecto: " + response.data.message
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

  useEffect(() => {
    getProjectFreelance();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3.5">
        <PageHeaderIcon>
          <Briefcase className="w-[21px] h-[21px] text-neutral-700" />
        </PageHeaderIcon>
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950">
            Proyectos empresa
          </h1>
          <p className="text-[13.5px] text-muted-foreground">
            Realice un seguimiento de los proyectos de sus clientes
          </p>
        </div>
      </div>

      <ProjectsStatsRow projects={listFreelance} />

      <div className="rounded-[14px] border border-[#ededed] bg-gradient-to-b from-[#fbfbfb] to-white px-6 py-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-neutral-900">
            <Plus className="h-[15px] w-[15px] text-white" />
          </div>
          <h2 className="text-[15px] font-bold text-neutral-950">Agregar nuevo proyecto</h2>
        </div>

        <div className="mb-[18px] grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name" className="text-xs font-semibold text-neutral-700">
              Nombre del proyecto
            </Label>
            <Input
              id="project-name"
              value={freelanceTitle}
              onChange={(e) => setFreelanceTitle(e.target.value)}
              placeholder="Introduzca el nombre del proyecto"
              className="h-10 rounded-lg border-neutral-200 text-[13px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description" className="text-xs font-semibold text-neutral-700">
              Descripción
            </Label>
            <Textarea
              id="project-description"
              value={freelanceDescription}
              onChange={(e) => setFreelanceDescription(e.target.value)}
              placeholder="Describe el proyecto de empresa"
              className="min-h-10 resize-y rounded-lg border-neutral-200 py-2 text-[13px]"
              rows={1}
            />
          </div>
        </div>

        <Button
          onClick={handleAddProjectFreelance}
          disabled={!freelanceTitle.trim() | !freelanceDescription.trim()}
          className="h-[41px] rounded-[9px] px-[22px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar proyecto
        </Button>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-neutral-400">
          Proyectos en curso
        </span>
        <div className="h-px flex-1 bg-neutral-100" />
      </div>

      <div className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
        {listFreelance.map((project) => (
          <div
            key={project.id}
            className="flex flex-col gap-4 rounded-[14px] border border-[#ededed] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_20px_-12px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[16.5px] font-bold leading-snug text-neutral-950">
                {project.title}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1.5 -mt-1 text-neutral-400">
                    <MoreHorizontal className="w-[18px] h-[18px]" />
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
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-4">
              <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-neutral-500 line-clamp-3">
                {project.description}
              </p>
              <ProgressRing progress={project.progress} />
            </div>

            <StatusBadge progress={project.progress} />

            <Button
              onClick={() => onViewDetails(project)}
              className="h-10 w-full rounded-[9px]"
            >
              <Eye className="w-[15px] h-[15px] mr-1.5" />
              Ver detalles
            </Button>
          </div>
        ))}
      </div>

      <ViewProjectFreelance
        isOpen={openViewModal}
        onClose={() => setOpenViewModal(false)}
        info={infoViewModal}
      ></ViewProjectFreelance>

      <EditProjectFreelance
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        info={infoEditModal}
        urlApi={urlApi}
        refresh={() => getProjectFreelance()}
      ></EditProjectFreelance>

      <DeleteProjectFreelance
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        info={infoDeleteModal}
        urlApi={urlApi}
        refresh={() => getProjectFreelance()}
      ></DeleteProjectFreelance>
    </div>
  );
}
