/* eslint-disable react/prop-types */
import { CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import Modal from "react-modal";

export default function ViewProjectIdea({ isOpen, onClose, info }) {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Vista del contenido"
        style={{
          overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
          content: {
            width: "400px",
            height: "fit-content",
            margin: "auto",
            borderRadius: "8px",
            padding: "40px",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <CardHeader>
          <CardTitle>Titulo:</CardTitle>
          <CardDescription>{info.title}</CardDescription>
          <br />
          <CardTitle>Descripción:</CardTitle>
          <CardDescription>{info.description}</CardDescription>
          <br />
          <CardTitle>Estado:</CardTitle>
          <CardDescription>{info.status}</CardDescription>
          <br />
          <CardTitle>Tipo de proyecto:</CardTitle>
          <CardDescription>
            {info.type_id == 1
              ? "Proyecto Independiente"
              : "Proyecto Empresarial"}
          </CardDescription>
        </CardHeader>
      </Modal>
    </>
  );
}
