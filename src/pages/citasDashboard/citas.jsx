import React, { useState, useEffect } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, MenuItem } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header/Header";
import { useTheme } from "@mui/material";
import useFetch from "../../hooks/useFetch";
import { useJwt } from "../../context/JWTContext";
import { Plus, Trash } from "../../components/svg/Svg";

const CitaDashboard = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { loading, triggerFetch } = useFetch();
    const { token } = useJwt();

    const [data, setData] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [openErrorDialog, setOpenErrorDialog] = useState(false);
    const [selectedCita, setSelectedCita] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                console.error("No se ha proporcionado un token.");
                return;
            }

            const respuesta = await triggerFetch(
                "https://modisteria-back-production.up.railway.app/api/citas/getAllCitas",
                "GET",
                null,
                { "x-token": token }
            );

            if (respuesta.status === 200 && respuesta.data) {
                const citasConId = respuesta.data.map(cita => ({
                    ...cita,
                    id: cita.id || data.length + 1 
                }));
                setData(citasConId);
            } else {
                console.error("Error al obtener datos: ", respuesta);
            }
        };
        fetchData();
    }, [triggerFetch, token]);

    const handleEdit = (id) => {
        const citaToEdit = data.find((cita) => cita.id === id);
        setSelectedCita(citaToEdit);
        setOpenModal(true);
    };

    const handleAdd = () => {
        setSelectedCita({ referencia: "", objetivo: "", usuarioId: "", estadoId: "", precio: "", tiempo: "" });
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setSelectedCita(null);
    };

    const handleSave = async () => {
        try {
            const updatedCita = { ...selectedCita };

            const response = await triggerFetch(
                selectedCita.id
                    ? `https://modisteria-back-production.up.railway.app/api/citas/updateCita/${selectedCita.id}`
                    : "https://modisteria-back-production.up.railway.app/api/citas/createCita",
                selectedCita.id ? "PUT" : "POST",
                updatedCita,
                { "x-token": token }
            );

            if (response.status === 200 || response.status === 201) {
                setData((prevData) =>
                    selectedCita.id
                        ? prevData.map((cita) => (cita.id === selectedCita.id ? updatedCita : cita))
                        : [...prevData, { ...updatedCita, id: response.data.id }]
                );
                handleClose();
            } else {
                setErrorMessage(response.data.msg || "Error al guardar los datos");
                setOpenErrorDialog(true);
            }
        } catch (error) {
            setErrorMessage("Ocurrió un error al realizar la solicitud. Inténtalo nuevamente.");
            setOpenErrorDialog(true);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedValue = name === "estadoId" ? Number(value) : value;
        setSelectedCita((prev) => ({ ...prev, [name]: updatedValue }));
    };

    const getEstadoTexto = (estadoId) => {
        switch (estadoId) {
            case 9: return "Por Aprobar";
            case 10: return "Aprobada";
            case 11: return "Aceptada";
            case 12: return "Cancelada";
            case 13: return "Terminada";
            default: return "Desconocido";
        }
    };

    const columns = [
        { field: "id", headerName: "ID", flex: 0.5 },
        { field: "referencia", headerName: "Referencia", flex: 1 },
        { field: "objetivo", headerName: "Objetivo", flex: 1 },
        { field: "usuarioId", headerName: "Usuario ID", flex: 1 },
        {
            field: "estadoId",
            headerName: "Estado",
            flex: 1,
            valueGetter: (params) => getEstadoTexto(params.row.estadoId)
        },
        { field: "precio", headerName: "Precio", flex: 1 },
        { field: "tiempo", headerName: "Tiempo", flex: 1 },
        {
            field: "acciones",
            headerName: "Acciones",
            flex: 1,
            renderCell: (params) => (
                <Box>
                    <Button color="primary" onClick={() => handleEdit(params.row.id)}>
                        <img alt="editar" width="20px" height="20px" src="../../assets/editar.png" style={{ cursor: "pointer" }} />
                    </Button>
                    <Button variant="contained" color="error" onClick={() => handleDelete(params.row.id)} sx={{ ml: 1 }}>
                        <img alt="borrar" width="20px" height="20px" src="../../assets/borrar.png" style={{ cursor: "pointer" }} />
                    </Button>
                </Box>
            ),
        },
    ];

    const handleDelete = async (id) => {
        const response = await triggerFetch(
            `https://modisteria-back-production.up.railway.app/api/citas/deleteCita/${id}`,
            "DELETE",
            null,
            { "x-token": token }
        );

        if (response.status === 200 || response.status === 201) {
            setData((prevData) => prevData.filter((cita) => cita.id !== id));
        } else {
            setErrorMessage("Error al eliminar la cita");
            setOpenErrorDialog(true);
        }
    };

    return (
        <Box m="20px">
            <Header title="CITAS" subtitle="Lista de citas" />
            <Button variant="contained" color="primary" onClick={handleAdd} sx={{ mb: 2 }}>
                Agregar Cita
            </Button>
            <Box m="40px 0 0 0" height="75vh" sx={{
                "& .MuiDataGrid-root": { border: "none" },
                "& .MuiDataGrid-cell": { borderBottom: "none" },
                "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
                "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
                "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
                "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
                "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${colors.grey[100]} !important` },
            }}>
                {loading ? (
                    <Typography>Cargando citas...</Typography>
                ) : (
                    <DataGrid 
                        rows={data} 
                        columns={columns} 
                        components={{ Toolbar: GridToolbar }} 
                    />
                )}
            </Box>

            {/* Modal para Agregar/Editar Cita */}
            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedCita?.id ? "Editar Cita" : "Agregar Cita"}</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        name="estadoId"
                        label="Estado"
                        select
                        fullWidth
                        variant="outlined"
                        value={selectedCita?.estadoId || ""}
                        onChange={handleInputChange}
                    >
                        <MenuItem value={9}>Por Aprobar</MenuItem>
                        <MenuItem value={10}>Aprobada</MenuItem>
                        <MenuItem value={11}>Aceptada</MenuItem>
                        <MenuItem value={12}>Cancelada</MenuItem>
                        <MenuItem value={13}>Terminada</MenuItem>
                    </TextField>
                    {selectedCita?.estadoId === 10 && ( 
                        <>
                            <TextField
                                margin="dense"
                                name="precio"
                                label="Precio"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={selectedCita?.precio || ""}
                                onChange={handleInputChange}
                            />
                            <TextField
                                margin="dense"
                                name="tiempo"
                                label="Tiempo"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={selectedCita?.tiempo || ""}
                                onChange={handleInputChange}
                            />
                            
                            <span>Agregar insumos requeridos</span>
                            <div className="add-insumo">
                                
                                <div className="insumo-button">
                                    <button className="cart-button2">
                                        <Plus color="#fff" size={"27"}></Plus>
                                    </button>
                                </div>

                                <div className="insumo-select">
                                    <div className="iSelect-head">
                                        <label htmlFor="">Insumo #1</label>
                                        <span><Trash color="#fff" size={"20"}></Trash></span>
                                    </div>

                                    <TextField
                                        margin="dense"
                                        name="estadoId"
                                        label="Insumo"
                                        select
                                        fullWidth
                                        variant="outlined"
                                    >
                                        <MenuItem value={9}>Tela 1</MenuItem>
                                        <MenuItem value={10}>Tela 2</MenuItem>
                                        <MenuItem value={11}>Tela 3</MenuItem>
                                    </TextField>

                                    {/*CANTIDAD*/}
                                    <input type="number" className="cantidad-insumo" min={1}/>

                                </div>

                            </div>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Error */}
            <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    <Typography>{errorMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenErrorDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CitaDashboard;
