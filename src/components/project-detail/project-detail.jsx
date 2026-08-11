/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import {
  Plus,
  MoreHorizontal,
  ArrowLeft,
  Eye,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import axios from "axios";
import { toast } from "sonner";
import ViewProjectTask from "@components/project-detail/modal/view-project-detail.jsx";
import EditProjectTask from "@components/project-detail/modal/edit-project-detail.jsx";
import DeleteProjectTask from "@components/project-detail/modal/delete-project-detail.jsx";

const column_translations = {
  pending: "Pendiente",
  inProgress: "En progreso",
  completed: "Completado",
};

const columns = ["pending", "inProgress", "completed"];

const STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
};

export default function ProjectDetail({
  urlApi,
  project,
  onBack,
  collaborators,
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssigned, setTaskAssigned] = useState("");

  const [openViewModal, setOpenViewModal] = useState(false);
  const [infoViewModal, setInfoViewModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [infoEditModal, setInfoEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [infoDeleteModal, setInfoDeleteModal] = useState(false);

  const [tasks, setTasks] = useState({
    pending: [],
    inProgress: [],
    completed: [],
  });

  const getProjectDetails = async () => {
    try {
      const response = await axios.get(
        `${urlApi}project/partners/${project.id}`,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      const organized = {
        pending: [],
        inProgress: [],
        completed: [],
      };

      response.data.data.forEach((task) => {
        if (organized[task.status]) {
          organized[task.status].push(task);
        }
      });

      setTasks(organized);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getProjectDetails();
  }, [urlApi, project.id]);

  const handleAddTask = async () => {
    const project_task = {
      project_id: project.id,
      title: taskTitle,
      description: taskDescription,
      assigned_to: taskAssigned,
      status: STATUS.PENDING,
    };

    toast.promise(
      axios
        .post(`${urlApi}task`, project_task, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            setTaskTitle("");
            setTaskDescription("");
            setTaskAssigned("");
            getProjectDetails();
            return "Tarea agregada con éxito";
          } else {
            throw new Error(
              "Error al agregar la tarea: " + response.data.message,
            );
          }
        }),
      {
        loading: "Guardando cambios...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      },
    );
  };

  const onMoveTask = async (idTask, statusTask) => {
    const moveIn = { status: statusTask };

    toast.promise(
      axios
        .put(`${urlApi}task/state/${idTask}`, moveIn, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            getProjectDetails();
            return "Tarea movida con éxito";
          } else {
            throw new Error("Error al mover la tarea");
          }
        }),
      {
        loading: "Moviendo tarea...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud",
      },
    );
  };

  const isAddButtonDisabled =
    !taskTitle.trim() || !taskDescription.trim() || !taskAssigned;

  const handleViewTask = (task) => {
    setOpenViewModal(true);
    setInfoViewModal(task);
  };

  const handleEditTask = (task) => {
    setOpenEditModal(true);
    setInfoEditModal(task);
  };

  const handleDeleteTask = (taskId) => {
    setOpenDeleteModal(true);
    setInfoDeleteModal(taskId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Volver
        </Button>
        <h1 className="text-3xl font-bold">{project?.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar nueva tarea</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>Nombre de la tarea</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Colaborador</Label>
              <Select value={taskAssigned} onValueChange={setTaskAssigned}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAddTask}
            disabled={isAddButtonDisabled}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar tarea
          </Button>
        </CardContent>
      </Card>

      <div>
        {/* <div className="px-4">
          <select name="" id="">
            <option value="">a</option>
            <option value="">b</option>
            <option value="">c</option>
          </select>
        </div> */}

        <div className="grid gap-6 md:grid-cols-3">
          {columns.map((column) => (
            <Card key={column}>
              <div></div>
              <CardHeader>
                <CardTitle>
                  {column_translations[column]} ({tasks[column].length})
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {tasks[column].map((task) => (
                  <Card key={task.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <h4>{task.title}</h4>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleViewTask(task)}
                            >
                              <Eye /> Ver
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleEditTask(task)}
                            >
                              <Edit /> Editar
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {task.description.length > 150
                          ? task.description.slice(0, 150) + "..."
                          : task.description}
                      </p>

                      <div className="flex justify-between">
                        <Badge variant="outline">{task.assigned_to}</Badge>

                        <div className="flex items-center gap-1">
                          {column === STATUS.COMPLETED && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  onMoveTask(task.id, STATUS.PENDING)
                                }
                              >
                                <ChevronsLeft size={16} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  onMoveTask(task.id, STATUS.IN_PROGRESS)
                                }
                              >
                                <ChevronLeft size={16} />
                              </Button>
                            </>
                          )}

                          {column === STATUS.IN_PROGRESS && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  onMoveTask(task.id, STATUS.PENDING)
                                }
                              >
                                <ChevronLeft size={16} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  onMoveTask(task.id, STATUS.COMPLETED)
                                }
                              >
                                <ChevronRight size={16} />
                              </Button>
                            </>
                          )}

                          {column === STATUS.PENDING && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  onMoveTask(task.id, STATUS.IN_PROGRESS)
                                }
                              >
                                <ChevronRight size={16} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  onMoveTask(task.id, STATUS.COMPLETED)
                                }
                              >
                                <ChevronsRight size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ViewProjectTask
        isOpen={openViewModal}
        onClose={() => setOpenViewModal(false)}
        info={infoViewModal}
      />

      <EditProjectTask
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        info={infoEditModal}
        urlApi={urlApi}
        collaborators={collaborators}
        refresh={getProjectDetails}
      />

      <DeleteProjectTask
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        info={infoDeleteModal}
        urlApi={urlApi}
        refresh={getProjectDetails}
      />
    </div>
  );
}
