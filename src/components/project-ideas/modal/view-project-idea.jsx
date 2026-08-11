/* eslint-disable react/prop-types */
import {
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@components/ui/card";
import Modal from "react-modal";
// import { Dialog } from "radix-ui";

export default function ViewProjectIdea({ isOpen, onClose, info }) {
  return (
    <>
      {/* <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />

          <Dialog.Content className="fixed bg-white p-10 rounded w-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Dialog.Title>Título</Dialog.Title>

            <Dialog.Description>{info.description}</Dialog.Description>

            <CardHeader>
              <CardTitle>Título</CardTitle>
              <CardDescription>{info.title}</CardDescription>
            </CardHeader>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root> */}
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
        <CardHeader className="">
          <CardTitle className="text-4xl text-center">{info.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex bg-[#ececec] rounded p-5 justify-center text-center">
          <CardDescription className="text-lg">
            {info.description}
          </CardDescription>
        </CardContent>
      </Modal>
    </>
  );
}
