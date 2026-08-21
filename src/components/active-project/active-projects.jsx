/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Eye, Edit, Undo2, MoreHorizontal, FolderOpen } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import axios from "axios";
import EditProjectActive from "@components/active-project/modal/edit-active-project.jsx";
import DeleteProjectActive from "@components/active-project/modal/delete-active-project.jsx";
import ViewProjectActive from "@components/active-project/modal/view-active-project.jsx";
import { ProgressRing, StatusBadge, ProjectsStatsRow, PageHeaderIcon } from "@components/projects-shared.jsx";

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

  useEffect(() => {
    getProjectActive();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3.5">
        <PageHeaderIcon>
          <FolderOpen className="w-[21px] h-[21px] text-neutral-700" />
        </PageHeaderIcon>
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-950">
            Proyectos activos
          </h1>
          <p className="text-[13.5px] text-muted-foreground">
            Gestione sus proyectos internos en curso
          </p>
        </div>
      </div>

      <ProjectsStatsRow projects={listActive} />

      <div className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
        {listActive.map((project) => (
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
                    <Undo2 className="h-4 w-4" /> Degradar
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
