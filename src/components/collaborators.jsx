/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card.tsx";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@components/ui/select.tsx";
import { Input } from "@components/ui/input.tsx";
import { Button } from "@components/ui/button.tsx";
import { Badge } from "@components/ui/badge.tsx";
import { Label } from "@components/ui/label.tsx";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  MapPin,
  Phone,
  Globe,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function Collaborators({
  urlApi,
  apiKey,
  collaborators,
  refresh,
}) {
  const emptyFormData = {
    name: "",
    department: "",
    role: "",
    email: "",
    location: "",
    phone: "",
    website: "",
  };

  const [users, setUsers] = useState(collaborators);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const usersPerPage = 6;

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [users, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsEditing(false);
    setIsCreating(false);
  };

  // CRUD Operations
  const handleCreateUser = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedUser(null);
    setFormData(emptyFormData);
  };

  const handleEditUser = () => {
    if (selectedUser) {
      setIsEditing(true);
      setIsCreating(false);
      setFormData({
        name: selectedUser.name,
        department: selectedUser.department,
        role: selectedUser.role,
        email: selectedUser.email,
        location: selectedUser.location,
        phone: selectedUser.phone,
        website: selectedUser.website,
      });
    }
  };

  const handleSaveUser = async () => {
    if (!isFormValid) return;

    const request = async () => {
      // CREATE
      if (isCreating) {
        const response = await axios.post(`${urlApi}user`, formData, {
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
        });

        if (response.data.status !== "ok") {
          throw new Error(response.data.message);
        }

        // Idealmente viene del backend
        const createdUser = response.data.data || {
          id: Date.now(),
          ...formData,
          avatar: "/placeholder.svg?height=80&width=80",
        };

        setUsers((prev) => [...prev, createdUser]);

        setSelectedUser(createdUser);

        setIsCreating(false);

        refresh();

        return "Usuario creado correctamente";
      }

      // UPDATE
      if (isEditing && selectedUser) {
        const response = await axios.put(
          `${urlApi}user/${selectedUser.id}`,
          formData,
          {
            headers: {
              "Content-Type": "application/json",
              "api-key": apiKey,
            },
          },
        );

        if (response.data.status !== "ok") {
          throw new Error(response.data.message);
        }

        const updatedUser = {
          ...selectedUser,
          ...formData,
        };

        setUsers((prev) =>
          prev.map((user) =>
            user.id === selectedUser.id ? updatedUser : user,
          ),
        );

        setSelectedUser(updatedUser);

        setIsEditing(false);

        refresh();

        return "Usuario actualizado correctamente";
      }
    };

    toast.promise(request(), {
      loading: "Guardando cambios...",
      success: (msg) => msg,
      error: (err) => err.message || "Error en la solicitud de guardado",
    });

    setFormData(emptyFormData);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar a ${selectedUser.name}?`,
    );

    if (!confirmDelete) return;

    const request = async () => {
      const response = await axios.delete(`${urlApi}user/${selectedUser.id}`, {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      });

      if (response.data.status !== "ok") {
        throw new Error(response.data.message);
      }

      // Actualización local del state
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

      // Limpieza UI
      setSelectedUser(null);
      setIsEditing(false);
      refresh();

      return "Usuario eliminado correctamente";
    };

    toast.promise(request(), {
      loading: "Eliminando usuario...",
      success: (msg) => msg,
      error: (err) => err.message || "Error en la eliminación",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setFormData(emptyFormData);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    formData.name.trim() && formData.role && formData.department;

  async function fetchRoles() {
    try {
      const response = await axios.get(`${urlApi}user/roles`, {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      });
      if (response.data.data && Array.isArray(response.data.data)) {
        setSelectedRoles(response.data.data);
      } else {
        toast.error("No se pudieron cargar los roles");
      }
    } catch {
      toast.error("Error al cargar roles");
    }
  }

  async function fetchDepartment() {
    try {
      const response = await axios.get(`${urlApi}user/department`, {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      });
      if (response.data.data && Array.isArray(response.data.data)) {
        setSelectedDepartments(response.data.data);
      } else {
        toast.error("No se pudieron cargar los roles");
      }
    } catch {
      toast.error("Error al cargar roles");
    }
  }

  useEffect(() => {
    fetchRoles();
    fetchDepartment();
  }, []);

  return (
    <div className="p-4">
      <div className="w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Directorio de usuarios
          </h1>
          <p className="text-gray-600">
            Navega y busca en nuestra base de datos de usuarios
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sección de lista de usuarios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header con búsqueda */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold">
                      Usuarios ({filteredUsers.length})
                    </h2>
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar usuario
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar usuarios por Nombre, Email o Area..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* User Grid */}
            {currentUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentUsers.map((user) => (
                  <Card
                    key={user.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-blue-300 ${
                      selectedUser?.id === user.id
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onClick={() => handleUserClick(user)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        {/* <img
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        /> */}
                        <div className="flex-1 min-w-0 relative">
                          <span
                            className={`absolute top-0 right-0 rounded-full border border-solid px-1 text-xs ${user.role === "administradores" ? "border-purple-500 text-purple-600 bg-purple-500/40" : "border-blue-500 text-blue-600 bg-blue-500/40"}`}
                            style={{ textTransform: "capitalize" }}
                          >
                            {user.role
                              ? user.role === "administradores"
                                ? "Admin"
                                : user.role === "desarrolladores"
                                  ? "Desarrollador"
                                  : user.role
                              : "N/A"}
                          </span>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user.name || "N/A"}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {user.email || "N/A"}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {user.department || "N/A"}
                            </Badge>
                            {/* <span className="text-xs text-gray-500 truncate ml-2">
                              {user.location || "N/A"}
                            </span> */}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">
                      No se encontraron usuarios
                    </p>
                    <p className="text-sm">
                      Intente ajustar sus criterios de búsqueda
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, filteredUsers.length)} of{" "}
                      {filteredUsers.length} users
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel derecho: Detalles del usuario y CRUD */}
          <div className="lg:col-span-1 space-y-6">
            {/* Panel de detalles del usuario */}
            {selectedUser && !isEditing && !isCreating ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      {/* <img
                        src={selectedUser.avatar || "/placeholder.svg"}
                        alt={selectedUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      /> */}
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedUser.name || "N/A"}
                        </h3>
                        <Badge variant="secondary">
                          {selectedUser.department || "N/A"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditUser}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteUser}
                        className="text-red-600 hover:text-red-700 bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{selectedUser.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{selectedUser.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedUser.location || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4" />
                    <span>{selectedUser.website || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
            ) : isEditing || isCreating ? (
              /* CRUD Form */
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {isCreating ? "Crear Nuevo Usuario" : "Editar Usuario"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      placeholder="Ingrese el nombre completo"
                    />
                  </div>

                  {/* <div className="space-y-2">
                    <Label className="flex" htmlFor="email">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleFormChange("email", e.target.value)
                      }
                      placeholder="Introduzca su dirección de correo electrónico"
                    />
                  </div> */}

                  <div className="space-y-2">
                    <Label htmlFor="rol">Rol *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleFormChange("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>

                      <SelectContent>
                        {selectedRoles.map((opt) => (
                          <SelectItem
                            key={opt.id}
                            value={opt.id}
                            style={{ textTransform: "capitalize" }}
                          >
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Area *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        handleFormChange("department", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un area" />
                      </SelectTrigger>

                      <SelectContent>
                        {selectedDepartments.map((opt) => (
                          <SelectItem
                            key={opt.id}
                            value={opt.id}
                            style={{ textTransform: "capitalize" }}
                          >
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* <Input
                      id="role"
                      value={formData.department}
                      onChange={(e) =>
                        handleFormChange("department", e.target.value)
                      }
                      placeholder="Introducir puesto de trabajo"
                    /> */}
                  </div>

                  {/* <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        handleFormChange("location", e.target.value)
                      }
                      placeholder="Introducir ubicación"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleFormChange("phone", e.target.value)
                      }
                      placeholder="Introduzca el número de teléfono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) =>
                        handleFormChange("website", e.target.value)
                      }
                      placeholder="Introduzca la URL del sitio web"
                    />
                  </div> */}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveUser}
                      disabled={!isFormValid}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isCreating ? "Crear usuario" : "Guardar cambios"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Empty State */
              <Card className="sticky top-4">
                <CardContent className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>Seleccione un usuario para ver los detalles</p>
                    <p className="text-sm mt-2">or</p>
                    <Button onClick={handleCreateUser} className="mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear nuevo usuario
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
