/* eslint-disable react/prop-types */
import { CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import Modal from "react-modal";

export default function ViewProjectTask({ isOpen, onClose, info }) {
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
          <CardTitle>Titulo</CardTitle>
          <CardDescription>{info.title}</CardDescription>
          <br />
          <CardTitle>Descripción</CardTitle>
          <CardDescription>{info.description}</CardDescription>
          <br />
          <CardTitle>Asignado</CardTitle>
          <CardDescription>{info.assigned_to}</CardDescription>
        </CardHeader>
      </Modal>
    </>
  );
}
