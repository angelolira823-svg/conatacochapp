import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../services/supabase';
import { pasajeroStyles as styles } from '../styles/pasajeroStyles';
import { RolSistema } from './AdminScreen';
import MapaColectivos, { MapaColectivosRef } from '../components/MapaColectivos';
import { obtenerServiciosRM, obtenerTrazadoPorFolio, ServicioColectivo } from '../data/gestorRutas';

export interface ColectivoRuta {
  id: string;
  ruta: string;
  folio: string;
  origenDestino: string;
  patente: string;
  cupos: number;
  llegadaMinutos: number;
  lat: number;
  lng: number;
  sentido: 'ida' | 'regreso';
  estado?: 'en_ruta' | 'en_garita' | 'fuera_servicio';
  conductorNombre: string;
  conductorRut: string;
  conductorLicencia: string;
}

export interface NuevoReporteData {
  tipo: 'pasajero_a_conductor' | 'conductor_a_garita' | 'operacional';
  origen: string;
  patenteAfectada?: string;
  titulo: string;
  descripcion: string;
}

interface PasajeroScreenProps {
  onVolver: () => void;
  esAdmin?: boolean;
  nombreUsuario?: string;
  correoUsuario?: string;
  usuarioId?: string;
  rolUsuario?: RolSistema;
  onNavegarAVista?: (vista: 'conductor' | 'garita' | 'admin') => void;
  colectivoConductor?: {
    cupos: number;
    estado: 'en_ruta' | 'en_garita' | 'fuera_servicio';
    conductorNombre?: string;
    folio?: string;
  };
  onOcuparAsientoAutomatico?: (patente: string) => void;
  onLiberarAsientoAutomatico?: (patente: string) => void;
  onRealizarPagoPasaje?: (monto: number, patente: string, chofer: string) => void;
  onCrearReporte?: (data: NuevoReporteData) => void;
}

function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function PasajeroScreen({
  onVolver,
  esAdmin = false,
  nombreUsuario,
  correoUsuario,
  usuarioId,
  rolUsuario = 'pasajero',
  onNavegarAVista,
  colectivoConductor = { cupos: 3, estado: 'en_ruta', conductorNombre: 'Patricio Fuentes C.', folio: '236023' },
  onOcuparAsientoAutomatico,
  onLiberarAsientoAutomatico,
  onRealizarPagoPasaje,
  onCrearReporte,
}: PasajeroScreenProps) {
  const mapaRef = useRef<MapaColectivosRef>(null);
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);
  const [saldo, setSaldo] = useState<number>(5000);
  
  const [serviciosOficiales, setServiciosOficiales] = useState<ServicioColectivo[]>([]);
  const [rutaActiva, setRutaActiva] = useState<any>(null);
  const [textoBusqueda, setTextoBusqueda] = useState<string>('');
  const [busquedaActiva, setBusquedaActiva] = useState<boolean>(false);
  const [cargandoGPS, setCargandoGPS] = useState<boolean>(false);

  const [modalRecargaVisible, setModalRecargaVisible] = useState<boolean>(false);
  const [montoPersonalizado, setMontoPersonalizado] = useState<string>('');

  const [sentidoTrazado, setSentidoTrazado] = useState<'ida' | 'regreso' | 'ambos'>('ida');
  const [colectivoSeleccionado, setColectivoSeleccionado] = useState<ColectivoRuta | null>(null);
  const [colectivoMonitoreado, setColectivoMonitoreado] = useState<string | null>(null);
  const [estaABordo, setEstaABordo] = useState<boolean>(false);
  const [distanciaSimulada, setDistanciaSimulada] = useState<number | null>(null);

  const [cantidadAsientos, setCantidadAsientos] = useState<number>(1);
  const [asientosConfirmados, setAsientosConfirmados] = useState<number>(1);
  const [solicitandoReserva, setSolicitandoReserva] = useState<boolean>(false);
  const [reservaActivaId, setReservaActivaId] = useState<string | null>(null);
  const [reservaConfirmadaPorChofer, setReservaConfirmadaPorChofer] = useState<boolean>(false);

  const TARIFA_POR_ASIENTO = 1000;

  const [modalReporteVisible, setModalReporteVisible] = useState<boolean>(false);
  const [motivoReporte, setMotivoReporte] = useState<string>('Exceso de velocidad');
  const [detalleReporte, setDetalleReporte] = useState<string>('');
  const [enviandoReporte, setEnviandoReporte] = useState<boolean>(false);

  const [miUbicacion, setMiUbicacion] = useState({
    lat: -33.5135,
    lng: -70.7550,
  });

  useEffect(() => {
    const lista = obtenerServiciosRM();
    setServiciosOficiales(lista);
    if (lista.length > 0) {
      const primerServicio = lista[0];
      const trazados = obtenerTrazadoPorFolio(primerServicio.FOLIO);
      setRutaActiva({
        id: String(primerServicio.FOLIO),
        linea: primerServicio.NRO_LINEA ? `Línea ${primerServicio.NRO_LINEA}` : (primerServicio.NOMBRE_FANTASIA || 'Colectivo Urbano'),
        folio: String(primerServicio.FOLIO),
        comunas: primerServicio.COMUNA || 'Santiago RM',
        centro: { lat: -33.5135, lng: -70.7550 },
        trazadoIda: trazados.ida,
        trazadoRegreso: trazados.regreso,
      });
    }
  }, []);

  const serviciosFiltradosBusqueda = serviciosOficiales.filter((s) => {
    const query = textoBusqueda.toLowerCase().trim();
    if (!query) return true;
    const nroLinea = s.NRO_LINEA ? String(s.NRO_LINEA).toLowerCase() : '';
    const folioStr = String(s.FOLIO);
    const fantasia = s.NOMBRE_FANTASIA ? s.NOMBRE_FANTASIA.toLowerCase() : '';
    const comuna = s.COMUNA ? s.COMUNA.toLowerCase() : '';

    return nroLinea.includes(query) || folioStr.includes(query) || fantasia.includes(query) || comuna.includes(query);
  });

  const [colectivosBase, setColectivosBase] = useState<ColectivoRuta[]>([
    {
      id: '1',
      ruta: '6023',
      folio: '236023',
      origenDestino: 'Ida: René Olivares ➔ Los Cancilleres',
      patente: 'GH-89-21',
      cupos: colectivoConductor.cupos,
      estado: colectivoConductor.estado,
      sentido: 'ida',
      llegadaMinutos: 2,
      lat: -33.5186,
      lng: -70.7601,
      conductorNombre: colectivoConductor.conductorNombre || 'Patricio Fuentes C.',
      conductorRut: '14.882.109-K',
      conductorLicencia: 'Clase A1 / A2 Profesional (CONATACOCH)',
    },
    {
      id: '2',
      ruta: '6023',
      folio: '236023',
      origenDestino: 'Regreso: Los Cancilleres ➔ René Olivares',
      patente: 'FP-55-12',
      cupos: 4,
      estado: 'en_ruta',
      sentido: 'regreso',
      llegadaMinutos: 5,
      lat: -33.5112,
      lng: -70.7570,
      conductorNombre: 'Rodrigo Morales V.',
      conductorRut: '12.441.980-3',
      conductorLicencia: 'Clase A2 Profesional',
    },
    {
      id: '3',
      ruta: '3009',
      folio: '233009',
      origenDestino: 'Ida: Terminal ➔ Centro Comunal',
      patente: 'JK-99-44',
      cupos: 3,
      estado: 'en_ruta',
      sentido: 'ida',
      llegadaMinutos: 3,
      lat: -33.5228,
      lng: -70.5891,
      conductorNombre: 'Esteban Garrido L.',
      conductorRut: '15.221.882-9',
      conductorLicencia: 'Clase A2 Profesional',
    }
  ]);

  useEffect(() => {
    const canalFlota = supabase
      .channel('flota-operacional-global')
      .on(
        'broadcast',
        { event: 'cambio_estado_movil' },
        (payload: { payload: { patente: string; nuevoEstado: 'en_ruta' | 'en_garita' | 'fuera_servicio' } }) => {
          const { patente, nuevoEstado } = payload.payload;
          setColectivosBase((prev) =>
            prev.map((col) =>
              col.patente.toUpperCase() === patente.toUpperCase() ? { ...col, estado: nuevoEstado } : col
            )
          );
        }
      )
      .on(
        'broadcast',
        { event: 'actualizacion_cupos_conductor' },
        (payload: { payload: { patente: string; cupos: number } }) => {
          const { patente, cupos } = payload.payload;
          setColectivosBase((prev) =>
            prev.map((col) =>
              col.patente.toUpperCase() === patente.toUpperCase() ? { ...col, cupos } : col
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalFlota);
    };
  }, []);

  const colectivosFiltrados = colectivosBase
    .filter((c) => c.estado !== 'fuera_servicio')
    .filter((c) => {
      if (!rutaActiva) return true;
      return String(c.folio) === String(rutaActiva.folio);
    })
    .filter((c) => sentidoTrazado === 'ambos' || c.sentido === sentidoTrazado);

  useEffect(() => {
    if (rutaActiva) {
      obtenerUbicacionGPS();
    }
  }, [rutaActiva]);

  useEffect(() => {
    setCantidadAsientos(1);
  }, [colectivoSeleccionado]);

  useEffect(() => {
    if (!reservaActivaId) return;

    const canalStatus = supabase
      .channel(`reserva-notificacion-${reservaActivaId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservas',
          filter: `id=eq.${reservaActivaId}`,
        },
        (payload: { new: { estado: string; asientos_solicitados: number; colectivo_id: string } }) => {
          const { estado, asientos_solicitados, colectivo_id } = payload.new;

          if (estado === 'aceptada') {
            setSolicitandoReserva(false);
            setReservaConfirmadaPorChofer(true);
            setAsientosConfirmados(asientos_solicitados);
            setColectivoMonitoreado(colectivo_id);

            Alert.alert(
              '🎉 ¡Asientos Apartados!',
              `El conductor confirmó tu reserva para ${asientos_solicitados} cupo(s). El cobro se efectuará cuando estés junto al auto (< 35m) y confirmes el pago.`
            );
          } else if (estado === 'rechazada') {
            setSolicitandoReserva(false);
            setReservaActivaId(null);
            setReservaConfirmadaPorChofer(false);
            Alert.alert(
              '❌ Solicitud Rechazada',
              'El conductor no pudo aceptar la reserva. Intenta con otro colectivo en servicio.'
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalStatus);
    };
  }, [reservaActivaId]);

  const obtenerUbicacionGPS = async () => {
    try {
      setCargandoGPS(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCargandoGPS(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nuevaUbi = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };

      setMiUbicacion(nuevaUbi);

      if (mapaRef.current) {
        mapaRef.current.centrarEnCoordenada(nuevaUbi.lat, nuevaUbi.lng);
      }
    } catch (e) {
      console.log('Error GPS:', e);
    } finally {
      setCargandoGPS(false);
    }
  };

  const handleBajarDelColectivo = async () => {
    if (!colectivoMonitoreado) return;

    const asientosALiberar = reservaConfirmadaPorChofer ? asientosConfirmados : cantidadAsientos;
    const patenteLiberada = colectivoMonitoreado;

    try {
      const canalNotificacion = supabase.channel(`conductor-canal-${patenteLiberada}`);
      await canalNotificacion.send({
        type: 'broadcast',
        event: 'liberar_asiento',
        payload: {
          patente: patenteLiberada,
          asientosLiberados: asientosALiberar,
        },
      });
    } catch (error) {
      console.log('Error al emitir liberación de asiento:', error);
    }

    if (onLiberarAsientoAutomatico) {
      for (let i = 0; i < asientosALiberar; i++) {
        onLiberarAsientoAutomatico(patenteLiberada);
      }
    }

    setEstaABordo(false);
    setColectivoMonitoreado(null);
    setDistanciaSimulada(null);
    setReservaConfirmadaPorChofer(false);
    setReservaActivaId(null);
    setCantidadAsientos(1);
    setAsientosConfirmados(1);

    Alert.alert(
      '🚶 Bajada Confirmada',
      `Has descendido del móvil ${patenteLiberada}.\nSe han liberado ${asientosALiberar} asiento(s) para los demás pasajeros.`
    );
  };

  useEffect(() => {
    if (!colectivoMonitoreado) return;

    const col = colectivosBase.find((c) => c.patente === colectivoMonitoreado);
    if (!col) return;

    const distReal = calcularDistanciaMetros(miUbicacion.lat, miUbicacion.lng, col.lat, col.lng);
    const distanciaActual = distanciaSimulada !== null ? distanciaSimulada : distReal;

    if (distanciaActual <= 35 && !estaABordo) {
      setEstaABordo(true);
      if (onOcuparAsientoAutomatico) {
        onOcuparAsientoAutomatico(col.patente);
      }
      Alert.alert(
        '🚖 ¡Abordaje Detectado!',
        `Estás junto al colectivo ${col.patente} (${distanciaActual}m). Presiona el botón de pago para transferir el pasaje.`
      );
    }

    if (distanciaActual > 70 && estaABordo) {
      const asientosALiberar = reservaConfirmadaPorChofer ? asientosConfirmados : cantidadAsientos;
      const patenteLiberada = col.patente;

      try {
        const canalNotificacion = supabase.channel(`conductor-canal-${patenteLiberada}`);
        canalNotificacion.send({
          type: 'broadcast',
          event: 'liberar_asiento',
          payload: {
            patente: patenteLiberada,
            asientosLiberados: asientosALiberar,
          },
        });
      } catch (error) {
        console.log('Error al emitir liberación:', error);
      }

      setEstaABordo(false);
      setColectivoMonitoreado(null);
      setDistanciaSimulada(null);
      setReservaConfirmadaPorChofer(false);
      setReservaActivaId(null);
      setCantidadAsientos(1);
      setAsientosConfirmados(1);

      if (onLiberarAsientoAutomatico) {
        for (let i = 0; i < asientosALiberar; i++) {
          onLiberarAsientoAutomatico(patenteLiberada);
        }
      }
      Alert.alert(
        '🚶 Fin del Recorrido',
        `Te has alejado del móvil. Se han liberado ${asientosALiberar} asiento(s) automáticamente.`
      );
    }
  }, [miUbicacion, colectivoMonitoreado, estaABordo, distanciaSimulada]);

  const irAPanelEspecial = (vista: 'conductor' | 'garita' | 'admin') => {
    setMenuAbierto(false);
    if (onNavegarAVista) {
      onNavegarAVista(vista);
    }
  };

  const distanciaAlSeleccionado = colectivoSeleccionado
    ? (distanciaSimulada !== null
        ? distanciaSimulada
        : calcularDistanciaMetros(
            miUbicacion.lat,
            miUbicacion.lng,
            colectivoSeleccionado.lat,
            colectivoSeleccionado.lng
          ))
    : 999;

  const procesarRecarga = (monto: number) => {
    if (isNaN(monto) || monto <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un valor mayor a $0.');
      return;
    }

    setSaldo((prev) => prev + monto);
    setModalRecargaVisible(false);
    setMontoPersonalizado('');
    Alert.alert(
      '✅ Recarga Exitosa',
      `Se han abonado $${monto.toLocaleString('es-CL')} CLP a tu Pase Digital.\nNuevo saldo: $${(saldo + monto).toLocaleString('es-CL')} CLP.`
    );
  };

  const solicitarReservaConductor = async () => {
    if (!colectivoSeleccionado) return;

    if (colectivoSeleccionado.estado === 'en_garita') {
      Alert.alert('Móvil en Garita', 'Este colectivo está esperando turno de salida en el terminal.');
      return;
    }

    if (cantidadAsientos > colectivoSeleccionado.cupos) {
      Alert.alert('Sin cupos', 'No hay suficientes asientos disponibles en este móvil.');
      return;
    }

    setSolicitandoReserva(true);
    const montoTotal = TARIFA_POR_ASIENTO * cantidadAsientos;

    try {
      let idFinal = usuarioId;
      if (!idFinal) {
        const { data: authData } = await supabase.auth.getUser();
        idFinal = authData?.user?.id;
      }

      const { data, error } = await supabase
        .from('reservas')
        .insert([
          {
            colectivo_id: colectivoSeleccionado.patente,
            pasajero_id: idFinal || null,
            pasajero_nombre: nombreUsuario || 'Pasajero',
            asientos_solicitados: cantidadAsientos,
            monto_total: montoTotal,
            estado: 'pendiente',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setReservaActivaId(data.id);
    } catch (err: any) {
      setSolicitandoReserva(false);
      Alert.alert('Error al reservar', err.message || 'No se pudo enviar la solicitud.');
    }
  };

  const ejecutarPago = async () => {
    if (!colectivoSeleccionado) return;

    const asientosACobrar = reservaConfirmadaPorChofer ? asientosConfirmados : cantidadAsientos;
    const totalPagar = TARIFA_POR_ASIENTO * asientosACobrar;

    if (saldo < totalPagar) {
      Alert.alert(
        'Saldo Insuficiente',
        `El costo es de $${totalPagar.toLocaleString('es-CL')} y tu saldo es $${saldo.toLocaleString('es-CL')}. Puedes recargar desde el menú lateral.`
      );
      return;
    }

    setSaldo((prev) => prev - totalPagar);
    const pat = colectivoSeleccionado.patente;
    const chofer = colectivoSeleccionado.conductorNombre;

    try {
      const canalConductor = supabase.channel(`conductor-canal-${pat}`);
      await canalConductor.send({
        type: 'broadcast',
        event: 'pago_directo_abordaje',
        payload: {
          patente: pat,
          asientosOcupados: asientosACobrar,
          monto: totalPagar,
          pasajeroNombre: nombreUsuario || 'Pasajero a Bordo',
        },
      });

      if (reservaConfirmadaPorChofer) {
        await supabase
          .from('reservas')
          .update({ estado: 'finalizada' })
          .eq('colectivo_id', pat)
          .eq('pasajero_nombre', nombreUsuario || 'Pasajero')
          .eq('estado', 'aceptada');
      }

      const canalFlota = supabase.channel('flota-operacional-global');
      const nuevosCuposCalculados = Math.max(0, colectivoSeleccionado.cupos - asientosACobrar);
      await canalFlota.send({
        type: 'broadcast',
        event: 'actualizacion_cupos_conductor',
        payload: {
          patente: pat,
          cupos: nuevosCuposCalculados,
          folio: colectivoSeleccionado.folio,
        },
      });
    } catch (e) {
      console.log('Error notificando pago al chofer:', e);
    }

    if (onOcuparAsientoAutomatico) {
      for (let i = 0; i < asientosACobrar; i++) {
        onOcuparAsientoAutomatico(pat);
      }
    }

    setColectivosBase((prev) =>
      prev.map((col) =>
        col.patente === pat
          ? { ...col, cupos: Math.max(0, col.cupos - asientosACobrar) }
          : col
      )
    );

    setEstaABordo(true);
    setColectivoMonitoreado(pat);
    setColectivoSeleccionado(null);

    if (onRealizarPagoPasaje) {
      onRealizarPagoPasaje(totalPagar, pat, chofer);
    }

    Alert.alert(
      '✅ Pasaje Pagado con Éxito',
      `Se transfirieron $${totalPagar.toLocaleString('es-CL')} a la consola de ${chofer} (${asientosACobrar} pasaje(s)).\n¡Buen viaje!`
    );
  };

  const enviarReportePasajero = async () => {
    if (!detalleReporte.trim()) {
      Alert.alert('Faltan datos', 'Por favor describe lo sucedido.');
      return;
    }

    const patente = colectivoSeleccionado?.patente || 'S/P';
    const origenTexto = `Pasajero: ${nombreUsuario || 'Usuario Pasajero'}`;
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs';

    setEnviandoReporte(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      await supabase.from('reportes').insert({
        autor_id: authData?.user?.id || null,
        tipo_autor: 'pasajero',
        linea_id: rutaActiva?.folio || '',
        patente_colectivo: patente,
        tipo_reporte: motivoReporte,
        descripcion: detalleReporte.trim(),
        estado: 'pendiente',
      });

      const canalFlota = supabase.channel('flota-operacional-global');
      await canalFlota.send({
        type: 'broadcast',
        event: 'nuevo_reporte_escrito',
        payload: {
          id: Date.now().toString(),
          tipo: 'pasajero_a_conductor',
          origen: origenTexto,
          patenteAfectada: patente,
          titulo: motivoReporte,
          descripcion: detalleReporte.trim(),
          hora: horaActual,
          estado: 'Pendiente',
        },
      });

      if (onCrearReporte && colectivoSeleccionado) {
        onCrearReporte({
          tipo: 'pasajero_a_conductor',
          origen: origenTexto,
          patenteAfectada: patente,
          titulo: motivoReporte,
          descripcion: detalleReporte.trim(),
        });
      }

      setModalReporteVisible(false);
      setDetalleReporte('');
      Alert.alert(
        '✅ Reporte Recibido en Garita',
        `El reclamo sobre el móvil ${patente} fue transmitido directamente a la consola de Garita Central.`
      );
    } catch (err: any) {
      Alert.alert('Error al enviar', err.message || 'No fue posible transmitir el reporte.');
    } finally {
      setEnviandoReporte(false);
    }
  };

  const handleSeleccionarDesdeMapa = (id: string) => {
    const col = colectivosFiltrados.find((c) => String(c.id) === String(id));
    if (col) {
      setColectivoSeleccionado(col);
    }
  };

  const asientosActivosParaCobro = reservaConfirmadaPorChofer ? asientosConfirmados : cantidadAsientos;
  const montoActual = TARIFA_POR_ASIENTO * asientosActivosParaCobro;

  if (!rutaActiva) {
    return (
      <View style={[styles.contenedorPrincipal, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Cargando servicios oficiales RM...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedorPrincipal}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" translucent />

      <MapaColectivos
        ref={mapaRef}
        colectivos={colectivosFiltrados}
        rutaSeleccionada={rutaActiva}
        sentidoTrazado={sentidoTrazado}
        ubicacionInicial={miUbicacion}
        onSeleccionarColectivo={handleSeleccionarDesdeMapa}
      />

      <SafeAreaView style={styles.zonaSuperiorFlotante}>
        <View style={styles.filaHeader}>
          <TouchableOpacity
            style={styles.botonHamburguesa}
            onPress={() => setMenuAbierto(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.iconoHamburguesa}>☰</Text>
          </TouchableOpacity>

          <View style={styles.contenedorInputBusqueda}>
            <Text style={styles.iconoLupa}>🚖</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, flex: 1, marginLeft: 8 }} numberOfLines={1}>
              {rutaActiva.linea} ({rutaActiva.comunas})
            </Text>
          </View>
        </View>

        {/* BARRA DE BÚSQUEDA DIRECTA */}
        <View style={{ backgroundColor: '#0B132B', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, color: '#FFFFFF', height: 38, fontSize: 13 }}
              placeholder="Buscar por Nº de línea, Folio o Comuna..."
              placeholderTextColor="#64748B"
              value={textoBusqueda}
              onChangeText={(texto) => {
                setTextoBusqueda(texto);
                setBusquedaActiva(true);
              }}
              onFocus={() => setBusquedaActiva(true)}
            />
            {textoBusqueda.length > 0 && (
              <TouchableOpacity onPress={() => { setTextoBusqueda(''); setBusquedaActiva(false); }}>
                <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* LISTA FLOTANTE DE RESULTADOS DE BÚSQUEDA */}
          {busquedaActiva && textoBusqueda.length > 0 && (
            <View style={{ maxHeight: 180, backgroundColor: '#1E293B', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#334155' }}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {serviciosFiltradosBusqueda.length === 0 ? (
                  <View style={{ padding: 10, alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>No se encontraron líneas coincidentes.</Text>
                  </View>
                ) : (
                  serviciosFiltradosBusqueda.map((r) => {
                    const folioStr = String(r.FOLIO);
                    return (
                      <TouchableOpacity
                        key={folioStr}
                        style={{ paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#334155' }}
                        onPress={() => {
                          const trazados = obtenerTrazadoPorFolio(r.FOLIO);
                          
                          let centroLat = -33.5135;
                          let centroLng = -70.7550;
                          const comuna = (r.COMUNA || '').toLowerCase();
                          
                          if (comuna.includes('florida')) { centroLat = -33.5228; centroLng = -70.5891; }
                          else if (comuna.includes('puente')) { centroLat = -33.6167; centroLng = -70.5833; }
                          else if (comuna.includes('santiago')) { centroLat = -33.4489; centroLng = -70.6693; }
                          else if (comuna.includes('maipú') || comuna.includes('maipu')) { centroLat = -33.5186; centroLng = -70.7601; }
                          else if (comuna.includes('macul')) { centroLat = -33.4950; centroLng = -70.6050; }
                          else if (comuna.includes('providencia')) { centroLat = -33.4314; centroLng = -70.6093; }
                          else {
                            const hash = Number(r.FOLIO) % 50;
                            centroLat = -33.45 - (hash * 0.0015);
                            centroLng = -70.65 + (hash * 0.0015);
                          }

                          const nuevaRuta = {
                            id: folioStr,
                            linea: r.NRO_LINEA ? `Línea ${r.NRO_LINEA}` : (r.NOMBRE_FANTASIA || 'Colectivo RM'),
                            folio: folioStr,
                            comunas: r.COMUNA || 'Santiago RM',
                            centro: { lat: centroLat, lng: centroLng },
                            trazadoIda: trazados.ida,
                            trazadoRegreso: trazados.regreso,
                          };

                          setRutaActiva(nuevaRuta);
                          
                          if (mapaRef.current) {
                            mapaRef.current.centrarEnCoordenada(centroLat, centroLng);
                          }

                          setColectivoSeleccionado(null);
                          setTextoBusqueda('');
                          setBusquedaActiva(false);
                        }}
                      >
                        <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: 'bold' }}>
                          {r.NRO_LINEA ? `Línea ${r.NRO_LINEA}` : r.NOMBRE_FANTASIA} (Folio {r.FOLIO})
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 10 }}>
                          Comuna: {r.COMUNA || 'Santiago'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.filaChipsRuta}>
          <TouchableOpacity
            style={[
              styles.chipRuta,
              sentidoTrazado === 'ida' && { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
            ]}
            onPress={() => setSentidoTrazado('ida')}
          >
            <Text
              style={[
                styles.textoChip,
                sentidoTrazado === 'ida' && { color: '#FFFFFF', fontWeight: 'bold' },
              ]}
            >
              🔵 Ida
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chipRuta,
              sentidoTrazado === 'regreso' && { backgroundColor: '#B45309', borderColor: '#F59E0B' },
            ]}
            onPress={() => setSentidoTrazado('regreso')}
          >
            <Text
              style={[
                styles.textoChip,
                sentidoTrazado === 'regreso' && { color: '#FFFFFF', fontWeight: 'bold' },
              ]}
            >
              🟡 Regreso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipRuta, sentidoTrazado === 'ambos' && styles.chipRutaActivo]}
            onPress={() => setSentidoTrazado('ambos')}
          >
            <Text style={[styles.textoChip, sentidoTrazado === 'ambos' && styles.textoChipActivo]}>
              Ambos
            </Text>
          </TouchableOpacity>
        </View>

        {estaABordo && colectivoMonitoreado && (
          <View
            style={{
              backgroundColor: '#064E3B',
              padding: 10,
              borderRadius: 10,
              marginTop: 8,
              borderWidth: 1.5,
              borderColor: '#10B981',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#A7F3D0', fontWeight: 'bold', fontSize: 12 }}>
                🚖 EN RUTA • {rutaActiva.linea}
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 11 }}>
                Móvil: {colectivoMonitoreado} • {reservaConfirmadaPorChofer ? asientosConfirmados : cantidadAsientos} asiento(s) a bordo
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#DC2626',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 6,
              }}
              onPress={handleBajarDelColectivo}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                Simular Bajar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      <TouchableOpacity
        style={styles.botonGPS}
        onPress={obtenerUbicacionGPS}
        activeOpacity={0.8}
      >
        {cargandoGPS ? (
          <ActivityIndicator size="small" color="#38BDF8" />
        ) : (
          <Text style={styles.iconoGPS}>🎯</Text>
        )}
      </TouchableOpacity>

      <View style={styles.tarjetaInferior}>
        <View style={styles.indicadorArrastre} />
        <View style={styles.headerTarjeta}>
          <Text style={styles.tituloTarjeta}>
            {rutaActiva.linea} • {sentidoTrazado === 'ida' ? 'Ida' : sentidoTrazado === 'regreso' ? 'Regreso' : 'Ambos Sentidos'}
          </Text>
          <Text style={styles.contadorEncontrados}>
            {colectivosFiltrados.length} en servicio
          </Text>
        </View>

        <ScrollView style={styles.scrollListaColectivos} showsVerticalScrollIndicator={false}>
          {colectivosFiltrados.length === 0 ? (
            <View style={styles.sinResultados}>
              <Text style={styles.textoSinResultados}>
                No hay vehículos en ruta para {rutaActiva.linea} (Folio {rutaActiva.folio}).
              </Text>
            </View>
          ) : (
            colectivosFiltrados.map((col) => (
              <TouchableOpacity
                key={col.id}
                style={styles.itemColectivo}
                activeOpacity={0.7}
                onPress={() => setColectivoSeleccionado(col)}
              >
                <View style={styles.cajaNumeroRuta}>
                  <Text style={styles.badgeRuta}>L-{col.ruta}</Text>
                  <Text style={styles.patenteCol}>{col.patente}</Text>
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.nombreRuta} numberOfLines={1}>
                    {col.origenDestino}
                  </Text>
                  <Text style={styles.minutosCol}>
                    {col.estado === 'en_garita' ? (
                      <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>🏢 En Garita Central</Text>
                    ) : (
                      <>
                        Est: <Text style={styles.minutosDestaque}>{col.llegadaMinutos} min</Text> • Chofer: {col.conductorNombre.split(' ')[0]}
                      </>
                    )}
                  </Text>
                </View>

                <View style={styles.datosCupos}>
                  {col.estado === 'en_garita' ? (
                    <Text style={[styles.cuposCol, { color: '#38BDF8' }]}>GARITA</Text>
                  ) : (
                    <Text
                      style={[
                        styles.cuposCol,
                        col.cupos === 0 ? styles.cuposLleno : styles.cuposDisponibles,
                      ]}
                    >
                      {col.cupos > 0 ? `💺 ${col.cupos} libres` : '🚫 LLENO'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Modal Ficha y Asientos Disponibles */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={colectivoSeleccionado !== null}
        onRequestClose={() => {
          if (!solicitandoReserva) setColectivoSeleccionado(null);
        }}
      >
        <View style={styles.modalCentroFondo}>
          {colectivoSeleccionado && (
            <View style={styles.tarjetaFichaSeguridad}>
              <View style={styles.cabeceraFicha}>
                <View>
                  <Text style={styles.tituloFicha}>Ficha Oficial CONATACOCH</Text>
                  <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold' }}>
                    {rutaActiva.linea} (Folio {colectivoSeleccionado.folio}) • Móvil {colectivoSeleccionado.patente}
                  </Text>
                </View>
                <View style={styles.badgeVerificado}>
                  <Text style={styles.textoVerificado}>VERIFICADO</Text>
                </View>
              </View>

              <View style={styles.perfilConductorRow}>
                <View style={styles.fotoConductor}>
                  <Text style={{ fontSize: 26 }}>👨🏻‍✈️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nombreConductorFicha}>
                    {colectivoSeleccionado.conductorNombre}
                  </Text>
                  <Text style={styles.licenciaFicha}>
                    {colectivoSeleccionado.conductorLicencia}
                  </Text>
                  <Text style={styles.rutFicha}>
                    RUT: {colectivoSeleccionado.conductorRut}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: colectivoSeleccionado.cupos > 0 ? '#064E3B' : '#7F1D1D',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginVertical: 6,
                  borderWidth: 1.5,
                  borderColor: colectivoSeleccionado.cupos > 0 ? '#10B981' : '#EF4444',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                  {colectivoSeleccionado.cupos > 0
                    ? `💺 ${colectivoSeleccionado.cupos} ASIENTOS DISPONIBLES EN ESTE MÓVIL`
                    : '🚫 COLECTIVO SIN ASIENTOS DISPONIBLES (LLENO)'}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: '#0F172A',
                  padding: 12,
                  borderRadius: 10,
                  marginVertical: 8,
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
              >
                <Text
                  style={{
                    color: '#94A3B8',
                    fontSize: 12,
                    textAlign: 'center',
                    marginBottom: 8,
                    fontWeight: '600',
                  }}
                >
                  {reservaConfirmadaPorChofer
                    ? 'ASIENTOS APARTADOS PARA ESTE VIAJE'
                    : '¿CUÁNTOS ASIENTOS RESERVAS?'}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor:
                        cantidadAsientos <= 1 ||
                        solicitandoReserva ||
                        reservaConfirmadaPorChofer ||
                        colectivoSeleccionado.estado === 'en_garita'
                          ? '#334155'
                          : '#0284C7',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => setCantidadAsientos((prev) => Math.max(1, prev - 1))}
                    disabled={
                      cantidadAsientos <= 1 ||
                      solicitandoReserva ||
                      reservaConfirmadaPorChofer ||
                      colectivoSeleccionado.estado === 'en_garita'
                    }
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' }}>−</Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 24,
                      fontWeight: 'bold',
                      marginHorizontal: 22,
                    }}
                  >
                    {asientosActivosParaCobro}{' '}
                    {asientosActivosParaCobro === 1 ? 'asiento' : 'asientos'}
                  </Text>

                  <TouchableOpacity
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor:
                        cantidadAsientos >= colectivoSeleccionado.cupos ||
                        solicitandoReserva ||
                        reservaConfirmadaPorChofer ||
                        colectivoSeleccionado.estado === 'en_garita'
                          ? '#334155'
                          : '#0284C7',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      if (cantidadAsientos < colectivoSeleccionado.cupos) {
                        setCantidadAsientos((prev) => prev + 1);
                      }
                    }}
                    disabled={
                      cantidadAsientos >= colectivoSeleccionado.cupos ||
                      solicitandoReserva ||
                      reservaConfirmadaPorChofer ||
                      colectivoSeleccionado.estado === 'en_garita'
                    }
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' }}>+</Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    color: '#10B981',
                    fontSize: 15,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  Total a pagar al subir: ${montoActual.toLocaleString('es-CL')} CLP
                </Text>
              </View>

              {colectivoSeleccionado.estado === 'en_garita' ? (
                <View
                  style={{
                    padding: 10,
                    backgroundColor: '#0C4A6E',
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: '#BAE6FD', fontWeight: 'bold', fontSize: 12 }}>
                    🏢 MÓVIL EN GARITA ESPERANDO SALIDA
                  </Text>
                </View>
              ) : !reservaConfirmadaPorChofer ? (
                solicitandoReserva ? (
                  <View
                    style={{
                      padding: 12,
                      backgroundColor: '#0F172A',
                      borderRadius: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: '#38BDF8',
                    }}
                  >
                    <ActivityIndicator size="small" color="#38BDF8" />
                    <Text
                      style={{
                        color: '#38BDF8',
                        fontSize: 12,
                        marginTop: 6,
                        fontWeight: 'bold',
                      }}
                    >
                      Esperando confirmación del chofer (sin cobro aún)...
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{
                      backgroundColor: colectivoSeleccionado.cupos > 0 ? '#0284C7' : '#334155',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                    onPress={solicitarReservaConductor}
                    disabled={colectivoSeleccionado.cupos <= 0}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                      🚖 APARTAR {cantidadAsientos}{' '}
                      {cantidadAsientos === 1 ? 'ASIENTO' : 'ASIENTOS'} (GRATIS)
                    </Text>
                  </TouchableOpacity>
                )
              ) : (
                <View
                  style={{
                    backgroundColor: '#064E3B',
                    padding: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: '#10B981',
                  }}
                >
                  <Text style={{ color: '#A7F3D0', fontWeight: 'bold', fontSize: 12 }}>
                    ✅ ASIENTOS BLOQUEADOS CON ÉXITO
                  </Text>
                  <Text style={{ color: '#E2E8F0', fontSize: 11 }}>
                    Acércate al auto para que se habilite el pago.
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.cajaDistanciaGPS,
                  distanciaAlSeleccionado <= 35 ? styles.distanciaCerca : styles.distanciaLejos,
                ]}
              >
                <Text style={{ fontSize: 20 }}>
                  {distanciaAlSeleccionado <= 35 ? '📶' : '📍'}
                </Text>
                <Text
                  style={[
                    styles.textoDistancia,
                    { color: distanciaAlSeleccionado <= 35 ? '#A7F3D0' : '#FECACA' },
                  ]}
                >
                  Distancia: {distanciaAlSeleccionado} metros.{'\n'}
                  {distanciaAlSeleccionado <= 35
                    ? '¡En rango! Puedes confirmar y pagar el pasaje.'
                    : 'Acércate al colectivo (< 35m) para desbloquear el pago.'}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.botonPagarPasaje,
                  distanciaAlSeleccionado > 35 && styles.botonPagarDeshabilitado,
                ]}
                disabled={distanciaAlSeleccionado > 35 || solicitandoReserva}
                onPress={ejecutarPago}
                activeOpacity={0.8}
              >
                <Text style={styles.textoBotonPagar}>
                  {distanciaAlSeleccionado <= 35
                    ? `💳 PAGAR $${montoActual.toLocaleString('es-CL')} Y SUBIR (${asientosActivosParaCobro} pax)`
                    : '🔒 ESPERANDO CERCANÍA (< 35m)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#7F1D1D',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginTop: 4,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: '#EF4444',
                }}
                onPress={() => setModalReporteVisible(true)}
              >
                <Text style={{ color: '#FECACA', fontSize: 12, fontWeight: 'bold' }}>
                  ⚠️ REPORTAR IRREGULARIDAD / RECLAMO
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#1E293B',
                    padding: 8,
                    borderRadius: 6,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#38BDF8',
                  }}
                  onPress={() => setDistanciaSimulada(15)}
                >
                  <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: 'bold' }}>
                    Simular Cerca (15m)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#1E293B',
                    padding: 8,
                    borderRadius: 6,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#EF4444',
                  }}
                  onPress={() => setDistanciaSimulada(120)}
                >
                  <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: 'bold' }}>
                    Simular Lejos (120m)
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.botonCerrarModalFicha}
                onPress={() => setColectivoSeleccionado(null)}
                disabled={solicitandoReserva}
              >
                <Text style={styles.textoCerrarModalFicha}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal Reporte a Garita */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalReporteVisible}
        onRequestClose={() => setModalReporteVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: '#EF4444',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
              ⚠️ Reportar Colectivo {colectivoSeleccionado?.patente}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 14 }}>
              Chofer: {colectivoSeleccionado?.conductorNombre}
            </Text>

            <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>
              Motivo del Reclamo:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {['Exceso de velocidad', 'Cobro indebido', 'Mala atención', 'Desvío de ruta', 'Objeto extraviado'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={{
                    backgroundColor: motivoReporte === item ? '#DC2626' : '#0F172A',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    marginRight: 6,
                    borderWidth: 1,
                    borderColor: motivoReporte === item ? '#EF4444' : '#334155',
                  }}
                  onPress={() => setMotivoReporte(item)}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>
              Descripción de lo sucedido:
            </Text>
            <TextInput
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 8,
                padding: 10,
                color: '#FFFFFF',
                height: 80,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: '#334155',
                fontSize: 13,
                marginBottom: 16,
              }}
              placeholder="Escribe brevemente los detalles para la Garita..."
              placeholderTextColor="#64748B"
              multiline
              value={detalleReporte}
              onChangeText={setDetalleReporte}
            />

            <TouchableOpacity
              style={{
                backgroundColor: '#DC2626',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 8,
              }}
              onPress={enviarReportePasajero}
              disabled={enviandoReporte}
            >
              {enviandoReporte ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                  TRANSMITIR REPORTE A GARITA
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 8, alignItems: 'center' }}
              onPress={() => setModalReporteVisible(false)}
              disabled={enviandoReporte}
            >
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DRAWER / MENÚ LATERAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuAbierto}
        onRequestClose={() => setMenuAbierto(false)}
      >
        <View style={styles.overlayModal}>
          <TouchableOpacity
            style={styles.fondoCierre}
            activeOpacity={1}
            onPress={() => setMenuAbierto(false)}
          />

          <View style={styles.panelDrawer}>
            <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
              <View style={styles.drawerHeader}>
                <View style={styles.avatarUsuario}>
                  <Text style={styles.textoAvatar}>👤</Text>
                </View>

                <Text style={styles.nombreDrawer} numberOfLines={1}>
                  {nombreUsuario || (esAdmin ? 'Supervisor Admin' : 'Pasajero')}
                </Text>
                <Text style={styles.correoDrawer} numberOfLines={1}>
                  {correoUsuario || ''}
                </Text>

                <View style={styles.cajaSaldoDrawer}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.labelSaldoDrawer}>Saldo en Pase</Text>
                    <Text style={styles.montoSaldoDrawer}>${saldo.toLocaleString('es-CL')}</Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#10B981',
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      alignSelf: 'center',
                    }}
                    onPress={() => {
                      setMenuAbierto(false);
                      setModalRecargaVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>
                      + Recargar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flex: 1, marginTop: 6 }}>
                <ScrollView style={styles.drawerOpciones} showsVerticalScrollIndicator={false}>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                    Accesos Habilitados ({rolUsuario === 'conductor_garita' ? 'Chofer & Garita' : rolUsuario.toUpperCase()})
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.itemMenu,
                      { backgroundColor: '#064E3B', borderRadius: 8, paddingHorizontal: 10, marginBottom: 8 },
                    ]}
                    onPress={() => {
                      setMenuAbierto(false);
                      setModalRecargaVisible(true);
                    }}
                  >
                    <Text style={styles.iconoItem}>💳</Text>
                    <View>
                      <Text style={[styles.textoItem, { color: '#A7F3D0' }]}>Recargar Saldo Digital</Text>
                      <Text style={[styles.descItem, { color: '#6EE7B7' }]}>Añadir fondos para pasajes</Text>
                    </View>
                  </TouchableOpacity>

                  {(rolUsuario === 'conductor' || rolUsuario === 'conductor_garita' || rolUsuario === 'admin' || esAdmin) && (
                    <TouchableOpacity
                      style={[
                        styles.itemMenu,
                        { backgroundColor: '#78350F', borderRadius: 8, paddingHorizontal: 10, marginBottom: 8 },
                      ]}
                      onPress={() => irAPanelEspecial('conductor')}
                    >
                      <Text style={styles.iconoItem}>🚕</Text>
                      <View>
                        <Text style={[styles.textoItem, { color: '#FDE68A' }]}>Consola de Conductor</Text>
                        <Text style={[styles.descItem, { color: '#FCD34D' }]}>Gestionar colectivo y ruta</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {(rolUsuario === 'garita' || rolUsuario === 'conductor_garita' || rolUsuario === 'admin' || esAdmin) && (
                    <TouchableOpacity
                      style={[
                        styles.itemMenu,
                        { backgroundColor: '#0C4A6E', borderRadius: 8, paddingHorizontal: 10, marginBottom: 8 },
                      ]}
                      onPress={() => irAPanelEspecial('garita')}
                    >
                      <Text style={styles.iconoItem}>🏢</Text>
                      <View>
                        <Text style={[styles.textoItem, { color: '#BAE6FD' }]}>Central de Garita</Text>
                        <Text style={[styles.descItem, { color: '#7DD3FC' }]}>Supervisión de flota y reportes</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {(rolUsuario === 'admin' || esAdmin) && (
                    <TouchableOpacity
                      style={[
                        styles.itemMenu,
                        { backgroundColor: '#7F1D1D', borderRadius: 8, paddingHorizontal: 10, marginBottom: 8 },
                      ]}
                      onPress={() => irAPanelEspecial('admin')}
                    >
                      <Text style={styles.iconoItem}>🛡️</Text>
                      <View>
                        <Text style={[styles.textoItem, { color: '#FECACA' }]}>Panel Administrador</Text>
                        <Text style={[styles.descItem, { color: '#FCA5A5' }]}>Gestión gremial y accesos</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              <View style={styles.drawerFooter}>
                <TouchableOpacity style={styles.botonCerrarVista} onPress={onVolver}>
                  <Text style={styles.textoCerrarVista}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Modal Recarga */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalRecargaVisible}
        onRequestClose={() => setModalRecargaVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 16,
              padding: 22,
              borderWidth: 1.5,
              borderColor: '#10B981',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              💳 Recarga de Saldo Digital
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#94A3B8',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              Saldo actual: <Text style={{ color: '#10B981', fontWeight: 'bold' }}>${saldo.toLocaleString('es-CL')} CLP</Text>
            </Text>

            <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>
              Montos rápidos sugeridos:
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[2000, 5000, 10000].map((monto) => (
                <TouchableOpacity
                  key={monto}
                  style={{
                    flex: 1,
                    backgroundColor: '#0F172A',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#10B981',
                  }}
                  onPress={() => procesarRecarga(monto)}
                >
                  <Text style={{ color: '#A7F3D0', fontWeight: 'bold', fontSize: 13 }}>
                    +${monto.toLocaleString('es-CL')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>
              O ingresa otro valor:
            </Text>
            <TextInput
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 8,
                padding: 12,
                color: '#FFFFFF',
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#334155',
                marginBottom: 16,
              }}
              placeholder="Ej: 3000"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={montoPersonalizado}
              onChangeText={setMontoPersonalizado}
            />

            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
                marginBottom: 10,
              }}
              onPress={() => procesarRecarga(parseInt(montoPersonalizado, 10) || 0)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>
                CONFIRMAR RECARGA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 8, alignItems: 'center' }}
              onPress={() => setModalRecargaVisible(false)}
            >
              <Text style={{ color: '#94A3B8', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

