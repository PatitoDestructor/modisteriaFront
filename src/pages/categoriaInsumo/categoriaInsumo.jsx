import React, { useState, useEffect } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header/Header";
import { useTheme } from "@mui/material";
import useFetch from "../../hooks/useFetch";
import { useJwt } from "../../context/JWTContext";

const CategoriaInsumo = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { loading, triggerFetch } = useFetch();
    const { token } = useJwt();

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedCategoria, setSelectedCategoria] = useState(null);
    const [categoriaToDelete, setCategoriaToDelete] = useState(null);
    const [openErrorModal, setOpenErrorModal] = useState(false); 
    const [errorMessage, setErrorMessage] = useState(""); 

    useEffect(() => {
        const fetchData = async () => {
            const respuesta = await triggerFetch("https://modisteria-back-production.up.railway.app/api/categorias/getAllCategorias", "GET");
            if (respuesta.status === 200 && respuesta.data) {
                const categoriasConId = respuesta.data.map(categoria => ({
                    ...categoria,
                    id: categoria.id || data.length + 1 
                }));
                const categoriasFiltradas = categoriasConId.filter(categoria => categoria.tipo === "insumo");
                setData(categoriasConId);
                setFilteredData(categoriasFiltradas);
            } else {
                console.error("Error al obtener datos: ", respuesta);
                setErrorMessage("Error al obtener datos. Revisa la consola para más detalles.");
                setOpenErrorModal(true);
            }
        };
        fetchData();
    }, [triggerFetch]);

    const handleEdit = (id) => {
        const categoriaToEdit = filteredData.find((categoria) => categoria.id === id);
        setSelectedCategoria(categoriaToEdit);
        setOpenModal(true);
    };

    const handleAdd = () => {
        setSelectedCategoria({ nombre: "", descripcion: "", tipo: "insumo", estadoId: "" });
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setSelectedCategoria(null);
    };

    const handleSave = async () => {
        try {
            const method = selectedCategoria.id ? "PUT" : "POST";
            const url = selectedCategoria.id 
                ? `https://modisteria-back-production.up.railway.app/api/categorias/updateCategoria/${selectedCategoria.id}`
                : "https://modisteria-back-production.up.railway.app/api/categorias/createCategoria";

            const response = await triggerFetch(url, method, selectedCategoria, { "x-token": token });

            if (response.status === 200 || response.status === 201) {
                if (response.data.msg) {
                    console.log(response.data.msg);
                    if (method === "PUT") {
                        setData((prevData) =>
                            prevData.map((categoria) =>
                                categoria.id === selectedCategoria.id ? selectedCategoria : categoria
                            )
                        );
                        setFilteredData((prevData) => 
                            prevData.map((categoria) =>
                                categoria.id === selectedCategoria.id ? selectedCategoria : categoria
                            )
                        );
                    } else {
                        const newCategoria = { ...selectedCategoria, id: data.length + 1 }; 
                        setData((prevData) => [...prevData, newCategoria]);
                        if (newCategoria.tipo === "Insumo") {
                            setFilteredData((prevData) => [...prevData, newCategoria]);
                        }
                    }
                }
                handleClose();
            } else {
                console.error("Error al guardar los datos: ", response.data);
                setErrorMessage("Error al guardar los datos. Revisa la consola para más detalles.");
                setOpenErrorModal(true);
            }
        } catch (error) {
            console.error("Error al realizar la solicitud:", error);
            setErrorMessage("Ocurrió un error al realizar la solicitud. Inténtalo nuevamente.");
            setOpenErrorModal(true);
        }
    };

    const handleDelete = (id) => {
        const categoria = filteredData.find((categoria) => categoria.id === id);
        setCategoriaToDelete(categoria);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (categoriaToDelete.estadoId === "activo") {
            setErrorMessage("No se puede eliminar la categoría porque está activa.");
            setOpenErrorModal(true);
            setOpenDeleteDialog(false);
            return;
        }

        try {
            const response = await triggerFetch(
                `https://modisteria-back-production.up.railway.app/api/categorias/deleteCategoria/${categoriaToDelete.id}`,
                "DELETE",
                null,
                { "x-token": token }
            );

            if (response.status === 200 || response.status === 201) {
                setData((prevData) => prevData.filter((categoria) => categoria.id !== categoriaToDelete.id));
                setFilteredData((prevData) => prevData.filter((categoria) => categoria.id !== categoriaToDelete.id));
                setOpenDeleteDialog(false);
                setCategoriaToDelete(null);
            } else {
                console.error("Error inesperado al eliminar datos: ", response.data);
                setErrorMessage("Error inesperado al eliminar la categoría. Revisa la consola para más información.");
                setOpenErrorModal(true);
            }
        } catch (error) {
            console.error("Error al realizar la solicitud:", error);
            setErrorMessage("Ocurrió un error al realizar la solicitud de eliminación. Inténtalo nuevamente.");
            setOpenErrorModal(true);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedCategoria((prev) => ({ ...prev, [name]: value }));
    };

    const columns = [
        { field: "id", headerName: "ID", flex: 0.5 },
        { field: "nombre", headerName: "Nombre", flex: 1 },
        { field: "descripcion", headerName: "Descripción", flex: 1 },
        { field: "estadoId", headerName: "Estado ID", flex: 1 },
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

    return (
        <Box m="20px">
            <Header title="CATEGORÍAS" subtitle="Lista de categorías" />
            <Button variant="contained" color="primary" onClick={handleAdd} sx={{ mb: 2 }}>
                Agregar Categoría
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
                    <Typography>Cargando categorías...</Typography>
                ) : (
                    <DataGrid 
                        rows={filteredData}
                        columns={columns} 
                        components={{ Toolbar: GridToolbar }} 
                    />
                )}
            </Box>


            <Dialog open={openModal} onClose={handleClose}>
                <DialogTitle>{selectedCategoria?.id ? "Editar Categoría" : "Agregar Categoría"}</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        name="nombre"
                        label="Nombre"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={selectedCategoria?.nombre || ""}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="dense"
                        name="descripcion"
                        label="Descripción"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={selectedCategoria?.descripcion || ""}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="dense"
                        name="estadoId"
                        label="Estado ID"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={selectedCategoria?.estadoId || ""}
                        onChange={handleInputChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro de que deseas eliminar la categoría "{categoriaToDelete?.nombre}"?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openErrorModal} onClose={() => setOpenErrorModal(false)}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    <Typography>{errorMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenErrorModal(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CategoriaInsumo;
