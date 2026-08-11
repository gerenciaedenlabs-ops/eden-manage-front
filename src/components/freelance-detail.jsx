/* eslint-disable react/prop-types */
import { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
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

export default function FreelanceDetail({
  project,
  tasks,
  collaborators,
  onAddTask,
  onMoveTask,
  onBack,
}) {
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    assignee: "",
  });

  const handleAddTask = () => {
    if (newTask.name && newTask.description && newTask.assignee) {
      onAddTask(newTask);
      setNewTask({ name: "", description: "", assignee: "" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          ← Volver
        </Button>
        <h1 className="text-3xl font-bold">{project?.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar nueva tarea</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <div>
              <Label htmlFor="task-name">Nombre de la tarea</Label>
              <Input
                id="task-name"
                value={newTask.name}
                onChange={(e) =>
                  setNewTask({ ...newTask, name: e.target.value })
                }
                placeholder="Introduzca el nombre de la tarea"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Descripción</Label>
              <Input
                id="task-description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Descripción de la tarea"
              />
            </div>
            <div>
              <Label htmlFor="task-assignee">Asignado</Label>
              <Select
                value={newTask.assignee}
                onValueChange={(value) =>
                  setNewTask({ ...newTask, assignee: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar asignación" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((collaborator) => (
                    <SelectItem key={collaborator.id} value={collaborator.name}>
                      {collaborator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddTask} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Agregar tarea
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {["pending", "inProgress", "completed"].map((column) => (
          <Card key={column}>
            <CardHeader>
              <CardTitle className="capitalize">
                {column === "inProgress" ? "In Progress" : column}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks[column].map((task) => (
                <Card key={task.id} className="p-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">{task.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{task.assignee}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {column !== "pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                onMoveTask(task.id, column, "pending")
                              }
                            >
                              Mover a Pendiente
                            </DropdownMenuItem>
                          )}
                          {column !== "inProgress" && (
                            <DropdownMenuItem
                              onClick={() =>
                                onMoveTask(task.id, column, "inProgress")
                              }
                            >
                              Mover a En progreso
                            </DropdownMenuItem>
                          )}
                          {column !== "completed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                onMoveTask(task.id, column, "completed")
                              }
                            >
                              Mover a Completado
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
