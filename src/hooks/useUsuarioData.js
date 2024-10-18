import useFetch from "./useFetch";
import { useJwt } from "../context/JWTContext";
export default function useUsuariosData() {
  const { loading, triggerFetch } = useFetch();
  const { triggerFetch: updateFetch } = useFetch();
  const { triggerFetch: createFetch } = useFetch();
  const { triggerFetch: getFetch } = useFetch();
  const { triggerFetch: deleteFetch } = useFetch();
  const { token } = useJwt();
  const fetchAllUsuarios = async () => {
    const respuesta = await getFetch(
      "https://modisteria-back-production.up.railway.app/api/usuarios/getAllUsers",
      "GET",
      null,
      { "x-token": token }
    );
    return respuesta;
  };
  const initialFetchAllUsuarios = async () => {
    const respuesta = await triggerFetch(
      "https://modisteria-back-production.up.railway.app/api/usuarios/getAllUsers",
      "GET",
      null,
      { "x-token": token }
    );
    return respuesta;
  };
  const updateUsuario = async (id, infoUpdate) => {
    const respuesta = await updateFetch(
      `https://modisteria-back-production.up.railway.app/api/usuarios/updateUser/${id}`,
      "PUT",
      infoUpdate,
      { "x-token": token }
    );
    return respuesta;
  };
  const createUsuario = async (infoUpdate) => {
    const respuesta = await createFetch(
      `https://modisteria-back-production.up.railway.app/api/usuarios/createUsuario`,
      "POST",
      infoUpdate,
      { "x-token": token }
    );
    return respuesta;
  };
  const deleteUsuario = async (id) => {
    const respuesta = await deleteFetch(
      `https://modisteria-back-production.up.railway.app/api/usuarios/deleteUser/${id}`,
      "DELETE",
      null,
      { "x-token": token }
    );
    return respuesta;
  };

  return {
    initialFetchAllUsuarios,
    fetchAllUsuarios,
    deleteUsuario,
    createUsuario,
    updateUsuario,
    loading,
  };
}
