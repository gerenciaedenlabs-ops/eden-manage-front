/* eslint-disable react/prop-types */
// Vincular un repositorio de GitHub a un proyecto: "existente" busca entre
// los repos visibles a la GitHub App instalada en la org (GET /github/repos,
// requiere admin); "nuevo" lo crea directo en la org vía la API de GitHub y
// lo vincula en el mismo paso. Ver manager.controller.js
// (/:project_id/repositories/*) y github.controller.js (/github/repos).
import { useState, useEffect } from "react";
import { CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Checkbox } from "@components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { GitBranch, Lock, Globe, Search } from "lucide-react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { authHeaders, getCurrentUserId } from "@components/project-detail/task-constants.js";

export default function LinkRepoModal({ isOpen, onClose, urlApi, projectId, refresh }) {
  const [tab, setTab] = useState("existing");

  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || tab !== "existing" || repos.length > 0) return;

    setLoadingRepos(true);
    axios
      .get(`${urlApi}github/repos`, { headers: authHeaders() })
      .then((response) => {
        if (response.data.status === "ok") setRepos(response.data.data);
      })
      .catch((error) => {
        console.error(error);
        toast.error("No se pudo consultar GitHub (¿la App está instalada y configurada?)");
      })
      .finally(() => setLoadingRepos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  const resetState = () => {
    setTab("existing");
    setRepos([]);
    setSearch("");
    setSelected(null);
    setName("");
    setDescription("");
    setIsPrivate(true);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const filteredRepos = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleLinkExisting = () => {
    if (!selected) return;
    setSubmitting(true);

    toast.promise(
      axios
        .post(
          `${urlApi}project/${projectId}/repositories/link`,
          { repo_full_name: selected.full_name, created_by: getCurrentUserId() },
          { headers: authHeaders() }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            handleClose();
            return "Repositorio vinculado con éxito";
          }
          throw new Error(response.data.message || "Error al vincular");
        })
        .finally(() => setSubmitting(false)),
      {
        loading: "Vinculando repositorio...",
        success: (msg) => msg,
        error: (err) => err.response?.data?.message || err.message || "Error en la solicitud",
      }
    );
  };

  const handleCreateNew = () => {
    if (!name.trim()) return;
    setSubmitting(true);

    toast.promise(
      axios
        .post(
          `${urlApi}project/${projectId}/repositories/create`,
          { name: name.trim(), description, isPrivate, created_by: getCurrentUserId() },
          { headers: authHeaders() }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            handleClose();
            return `Repositorio "${response.data.data.full_name}" creado y vinculado`;
          }
          throw new Error(response.data.message || "Error al crear el repositorio");
        })
        .finally(() => setSubmitting(false)),
      {
        loading: "Creando repositorio en GitHub...",
        success: (msg) => msg,
        error: (err) => err.response?.data?.message || err.message || "Error en la solicitud",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Vincular repositorio"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(520px, 90vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          margin: "auto",
          borderRadius: "8px",
          padding: "32px",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <CardHeader>
        <CardTitle>Vincular repositorio</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1">
              Repo existente
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">
              Crear nuevo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 pt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar repositorio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto border rounded-md p-1">
              {loadingRepos && (
                <p className="text-xs text-muted-foreground p-3">Consultando GitHub...</p>
              )}

              {!loadingRepos && filteredRepos.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">
                  {repos.length === 0
                    ? "La GitHub App no tiene acceso a ningún repositorio."
                    : "Sin resultados."}
                </p>
              )}

              {filteredRepos.map((repo) => (
                <button
                  type="button"
                  key={repo.full_name}
                  onClick={() => setSelected(repo)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60 ${
                    selected?.full_name === repo.full_name ? "bg-muted" : ""
                  }`}
                >
                  <GitBranch className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{repo.full_name}</span>
                  {repo.private ? (
                    <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              disabled={!selected || submitting}
              onClick={handleLinkExisting}
            >
              {submitting ? "Vinculando..." : "Vincular repositorio"}
            </Button>
          </TabsContent>

          <TabsContent value="new" className="space-y-3 pt-3">
            <Input
              placeholder="Nombre del repositorio"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[70px]"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={isPrivate} onCheckedChange={setIsPrivate} />
              Repositorio privado
            </label>

            <Button
              className="w-full"
              disabled={!name.trim() || submitting}
              onClick={handleCreateNew}
            >
              {submitting ? "Creando..." : "Crear y vincular"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Modal>
  );
}
