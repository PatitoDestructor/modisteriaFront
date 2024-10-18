import "./venta.css";
import Metadata from "../../components/metadata/Metadata";
import { useJwt } from "../../context/JWTContext";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useDecodedJwt from "../../hooks/useJwt";
import Modal from "../../components/modal/Modal";
import Input from "../../components/input_basico/Input";
import { useForm } from "react-hook-form";
import Loading from "../../components/loading/Loading";
import axios from "axios";
import { QrCode } from "../../components/svg/Svg";
import { toast, ToastContainer } from "react-toastify";
import useActiveUserInfo from "../../hooks/useActiveUserInfo";
import useIsFirstRender from "../../hooks/useIsMount";
import { imageExtensions } from "../../assets/constants.d";
import useFetch from "../../hooks/useFetch";
export default function Venta() {
  const { token } = useJwt();
  const payload = useDecodedJwt(token);
  const [elegirPago, setElegirPago] = useState(false);
  const [formaPago, setFormaPago] = useState("");
  const isFirstRender = useIsFirstRender();
  const { loading: loadingFetch, triggerFetch } = useFetch();
  const { cartData, subtotal } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState(false);
  const [lugarEntrega, setLugarEntrega] = useState("");
  const [imagen, setImagen] = useState(null);
  const [nombreComprobante, setNombreComprobante] = useState(payload?.id);
  const [loading, setLoading] = useState(false);
  const { userData, setUserData } = useActiveUserInfo(payload?.id, token);
  const [domicilio, setDomicilio] = useState(0);
  const [showFullQr, setShowFullQr] = useState(false);
  const handleChangeAddress = (e) => {
    setLugarEntrega(e.target.value);
  };
  const handleChangePayMethod = (e) => {
    setFormaPago(e.target.value);
  };
  const addressToggle = () => {
    setAddress(!address);
  };
  const qrToggle = () => {
    setShowFullQr(!showFullQr);
  };
  const handleAddressSubmit = async (data) => {
    setLoading(true);
    setAddress(false);
    const direccionString = `${data.tipoCalle} ${data.calle} ${data.numero1}${data.numero2} ${data.infoAdicional}`;
    axios
      .put(
        `https://modisteria-back-production.up.railway.app/api/usuarios/updateUser/${payload?.id}`,
        { direccion: direccionString },
        { headers: { "x-token": token } }
      )
      .then(() => {
        toast.success("Dirección agregada con éxito! ", {
          autoClose: 800,
          toastId: "direccion-ok",
        });
        axios
          .get(
            `https://modisteria-back-production.up.railway.app/api/usuarios/getUserById/${payload?.id}`,
            { headers: { "x-token": token } }
          )
          .then((res) => {
            setUserData(res.data);
            setDomicilio(15000);
          });
      })
      .catch(() => {
        toast.error("Error al añadir dirección! ", {
          autoClose: 800,
          toastId: "direccion-mal",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    if (userData?.direccion) {
      setDomicilio(15000);
    } else {
      setDomicilio(0);
    }
  }, [userData]);

  useEffect(() => {
    if (lugarEntrega === "domicilio") return setTotal(subtotal + domicilio);
    setTotal(subtotal);
  }, [lugarEntrega, subtotal, domicilio]);
  const [total, setTotal] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const {
    register: registerForm2,
    handleSubmit: handleSubmitForm2,
    watch: watchComprobante,
    formState: { errors: errorsForm2 },
  } = useForm();

  useEffect(() => {
    if (isFirstRender) return;
    if (!errorsForm2) return;
    if (errorsForm2.imagen?.type === "required") {
      toast.error("Ingresa la imagen con la transferencia!", {
        toastId: "transferenciaImagen",
        autoClose: 600,
      });
    }
    if (errorsForm2.imagen?.type === "validate") {
      toast.error("Solo se permiten imágenes!", {
        toastId: "transferenciaImagenError",
        autoClose: 600,
      });
    }
  }, [errorsForm2.imagen]);

  const isAnImage = (extension) => {
    return imageExtensions.includes(extension);
  };
  const handleTransferencia = async (data) => {
    setNombreComprobante(data.nombreComprobante);
    setImagen(data.imagen[0]);
    qrToggle();
    toast.success("Comprobante añadido con éxito!", { autoClose: 1500 });
  };
  const isCheckedChangeName = watchComprobante("incluirNombreComprobante");
  useEffect(() => {
    (!token || cartData.length == 0) && navigate("/");
  }, [token, cartData, navigate]);

  const handlePassPayMethod = () => {
    if (lugarEntrega === "domicilio" && !userData?.direccion) {
      setAddress(true);
      return;
    }
    if (lugarEntrega !== "domicilio" && lugarEntrega !== "modisteria") return;
    setElegirPago(true);
  };
  const handleAddCotizacion = async () => {
    if (formaPago === "transferencia" && !imagen) {
      qrToggle();
      return;
    }
    const formDataAdd = new FormData();
    const ids = cartData.map((value) => value.id);
    formDataAdd.append("nombrePersona", nombreComprobante);
    lugarEntrega === "domicilio"
      ? formDataAdd.append("valorDomicilio", domicilio)
      : formDataAdd.append("valorDomicilio", 0);
    formDataAdd.append("valorPrendas", subtotal);
    formDataAdd.append("metodoPago", formaPago);
    formDataAdd.append("pedidoId", ids);
    formaPago === "transferencia" && formDataAdd.append("file", imagen);

    const response = await triggerFetch(
      "https://modisteria-back-production.up.railway.app/api/cotizaciones/createCotizacion",
      "POST",
      formDataAdd,
      {
        "x-token": token,
        "Content-Type": "multipart/form-data",
      }
    );
    if (response.status === 201)
      toast.success(`${response.data.msg}\nEspera tu correo de confirmación`, {
        autoClose: 2000,
      });
    else if (response.status === 400) {
      toast.error(`${response.data.error}`, {
        autoClose: 2000,
      });
    }
  };
  return (
    <>
      <Metadata title={"Venta - Modisteria Doña Luz"}></Metadata>
      {loading && <Loading></Loading>}
      {loadingFetch && <Loading></Loading>}
      <br />
      <br />
      <section className="venta-section">
        <article className={`recogida ${elegirPago ? "" : "activo"}`}>
          <h2>Elige la forma de entrega</h2>
          <label className="card-option">
            <div className="choice">
              <div>
                <input
                  type="radio"
                  className="radio-styles"
                  name="entrega"
                  value="domicilio"
                  onChange={handleChangeAddress}
                  checked={lugarEntrega === "domicilio"}
                />
                <span className="input-text">Enviar a domicilio</span>
              </div>
              {userData?.direccion ? (
                <h4 className="info-adicional">Carrera 67 a #109</h4>
              ) : (
                <h4 onClick={addressToggle} className="info-agregar-direccion">
                  Agregar dirección
                </h4>
              )}
            </div>
            <div className="price-choice">
              {userData?.direccion ? (
                <span>${domicilio}</span>
              ) : (
                <span>Por definir</span>
              )}
            </div>
          </label>
          <label className="card-option">
            <div className="choice">
              <div>
                <input
                  type="radio"
                  onChange={handleChangeAddress}
                  className="radio-styles"
                  name="entrega"
                  value="modisteria"
                  checked={lugarEntrega === "modisteria"}
                />
                <span className="input-text">Recoger en la Modisteria</span>
              </div>
              <h4 className="info-adicional">
                Calle 43 #34 - 195 int 306 - Copacabana
              </h4>
            </div>
            <div className="price-choice">
              <span>Sin costo</span>
            </div>
          </label>
          <button onClick={handlePassPayMethod} className="boton-continuar">
            Continuar
          </button>
        </article>
        <article className={`recogida ${elegirPago ? "activo" : ""}`}>
          <h2>Elige la forma de pago</h2>
          <label className="card-option">
            <div className="choice">
              <div>
                <input
                  type="radio"
                  className="radio-styles"
                  name="pago"
                  value="efectivo"
                  onChange={handleChangePayMethod}
                  checked={formaPago === "efectivo"}
                />
                <span className="input-text">Pagar en efectivo 💵</span>
              </div>
              <h4 className="info-adicional" style={{ color: "#808080" }}>
                *Ten el dinero a la mano
              </h4>
            </div>
            <div className="price-choice"></div>
          </label>
          <label className="card-option">
            <div className="choice">
              <div>
                <input
                  type="radio"
                  onChange={handleChangePayMethod}
                  className="radio-styles"
                  name="pago"
                  value="transferencia"
                  checked={formaPago === "transferencia"}
                />
                <span className="input-text">Pagar por transferencia</span>
              </div>
              <div className="tipos-transferencia">
                <img
                  alt="bancolombia logo"
                  title="Bancolombia"
                  src="https://seeklogo.com/images/B/bancolombia-logo-932DD4816B-seeklogo.com.png"
                />
                <img
                  src="https://static.wixstatic.com/media/60a29b_ff944fc332d24bf9b7e861543c9d9854~mv2.png/v1/fill/w_318,h_318,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/nequi-logo.png"
                  alt="nequi logo"
                  title="Nequi"
                />
              </div>
            </div>
            <div className="price-choice">
              <span>
                <img
                  className="qr-img"
                  onClick={qrToggle}
                  src="https://static.vecteezy.com/system/resources/previews/013/722/213/non_2x/sample-qr-code-icon-png.png"
                  alt="qr"
                  title="Qr Doña Luz"
                />
              </span>
            </div>
          </label>
          <button onClick={handleAddCotizacion} className="boton-continuar">
            Continuar
          </button>
        </article>
        <article className="ficha-tecnica">
          <div>
            {" "}
            <h3 className="resumen-compra-title">Resumen de mi compra</h3>
            <hr className="separacion-resumen" />
          </div>
          <div className="ficha-productos">
            {cartData.map((value) => (
              <div key={value.idPedido} className="ficha-producto">
                <div>
                  {value?.catalogo.producto}{" "}
                  <span className="talla-producto">{value.talla}</span>
                </div>
                <span>x{value.cantidad}</span>
              </div>
            ))}
          </div>
          <div className="info-ficha-tecnica">
            <div className="info-price-ficha-tecnica">
              {" "}
              <span>Subtotal:</span>
              <span>${subtotal} COP</span>
            </div>
            <div className="info-price-ficha-tecnica">
              <span>Total:</span>
              <span>${total ? total : subtotal} COP</span>
            </div>
          </div>
        </article>
      </section>
      <Modal customWidth={"800px"} onClose={addressToggle} show={address}>
        <form onSubmit={handleSubmit(handleAddressSubmit)}>
          <h2 className="add-address-title">Agregar dirección 📍</h2>
          <hr className="separacion" />
          <div className="address-modal">
            <label>
              <h3 className="text-label">Tipo de Calle</h3>
              <div className="select-wrapper">
                <select
                  {...register("tipoCalle", { required: true })}
                  defaultValue={"Carrera"}
                  className="tipocalle-select"
                  name=""
                  id=""
                >
                  <option value="Avenida">Avenida</option>
                  <option value="Calle">Calle</option>
                  <option value="Carrera">Carrera</option>
                  <option value="Diagonal">Diagonal</option>
                  <option value="Circular">Circular</option>
                  <option value="Circunvalar">Circunvalar</option>
                  <option value="Transversal">Transversal</option>
                  <option value="Vía">Vía</option>
                  <option value="">9</option>
                  <option value="">10</option>
                  <option value="">11</option>
                  <option value="">12</option>
                </select>
              </div>
              <Input
                {...register("calle", {
                  maxLength: 5,
                  required: "obligado",
                  pattern: {
                    value: /^\d+[a-zA-Z]?$/,
                    message: "no está bien hecho",
                  },
                })}
                error={errors.calle}
                placeholder={"Ej. 67A "}
              ></Input>
            </label>
            <label className="label-number-address">
              <h3 className="text-label">Número</h3>
              <div className="number-address">
                {" "}
                <Input
                  {...register("numero1", {
                    maxLength: 4,
                    required: true,
                    pattern: { value: /^#\d+/ },
                  })}
                  placeholder={"Ej. #34"}
                  width={"3rem"}
                  description={""}
                  error={errors.numero1}
                ></Input>
                <Input
                  placeholder={"Ej. -195"}
                  width={"3rem"}
                  {...register("numero2", {
                    maxLength: 4,
                    required: true,
                    pattern: { value: /^-\d+/ },
                  })}
                  error={errors.numero2}
                ></Input>
              </div>
            </label>
          </div>
          <div className="">
            <label className="piso-depto">
              <h3 className="text-label">Piso/Departamento (Opcional)</h3>
              <Input
                {...register("infoAdicional", {
                  maxLength: 40,
                })}
                width={"rem"}
                placeholder={"Ej. int 201 torre 2"}
                error={errors.infoAdicional}
              ></Input>
            </label>
          </div>
          <button type="submit" className="agregar-direccion">
            Agregar
          </button>
        </form>
      </Modal>
      <Modal onClose={qrToggle} show={showFullQr}>
        <form
          onSubmit={handleSubmitForm2(handleTransferencia)}
          className="modal-qr"
        >
          <img
            src="https://static.vecteezy.com/system/resources/previews/013/722/213/non_2x/sample-qr-code-icon-png.png"
            alt="qr"
            title="Qr Doña Luz"
          />
          <div className="qrcode-data">
            <label>
              <input
                type="checkbox"
                {...registerForm2("incluirNombreComprobante")}
              />
              <span>¿Cambiar quién envía?</span>
            </label>
            <Input
              {...registerForm2("nombreComprobante", {
                required: true,
                minLength: 4,
              })}
              defaultValue={payload?.nombre}
              readOnly={!isCheckedChangeName}
              placeholder={"Nombre Comprobante"}
              error={errorsForm2.nombreComprobante}
            />
          </div>
          <div className="actions-qr">
            <label className="subir-comprobante">
              <input
                {...registerForm2("imagen", {
                  required: true,
                  validate: () => {
                    return isAnImage(
                      watchComprobante("imagen")[0].name.split(".")[1]
                    );
                  },
                })}
                type="file"
                accept="image/*"
              />
              <div>
                {"Subir"}
                <QrCode color={"#fff"} size={"24"}></QrCode>
              </div>
            </label>
            <button type="submit" className="agregar-direccion">
              Enviar Comprobante
            </button>
          </div>
        </form>
      </Modal>
      <ToastContainer></ToastContainer>
    </>
  );
}
