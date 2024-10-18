//mirando
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  MenuItem,
  Switch,
} from "@mui/material";
import constants from "../../assets/constants.d";
import Loading from "../../components/loading/Loading";
import { TrashColor, Edit } from "../../components/svg/Svg";
import { DataGrid, GridToolbar, esES } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header/Header";
import { useTheme } from "@mui/material";
import { useForm } from "react-hook-form";
import { alpha } from "@mui/material";
import useUsuariosData from "../../hooks/useUsuarioData";
import { useJwt } from "../../context/JWTContext";
import userolesData from "../../hooks/useRolData";
import useDecodedJwt from "../../hooks/useJwt";
const Usuarios = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const {
    handleSubmit: handleSaveUsuario,
    formState: { errors: errorsAddUsuario },
    register: registerUsuario,
  } = useForm();
  const [openModal, setOpenModal] = useState(false);
  const { token } = useJwt();
  const payload = useDecodedJwt(token);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUsuario, setselectedUsuario] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const {
    fetchAllUsuarios,
    initialFetchAllUsuarios,
    loading,
    createUsuario,
    updateUsuario,
    deleteUsuario,
  } = useUsuariosData();
  const { initialFetchAllroles, loading: loadingRoles } = userolesData();
  useEffect(() => {
    const initialFetchUsuarios = async () => {
      const respuesta = await initialFetchAllUsuarios();
      const rolesRespuesta = await initialFetchAllroles();

      if (respuesta.status === 200 && respuesta.data) {
        setData(respuesta.data);
      }
      if (rolesRespuesta.status === 200 && rolesRespuesta.data) {
        setRoles(rolesRespuesta.data);
      }
    };
    initialFetchUsuarios();
  }, []);

  /// Métodos para CRUD
  const handleEdit = (id) => {
    const userToEdit = data.find((user) => user.id === id);
    setselectedUsuario(userToEdit);
    setOpenModal(true);
  };

  const handleStateUsuarios = async (e, id) => {
    const isActive = e.target.checked ? 1 : 2;
    const response = await updateUsuario(id, { estadoId: isActive });
    if (response.status === 200 || response.status === 201) {
      const updatedData = await fetchAllUsuarios();

      if (updatedData.status === 200 && updatedData.data) {
        setData(updatedData.data);
      }
    }
  };
  const getRoleId = (roleId) => {
    const role = roles.find((rol) => rol.id === roleId);
    return role ? role.nombre : "Sin Rol asignado";
  };

  const handleAdd = () => {
    setselectedUsuario({
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      password: "",
      rolId: 1,
      estadoId: 0,
    });
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setselectedUsuario(null);
  };

  const handleSave = async (data) => {
    const { direccion, password, ...dataValid } = data;
    const finalData = {
      ...dataValid,
      ...(direccion !== "" && { direccion }),
      ...(password !== "" && { password }),
    };
    const response = selectedUsuario.id
      ? await updateUsuario(selectedUsuario.id, finalData)
      : await createUsuario({ ...finalData, estadoId: 1 });
    if (response.status === 200 || response.status === 201) {
      const updatedData = await fetchAllUsuarios();
      if (updatedData.status === 200 && updatedData.data) {
        setData(updatedData.data);
      }
      handleClose();
    } else {
      console.log(response);
    }
  };

  const handleDelete = (id) => {
    const user = data.find((user) => user.id === id);
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (userToDelete.estadoId === 1) {
      setErrorMessage("No se puede eliminar el usuario porque está activo.");
      setOpenErrorModal(true);
      setOpenDeleteDialog(false);
      return;
    }

    const response = await deleteUsuario(userToDelete.id);

    if (response.status === 200 || response.status === 201) {
      setData((prevData) =>
        prevData.filter((user) => user.id !== userToDelete.id)
      );
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setselectedUsuario((prev) => ({ ...prev, [name]: value }));
  };
  // Fin métodos CRUD
  const columns = [
    { field: "nombre", headerName: "Nombre", flex: 1 },
    { field: "email", headerName: "Correo", flex: 1 },
    { field: "telefono", headerName: "Teléfono", flex: 1 },
    {
      field: "direccion",
      headerName: "Dirección",
      flex: 1,
      valueGetter: (params) =>
        params.row.direccion ? params.row.direccion : "Sin dirección agregada",
    },
    {
      field: "roleId",
      headerName: "Rol",
      flex: 1,
      valueGetter: (params) => getRoleId(params.row.roleId),
    },
    {
      field: "estadoId",
      headerName: "Estado",
      flex: 1,
      renderCell: ({ row }) => (
        <Switch
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: colors.purple[200],
              "&:hover": {
                backgroundColor: alpha(
                  colors.purple[200],
                  theme.palette.action.hoverOpacity
                ),
              },
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: colors.purple[200],
            },
          }}
          color="warning"
          onChange={(e) => {
            handleStateUsuarios(e, row.id);
          }}
          defaultChecked={row.estadoId == 1}
        />
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      flex: 1,
      renderCell: ({ row }) =>
        row.email === payload?.email ? (
          <Box sx={{ textAlign: "center", mx: "auto" }}>
            <h4>Sin acciones</h4>
          </Box>
        ) : (
          <Box>
            <Button onClick={() => handleEdit(row.id)}>
              <Edit size={20} color={colors.grey[100]} />
            </Button>
            <Button onClick={() => handleDelete(row.id)} sx={{ ml: 1 }}>
              <TrashColor size={20} color={colors.grey[100]} />
            </Button>
          </Box>
        ),
    },
  ];

  return (
    <>
      <Header title="Usuarios" subtitle="Lista de usuarios" />
      <Button
        variant="contained"
        onClick={handleAdd}
        sx={{
          mb: 2,
          backgroundColor: colors.purple[400],
          "&:hover": {
            backgroundColor: colors.purple[300],
          },
          color: "white",
        }}
      >
        Agregar Usuario
      </Button>
      {(loading || loadingRoles) && <Loading></Loading>}
      <Box
        m="0px 20px"
        p="0px 10px"
        height="50%"
        width="98%"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.purple[500],
            borderBottom: "none",
            color: "white",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.primary[200],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.purple[200]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`,
          },
        }}
      >
        {loading ? (
          <Typography>Cargando usuarios...</Typography>
        ) : (
          <DataGrid
            rows={data}
            columns={columns}
            components={{ Toolbar: GridToolbar }}
            getRowId={(row) => row.id}
            initialState={{
              sorting: {
                sortModel: [{ field: "id", sort: "asc" }],
              },
            }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          />
        )}
      </Box>

      <Dialog open={openModal} onClose={handleClose}>
        <form onSubmit={handleSaveUsuario(handleSave)}>
          <DialogTitle color={colors.grey[100]}>
            {selectedUsuario?.id ? "Editar Usuario" : "Agregar Usuario"}
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              name="nombre"
              label="Nombre"
              type="text"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "purple",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "purple",
                  },
                },
                "& .MuiInputLabel-root": {
                  "&.Mui-focused": {
                    color: "purple",
                  },
                },
              }}
              variant="outlined"
              {...registerUsuario("nombre", {
                required: "El usuario necesita un nombre.",
                minLength: {
                  message: "Mínimo requerido 4 caracteres",
                  value: 4,
                },
                maxLength: {
                  message: "Máximo permitido 25 caracteres",
                  value: 25,
                },
                validate: {
                  noNumbers: (value) =>
                    /^[^0-9]+$/.test(value) || "No se permiten números",
                  noSpecials: (value) =>
                    /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/.test(value) ||
                    "No se permiten caracteres especiales",
                },
              })}
              value={selectedUsuario?.nombre || ""}
              onChange={handleInputChange}
              FormHelperTextProps={{ sx: { color: "red" } }}
              helperText={errorsAddUsuario?.nombre?.message}
            />
            <TextField
              margin="dense"
              name="email"
              label="Correo"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "purple",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "purple",
                  },
                },
                "& .MuiInputLabel-root": {
                  "&.Mui-focused": {
                    color: "purple",
                  },
                },
              }}
              type="text"
              fullWidth
              variant="outlined"
              {...registerUsuario("email", {
                required: "Debes ingresar un correo",
                pattern: {
                  value: constants.EMAIL_REGEX, // Expresión regular para números
                  message: "Ingresa un correo electrónico válido",
                },
              })}
              value={selectedUsuario?.email || ""}
              onChange={handleInputChange}
              FormHelperTextProps={{ sx: { color: "red" } }}
              helperText={errorsAddUsuario?.email?.message}
            />
            <TextField
              margin="dense"
              name="telefono"
              label="Teléfono"
              type="text"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "purple",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "purple",
                  },
                },
                "& .MuiInputLabel-root": {
                  "&.Mui-focused": {
                    color: "purple",
                  },
                },
              }}
              variant="outlined"
              {...registerUsuario("telefono", {
                required: "El teléfono no puede estar vacío.",
                minLength: {
                  message: "Ingresa un número colombiano valido (+57)",
                  value: 10,
                },
                maxLength: {
                  message: "Ingresa un número colombiano valido (+57)",
                  value: 10,
                },
                validate: {
                  isColombianNumber: (value) =>
                    constants.PHONE_REGEX.test(value) ||
                    "Ingresa un número colombiano valido (+57)",
                },
              })}
              value={selectedUsuario?.telefono || ""}
              onChange={handleInputChange}
              FormHelperTextProps={{ sx: { color: "red" } }}
              helperText={errorsAddUsuario?.telefono?.message}
            />
            {!selectedUsuario?.id && (
              <TextField
                margin="dense"
                name="password"
                label="Contraseña"
                type="password"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "purple",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "purple",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "purple",
                    },
                  },
                }}
                variant="outlined"
                {...registerUsuario("password", {
                  required: "La contraseña es obligatoria.",
                  minLength: {
                    message: "Mínimo requerido 8 caracteres",
                    value: 4,
                  },
                  maxLength: {
                    message: "Máximo permitido 30 caracteres",
                    value: 30,
                  },
                })}
                value={selectedUsuario?.password || ""}
                onChange={handleInputChange}
                FormHelperTextProps={{ sx: { color: "red" } }}
                helperText={errorsAddUsuario?.password?.message}
              />
            )}
            <TextField
              margin="dense"
              name="direccion"
              label="Dirección"
              type="text"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "purple",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "purple",
                  },
                },
                "& .MuiInputLabel-root": {
                  "&.Mui-focused": {
                    color: "purple",
                  },
                },
              }}
              variant="outlined"
              {...registerUsuario("direccion", {
                minLength: {
                  message:
                    "Mínimo 10 caracteres, ¡especifica más la dirección! (ej: Carrera 67a #37-103)",
                  value: 10,
                },
                maxLength: {
                  message: "Máximo permitido 50 caracteres",
                  value: 50,
                },
              })}
              value={selectedUsuario?.direccion || ""}
              onChange={handleInputChange}
              FormHelperTextProps={{ sx: { color: "red" } }}
              helperText={errorsAddUsuario?.direccion?.message}
            />

            <TextField
              margin="dense"
              name="rol"
              label="Rol"
              fullWidth
              select
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "purple",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "purple",
                  },
                },
                "& .MuiInputLabel-root": {
                  "&.Mui-focused": {
                    color: "purple",
                  },
                },
              }}
              variant="outlined"
              {...registerUsuario("roleId", {
                required: "Debes escoger un rol!",
              })}
              value={parseInt(selectedUsuario?.roleId) || 1}
              onChange={handleInputChange}
              FormHelperTextProps={{ sx: { color: "red" } }}
              helperText={errorsAddUsuario?.categoriaId?.message}
            >
              {roles.map((rol) => (
                <MenuItem key={rol.id} value={rol.id}>
                  {rol.nombre}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="error">
              Cancelar
            </Button>
            <Button type="submit" color="success">
              Guardar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle color={colors.grey[100]}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el Usuario "
            {userToDelete?.nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openErrorModal} onClose={() => setOpenErrorModal(false)}>
        <DialogTitle color={colors.grey[100]}>Error</DialogTitle>
        <DialogContent>
          <Typography color={colors.grey[100]}>{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenErrorModal(false)} color="error">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Usuarios;
