/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button.tsx";
import { Plus, Briefcase } from "lucide-react";
import { ProjectCard } from "@components/price-tracker/modal/project-card.jsx";
import { ProjectForm } from "@components/price-tracker/modal/create-project-form.jsx";
import { ProjectDetail } from "@components/price-tracker/modal/project-detail.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog.tsx";

export default function Tracker({ urlApi }) {
  const API_BASE_URL = `${urlApi}prices`;

  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Mappers (defined inside to access potential context if needed, but pure here)
  const mapProjectFromBackend = (data) => ({
    id: data.id,
    name: data.name,
    client: data.client,
    description: data.description,
    currency: data.currency,
    mode: data.mode,
    totalPrice: Number(data.total_price),
    initialPaymentPercentage: Number(data.initial_payment_percentage),
    createdAt: data.created_at,
    phases: [], // Populated later
    parties: [], // Populated later
  });

  const mapPaymentFromBackend = (data) => ({
    id: data.id,
    projectId: data.project_id,
    phaseId: data.phase_id,
    amount: Number(data.amount),
    date: data.date,
    note: data.note,
    image: data.image,
    signature: data.signature,
    paymentMethod: data.payment_method,
    percentage: Number(data.percentage),
  });

  const mapPhaseFromBackend = (data) => ({
    id: data.id,
    name: data.name,
    price: Number(data.price),
    status: data.status,
  });

  const mapPartyFromBackend = (data) => ({
    id: data.id,
    name: data.name,
    role: data.role,
    note: data.note,
  });

  // Fetch all projects and payments on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Projects
      const projectsRes = await axios.get(`${API_BASE_URL}/projects`);
      // Backend returns { status: "ok", data: [...] }
      const projectsData = projectsRes.data.data.map(mapProjectFromBackend);

      // 2. Fetch Payments for all projects (to display progress on cards)
      const allPayments = [];
      await Promise.all(
        projectsData.map(async (project) => {
          try {
            const payRes = await axios.get(
              `${API_BASE_URL}/projects/${project.id}/payments`,
            );
            const mappedPayments = payRes.data.data.map(mapPaymentFromBackend);
            allPayments.push(...mappedPayments);
          } catch (err) {
            // Ignore 404 (no payments)
          }
        }),
      );

      setProjects(projectsData);
      setPayments(allPayments);
    } catch (error) {
      if (error.response?.status === 404) {
        setProjects([]);
        setPayments([]);
      } else {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch details (phases, parties) for a specific project
  const fetchProjectDetails = async (projectId) => {
    try {
      const [phasesRes, partiesRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/projects/${projectId}/phases`),
        axios.get(`${API_BASE_URL}/projects/${projectId}/involved-parties`),
      ]);

      const phases =
        phasesRes.status === "fulfilled"
          ? phasesRes.value.data.data.map(mapPhaseFromBackend)
          : [];
      const parties =
        partiesRes.status === "fulfilled"
          ? partiesRes.value.data.data.map(mapPartyFromBackend)
          : [];

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, phases, parties } : p)),
      );
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  };

  // When selecting a project, fetch its phases and parties if missing
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      // If phases/parties are missing (empty array could be valid, but initially undefined or empty implies not loaded if we assume lazy loading logic, but we initialized to empty array in mapper.
      // Better check: we can add a 'detailsLoaded' flag or just fetch every time to be safe/fresh.
      // Or check if empty and assume if empty we should try fetching? No, what if it really has no phases?
      // Let's just fetch every time we open details to ensure freshness.
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]); // Removed 'projects' dependency to avoid loop

  const handleCreateProject = async (projectData) => {
    try {
      // 1. Create Project
      const projectPayload = {
        name: projectData.name,
        client: projectData.client,
        description: projectData.description,
        currency: projectData.currency,
        mode: projectData.mode,
        total_price: projectData.totalPrice,
        initial_payment_percentage: projectData.initialPaymentPercentage,
      };

      const res = await axios.post(`${API_BASE_URL}/projects`, projectPayload);
      const newProjectId = res.data.data.id;

      // 2. Create Phases
      if (projectData.phases && projectData.phases.length > 0) {
        await Promise.all(
          projectData.phases.map((phase) =>
            axios.post(`${API_BASE_URL}/phases`, {
              project_id: newProjectId,
              name: phase.name,
              price: phase.price,
              status: phase.status,
            }),
          ),
        );
      }

      // 3. Create Parties
      if (projectData.parties && projectData.parties.length > 0) {
        await Promise.all(
          projectData.parties.map((party) =>
            axios.post(`${API_BASE_URL}/involved-parties`, {
              project_id: newProjectId,
              name: party.name,
              role: party.role,
              note: party.note,
            }),
          ),
        );
      }

      toast.success("Proyecto creado exitosamente");
      await fetchData(); // Refresh all data
      setShowCreateProject(false);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Error al crear el proyecto");
    }
  };

  const handleUpdateProject = async (data) => {
    if (!selectedProjectId) return;
    try {
      // 1. Update Project Fields
      await axios.put(`${API_BASE_URL}/projects/${selectedProjectId}`, {
        description: data.description,
        total_price: data.totalPrice,
      });

      // 2. Handle Phases Sync
      if (data.phases) {
        const currentProject = projects.find((p) => p.id === selectedProjectId);
        const currentPhases = currentProject?.phases || [];

        const addedPhases = data.phases.filter((p) => !p.id);
        const updatedPhases = data.phases.filter((p) => p.id);
        const deletedPhases = currentPhases.filter(
          (cp) => !data.phases.find((p) => p.id === cp.id),
        );

        await Promise.all([
          ...addedPhases.map((p) =>
            axios.post(`${API_BASE_URL}/phases`, {
              project_id: selectedProjectId,
              name: p.name,
              price: p.price,
              status: p.status,
            }),
          ),
          ...updatedPhases.map((p) =>
            axios.put(`${API_BASE_URL}/phases/${p.id}`, {
              status: p.status,
            }),
          ),
          ...deletedPhases.map((p) =>
            axios.delete(`${API_BASE_URL}/phases/${p.id}`),
          ),
        ]);
      }

      // 3. Handle Parties Sync
      if (data.parties) {
        const currentProject = projects.find((p) => p.id === selectedProjectId);
        const currentParties = currentProject?.parties || [];

        const addedParties = data.parties.filter((p) => !p.id);
        const deletedParties = currentParties.filter(
          (cp) => !data.parties.find((p) => p.id === cp.id),
        );

        await Promise.all([
          ...addedParties.map((p) =>
            axios.post(`${API_BASE_URL}/involved-parties`, {
              project_id: selectedProjectId,
              name: p.name,
              role: p.role,
              note: p.note,
            }),
          ),
          ...deletedParties.map((p) =>
            axios.delete(`${API_BASE_URL}/involved-parties/${p.id}`),
          ),
        ]);
      }

      toast.success("Proyecto actualizado");
      await fetchData();
      await fetchProjectDetails(selectedProjectId);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Error al actualizar el proyecto");
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    try {
      await axios.delete(`${API_BASE_URL}/projects/${selectedProjectId}`);
      toast.success("Proyecto eliminado");
      setProjects((prev) => prev.filter((p) => p.id !== selectedProjectId));
      setPayments((prev) =>
        prev.filter((p) => p.projectId !== selectedProjectId),
      );
      setSelectedProjectId(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error al eliminar el proyecto");
    }
  };

  const handleAddPayment = async (paymentData) => {
    if (!selectedProjectId) return;
    try {
      const formData = new FormData();
      formData.append("project_id", selectedProjectId);
      if (paymentData.phaseId) formData.append("phase_id", paymentData.phaseId);
      formData.append("amount", paymentData.amount);
      formData.append("date", paymentData.date);
      if (paymentData.note) formData.append("note", paymentData.note);
      if (paymentData.paymentMethod)
        formData.append("payment_method", paymentData.paymentMethod);
      if (paymentData.percentage)
        formData.append("percentage", paymentData.percentage);

      if (paymentData.image) {
        formData.append("image", paymentData.image);
      }
      if (paymentData.signature) {
        formData.append("signature", paymentData.signature, "signature.png");
      }

      const res = await axios.post(`${API_BASE_URL}/payments`, formData);
      const newPayment = {
        ...paymentData,
        image:
          paymentData.image instanceof File
            ? URL.createObjectURL(paymentData.image)
            : paymentData.image,
        signature:
          paymentData.signature instanceof Blob
            ? URL.createObjectURL(paymentData.signature)
            : paymentData.signature,
        id: res.data.data.id,
        projectId: selectedProjectId,
      };

      setPayments((prev) => [...prev, newPayment]);
      toast.success("Pago registrado");

      if (paymentData.phaseId) {
        // Wait a bit and check phase status
        setTimeout(
          () =>
            checkAndUpdatePhaseStatus(paymentData.phaseId, selectedProjectId),
          500,
        );
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Error al registrar pago");
    }
  };

  const handleEditPayment = async (paymentId, data) => {
    try {
      if (data.note) {
        await axios.put(`${API_BASE_URL}/payments/${paymentId}`, {
          note: data.note,
        });
      }

      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, note: data.note || p.note } : p,
        ),
      );
      toast.success("Pago actualizado");

      const payment = payments.find((p) => p.id === paymentId);
      if (payment?.phaseId) {
        setTimeout(
          () => checkAndUpdatePhaseStatus(payment.phaseId, payment.projectId),
          500,
        );
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Error al actualizar pago");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      const payment = payments.find((p) => p.id === paymentId);
      await axios.delete(`${API_BASE_URL}/payments/${paymentId}`);
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      toast.success("Pago eliminado");

      if (payment?.phaseId) {
        setTimeout(
          () => checkAndUpdatePhaseStatus(payment.phaseId, payment.projectId),
          500,
        );
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Error al eliminar pago");
    }
  };

  const handleAddPhase = async (phase) => {
    if (!selectedProjectId) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/phases`, {
        project_id: selectedProjectId,
        name: phase.name,
        price: phase.price,
        status: phase.status || "pending",
      });

      const newPhase = {
        ...phase,
        id: res.data.data.id,
        status: phase.status || "pending",
      };

      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== selectedProjectId) return project;
          // Optimistic update of phases list and total price
          const updatedPhases = [...(project.phases || []), newPhase];
          return {
            ...project,
            phases: updatedPhases,
            totalPrice: (project.totalPrice || 0) + Number(newPhase.price),
          };
        }),
      );
      toast.success("Fase agregada");
    } catch (error) {
      console.error("Error adding phase:", error);
      toast.error("Error al agregar fase");
    }
  };

  const handleDeletePhase = async (phaseId) => {
    if (!selectedProjectId) return;
    try {
      await axios.delete(`${API_BASE_URL}/phases/${phaseId}`);

      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== selectedProjectId) return project;
          const updatedPhases =
            project.phases?.filter((p) => p.id !== phaseId) || [];
          return {
            ...project,
            phases: updatedPhases,
            totalPrice: updatedPhases.reduce((sum, p) => sum + p.price, 0),
          };
        }),
      );
      toast.success("Fase eliminada");
    } catch (error) {
      console.error("Error deleting phase:", error);
      toast.error("Error al eliminar fase");
    }
  };

  const handleUpdatePhase = async (phaseId, updates) => {
    if (!selectedProjectId) return;
    try {
      if (updates.status) {
        await axios.put(`${API_BASE_URL}/phases/${phaseId}`, {
          status: updates.status,
        });
      }

      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== selectedProjectId) return project;
          const updatedPhases =
            project.phases?.map((p) =>
              p.id === phaseId ? { ...p, ...updates } : p,
            ) || [];
          return {
            ...project,
            phases: updatedPhases,
            totalPrice: updatedPhases.reduce((sum, p) => sum + p.price, 0),
          };
        }),
      );
      toast.success("Fase actualizada");
    } catch (error) {
      console.error("Error updating phase:", error);
      toast.error("Error al actualizar fase");
    }
  };

  const checkAndUpdatePhaseStatus = async (phaseId, projectId) => {
    try {
      // Fetch fresh payments
      const payRes = await axios.get(
        `${API_BASE_URL}/projects/${projectId}/payments`,
      );
      const freshPayments = payRes.data.data.map(mapPaymentFromBackend);

      const project = projects.find((p) => p.id === projectId);
      // We might need to refresh phases too if we want to be super safe, but assuming local phases are reasonably improving.
      // Actually fetch fresh phases to get the price safe.
      const phaseRes = await axios.get(
        `${API_BASE_URL}/projects/${projectId}/phases`,
      );
      const phases = phaseRes.data.data.map(mapPhaseFromBackend);

      const phase = phases.find((p) => p.id === phaseId);
      if (!phase) return;

      const phasePaid = freshPayments
        .filter((p) => p.phaseId === phaseId)
        .reduce((sum, p) => sum + p.amount, 0);

      let newStatus = "pending";
      if (phasePaid >= phase.price) newStatus = "paid";
      else if (phasePaid > 0) newStatus = "in-progress";

      if (phase.status !== newStatus) {
        await axios.put(`${API_BASE_URL}/phases/${phaseId}`, {
          status: newStatus,
        });

        // Update local state
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              phases: p.phases?.map((ph) =>
                ph.id === phaseId ? { ...ph, status: newStatus } : ph,
              ),
            };
          }),
        );
      }
    } catch (e) {
      console.error("AutoUpdatePhaseStatus error", e);
    }
  };

  if (selectedProject) {
    return (
      <main className="min-h-screen bg-[#F8F8F8]">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
          <ProjectDetail
            project={selectedProject}
            payments={payments}
            onBack={() => setSelectedProjectId(null)}
            onAddPayment={handleAddPayment}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
            onUpdatePhase={handleUpdatePhase}
            onDeletePhase={handleDeletePhase}
            onAddPhase={handleAddPhase}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">EdenLabs Ledger</h1>
            <p className="text-[#555555] text-sm mt-1">
              Realice un seguimiento de sus proyectos y pagos
            </p>
          </div>
          <Button onClick={() => setShowCreateProject(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo proyecto</span>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#555555]">
            Cargando proyectos...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#EEEEEE] mb-4">
              <Briefcase className="w-8 h-8 text-[#555555]" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No hay proyectos todavía
            </h2>
            <p className="text-[#555555] mb-6">
              Crea tu primer proyecto para comenzar a rastrear pagos
            </p>
            <Button
              onClick={() => setShowCreateProject(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear proyecto
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  payments={payments}
                  onClick={() => setSelectedProjectId(project.id)}
                />
              ))}
          </div>
        )}

        <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear nuevo proyecto</DialogTitle>
            </DialogHeader>
            <ProjectForm
              mode="create"
              onSubmit={handleCreateProject}
              onCancel={() => setShowCreateProject(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
