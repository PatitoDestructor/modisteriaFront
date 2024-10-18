import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
export default function useModals(
  canSendCode,
  email,
  otpCode,
  nuevaContraseña,
  confirmarNuevaContraseña
) {
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [showModal3, setShowModal3] = useState(false);
  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const toggleModal2 = () => {
    setShowModal2(!showModal2);
  };

  const toggleModal3 = () => {
    setShowModal3(!showModal3);
  };
  const handleChangePass = async () => {
    if (
      nuevaContraseña != confirmarNuevaContraseña ||
      nuevaContraseña?.length < 8
    )
      return;

    axios
      .post(
        "https://modisteria-back-production.up.railway.app/api/usuarios/resetPassword",
        { email, codigo: otpCode, newPassword: nuevaContraseña }
      )
      .then(() => {
        toast.success("Contraseña actualizada correctamente!", {
          toastId: "actualizarPass",
          autoClose: 2000,
        });
        toggleModal3();
      })
      .catch(() => {
        toast.error("Error al actualizar la contraseña!", {
          toastId: "errorActualizarContraseña",
        });
      });
  };

  const handleSendCode = async () => {
    if (!canSendCode) return;
    console.log("estás dentro");
    axios
      .post(
        "https://modisteria-back-production.up.railway.app/api/usuarios/forgotPassword",
        { email }
      )
      .then(() => {})
      .finally(() => {
        toggleModal();
        toggleModal2();
      });
  };
  const changeMail = () => {
    toggleModal2();
    toggleModal();
  };

  const handleVerifyCode = async () => {
    axios
      .post(
        "https://modisteria-back-production.up.railway.app/api/usuarios/getCodePass",
        { email }
      )
      .then((response) => {
        if (otpCode !== response.data.msg) {
          toast.error("Código incorrecto!", {
            toastId: "toastErrorCode",
            autoClose: 500,
          });
          return;
        }
        toast.success("Código válido 😊", {
          toastId: "toastSuccessCode",
          autoClose: 1000,
        });
        toggleModal2();
        toggleModal3();
      });
  };
  return {
    showModal,
    showModal2,
    showModal3,
    toggleModal,
    toggleModal2,
    toggleModal3,
    handleSendCode,
    changeMail,
    handleVerifyCode,
    handleChangePass,
  };
}
