import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { conductorStyles as styles } from '../styles/conductorStyles';
import { NuevoReporteData } from './PasajeroScreen';
import { ReporteGremial } from './GaritaScreen';
import { RUTAS_SELECCIONADAS } from '../data/rutasOficiales';
import FormularioDocumentosConductor from '../components/FormularioDocumentosConductor';

export type EstadoServicio = 'en_ruta' | 'en_garita' | 'fuera_servicio';

export interface DatosTurnoConductor {
  patente: string;
  ruta: string;
  folio: string;
  origenDestino: string;
  capacidad: number;
}

export interface UltimoPagoRecibido {
  monto: number;
  pasajeroNombre: string;
  hora: string;
}

export interface SolicitudReserva {
  id: string;
  colectivo_id: string;
  pasajero_id: string;
  pasajero_nombre: string;
  asientos_solicitados: number;
  monto_total: number;
  estado: string;
}

export interface RegistroJornadaAnterior {
  id: string;
  fecha: string;
  pasajerosTotales: number;
  recaudacionTotal: number;
  patente: string;
}

export interface ConductorScreenProps {
  onVolver: () => void;
  datosTurno?: DatosTurnoConductor;
  onGuardarDatosTurno?: (datos: DatosTurnoConductor) => void;
  cuposDisponibles?: number;
  onCambiarCupos?: (nuevosCupos: number) => void;
  estadoServicio?: EstadoServicio;
  onCambiarEstadoServicio?: (nuevoEstado: EstadoServicio) => void;
  pasajerosHoy?: number;
  onRegistrarPasajero?: () => void;
  ultimoPago?: UltimoPagoRecibido | null;
  onCrearReporte?: (data: NuevoReporteData) => void;
  nombreConductor?: string;
  reportesColegas?: ReporteGremial[];
}

export default function ConductorScreen({
  onVolver,
  datosTurno: datosProp,
  onGuardarDatosTurno,
  cuposDisponibles: cuposProp,
  onCambiarCupos,
  estadoServicio: estadoProp,
  onCambiarEstadoServicio,
  pasajerosHoy: pasajerosProp,
  onRegistrarPasajero,
  ultimoPago: ultimoPagoProp,
  onCrearReporte,
  nombreConductor = 'Conductor en Turno',
  reportesColegas = [],
}: ConductorScreenProps) {
  // Patente parte vacía hasta que el chofer acreditado la configure o venga por props
  const [patenteInput, setPatenteInput] = useState<string>(datosProp?.patente || '');
  const [folioSeleccionado, setFolioSeleccionado] = useState<string>(datosProp?.folio || '236023');
  const [rutaInput, setRutaInput] = useState<string>(datosProp?.ruta || '6023');
  const [trayectoInput, setTrayectoInput] = useState<string>(
    datosProp?.origenDestino || 'René Olivares ⇄ Los Cancilleres'
  );
  const [modoEdicionTurno, setModoEdicionTurno] = useState<boolean>(!datosProp?.patente);

  // Línea decidida previamente por el Administrador
  const [lineaAsignadaAdmin, setLineaAsignadaAdmin] = useState<string>('6023');

  const [usuarioIdActual, setUsuarioIdActual] = useState<string>('');
  const esCuentaAdmin = nombreConductor?.toLowerCase().includes('admin');
  const [estadoValidacion, setEstadoValidacion] = useState<'pendiente_subida' | 'en_revision_garita' | 'aprobado'>('aprobado');
  const [verificandoPapeles, setVerificandoPapeles] = useState<boolean>(true);

  const [cuposLocal, setCuposLocal] = useState<number>(cuposProp ?? 4);
  const [estadoLocal, setEstadoLocal] = useState<EstadoServicio>(estadoProp ?? 'en_garita');
  const [pasajerosPagados, setPasajerosPagados] = useState<number>(pasajerosProp ?? 0);
  const [ultimoPagoLocal, setUltimoPagoLocal] = useState<UltimoPagoRecibido | null>(ultimoPagoProp || null);
  const [ocultarDinero, setOcultarDinero] = useState<boolean>(true);

  // Historial de turnos
  const [historialJornadas, setHistorialJornadas] = useState<RegistroJornadaAnterior[]>([]);
  const [modalHistorialVisible, setModalHistorialVisible] = useState<boolean>(false);

  // Reportes a Garita
  const [modalReporteVisible, setModalReporteVisible] = useState<boolean>(false);
  const [tipoIncidente, setTipoIncidente] = useState<string>('Accidente en la ruta');
  const [detalleIncidente, setDetalleIncidente] = useState<string>('');
  const [enviandoReporte, setEnviandoReporte] = useState<boolean>(false);

  // Solicitudes de reservas
  const [solicitudEntrante, setSolicitudEntrante] = useState<SolicitudReserva | null>(null);

  // Campanita de novedades
  const [alertasModeradas, setAlertasModeradas] = useState<ReporteGremial[]>(
    reportesColegas.filter((r) => r.difundirAFlota)
  );
  const [modalCampanitaVisible, setModalCampanitaVisible] = useState<boolean>(false);

  const capacidadMaxima = datosProp?.capacidad || 4;
  const tarifaPorPasaje = 1000;

  const cuposActuales = cuposProp !== undefined ? cuposProp : cuposLocal;
  const estadoActual = estadoProp !== undefined ? estadoProp : estadoLocal;

  // 1. Verificación por USUARIO (Auth ID) y consulta de la línea asignada por el Administrador
  useEffect(() => {
    const verificarUsuarioYDocumentacion = async () => {
      try {
        setVerificandoPapeles(true);
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (uid) setUsuarioIdActual(uid);

        if (esCuentaAdmin) {
          setEstadoValidacion('aprobado');
          return;
        }

        if (uid) {
          // Consultar la línea designada por el Administrador en la tabla perfiles
          try {
            const { data: perfilData } = await supabase
              .from('perfiles')
              .select('linea_asignada')
              .eq('id', uid)
              .single();

            if (perfilData?.linea_asignada) {
              setLineaAsignadaAdmin(perfilData.linea_asignada);
              const rutaCorrespondiente = RUTAS_SELECCIONADAS.find(
                (r) => r.linea.replace('Línea ', '') === perfilData.linea_asignada
              );
              if (rutaCorrespondiente) {
                setRutaInput(perfilData.linea_asignada);
                setFolioSeleccionado(rutaCorrespondiente.folio);
                setTrayectoInput(`${rutaCorrespondiente.callesIda[0].calle} ⇄ ${rutaCorrespondiente.callesRegreso[0].calle}`);
              }
            }
          } catch (e) {
            console.log('Aviso consultando linea_asignada:', e);
          }

          // Consultar el estado de los documentos del chofer
          const { data, error } = await supabase
            .from('documentacion_conductores')
            .select('estado_validacion, patente')
            .eq('usuario_id', uid)
            .single();

          if (!error && data) {
            setEstadoValidacion(data.estado_validacion || 'aprobado');
            if (data.patente && !data.patente.startsWith('PENDIENTE-')) {
              setPatenteInput(data.patente);
              setModoEdicionTurno(false);
            }
          } else {
            setEstadoValidacion('pendiente_subida');
          }
        } else {
          setEstadoValidacion('pendiente_subida');
        }
      } catch (e) {
        console.log('Error verificando usuario:', e);
        setEstadoValidacion('aprobado');
      } finally {
        setVerificandoPapeles(false);
      }
    };

    verificarUsuarioYDocumentacion();
  }, [esCuentaAdmin]);

  // 2. Canales broadcast globales (Garita y Flota)
  useEffect(() => {
    const canalFlota = supabase
      .channel('flota-operacional-global')
      .on(
        'broadcast',
        { event: 'conductor_aprobado_garita' },
        (payload: { payload: { usuarioId?: string; patente?: string } }) => {
          if (payload.payload.usuarioId === usuarioIdActual) {
            setEstadoValidacion('aprobado');
            Alert.alert(
              '🎉 ¡Acreditación Aprobada!',
              'Garita Central ha verificado tus documentos. Ahora ingresa la patente de tu móvil y confirma el recorrido.'
            );
          }
        }
      )
      .on(
        'broadcast',
        { event: 'cambio_estado_movil' },
        (payload: { payload: { patente: string; nuevoEstado: EstadoServicio } }) => {
          if (patenteInput && payload.payload.patente.toUpperCase() === patenteInput.toUpperCase()) {
            setEstadoLocal(payload.payload.nuevoEstado);
            if (typeof onCambiarEstadoServicio === 'function') {
              onCambiarEstadoServicio(payload.payload.nuevoEstado);
            }
            Alert.alert(
              '🏢 Orden de Garita',
              `La Garita Central ha cambiado tu estado operacional a: ${payload.payload.nuevoEstado.replace('_', ' ').toUpperCase()}`
            );
          }
        }
      )
      .on(
        'broadcast',
        { event: 'actualizar_alertas_conductores' },
        (payload: { payload: { reportesAprobados: ReporteGremial[] } }) => {
          setAlertasModeradas(payload.payload.reportesAprobados || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalFlota);
    };
  }, [usuarioIdActual, patenteInput]);

  // 3. Canal de reservas y pagos por vehículo
  useEffect(() => {
    if (!patenteInput || patenteInput.startsWith('PENDIENTE-')) return;

    const canalReservasYPagos = supabase
      .channel(`conductor-canal-${patenteInput}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservas',
          filter: `colectivo_id=eq.${patenteInput}`,
        },
        (payload: { new: SolicitudReserva }) => {
          if (payload.new.estado === 'pendiente') {
            setSolicitudEntrante(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservas',
          filter: `colectivo_id=eq.${patenteInput}`,
        },
        (payload: { new: SolicitudReserva }) => {
          if (payload.new.estado === 'finalizada') {
            const { asientos_solicitados, monto_total, pasajero_nombre } = payload.new;

            setPasajerosPagados((prev) => prev + asientos_solicitados);
            if (typeof onRegistrarPasajero === 'function') {
              for (let i = 0; i < asientos_solicitados; i++) {
                onRegistrarPasajero();
              }
            }

            const ahora = new Date();
            const horaFormato = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
            setUltimoPagoLocal({
              monto: monto_total,
              pasajeroNombre: pasajero_nombre,
              hora: horaFormato,
            });

            Alert.alert(
              '💰 ¡Dinero Recibido por App!',
              `Se han acreditado $${monto_total.toLocaleString('es-CL')} de ${pasajero_nombre} (${asientos_solicitados} pasaje(s)).`
            );
          }
        }
      )
      .on(
        'broadcast',
        { event: 'liberar_asiento' },
        (payload: { payload: { asientosLiberados: number } }) => {
          const cant = payload.payload?.asientosLiberados || 1;
          setCuposLocal((prev) => {
            const nuevos = Math.min(capacidadMaxima, prev + cant);
            if (typeof onCambiarCupos === 'function') {
              onCambiarCupos(nuevos);
            }
            return nuevos;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalReservasYPagos);
    };
  }, [patenteInput]);

  const responderSolicitud = async (aceptar: boolean) => {
    if (!solicitudEntrante) return;

    if (aceptar && cuposActuales < solicitudEntrante.asientos_solicitados) {
      Alert.alert(
        'Sin cupos suficientes',
        `Piden ${solicitudEntrante.asientos_solicitados} cupo(s), pero solo dispones de ${cuposActuales}.`
      );
      return;
    }

    const nuevoEstado = aceptar ? 'aceptada' : 'rechazada';

    try {
      const { error } = await supabase
        .from('reservas')
        .update({ estado: nuevoEstado })
        .eq('id', solicitudEntrante.id);

      if (error) throw error;

      if (aceptar) {
        const nuevosCupos = Math.max(0, cuposActuales - solicitudEntrante.asientos_solicitados);
        setCuposLocal(nuevosCupos);
        if (typeof onCambiarCupos === 'function') {
          onCambiarCupos(nuevosCupos);
        }

        Alert.alert(
          '✅ Reserva Aceptada',
          `Asientos apartados para ${solicitudEntrante.pasajero_nombre}. El monto se sumará en cuanto el pasajero pague al abordar.`
        );
      } else {
        Alert.alert('Reserva Rechazada', 'La solicitud ha sido denegada.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la reserva.');
    } finally {
      setSolicitudEntrante(null);
    }
  };

  // 4. Confirmar turno: Aquí recién se registra la patente del auto seleccionado
  const handleGuardarTurno = async () => {
    if (!patenteInput.trim() || !rutaInput.trim() || !trayectoInput.trim()) {
      Alert.alert('Datos Incompletos', 'Ingresa la patente del colectivo y el trayecto asignado.');
      return;
    }

    const patenteLimpia = patenteInput.trim().toUpperCase();

    const datosGuardados: DatosTurnoConductor = {
      patente: patenteLimpia,
      ruta: rutaInput.trim(),
      folio: folioSeleccionado,
      origenDestino: trayectoInput.trim(),
      capacidad: 4,
    };

    if (usuarioIdActual) {
      await supabase
        .from('documentacion_conductores')
        .update({ patente: patenteLimpia })
        .eq('usuario_id', usuarioIdActual);
    }

    if (onGuardarDatosTurno) {
      onGuardarDatosTurno(datosGuardados);
    }

    setModoEdicionTurno(false);
    Alert.alert(
      '✅ Móvil en Servicio',
      `Colectivo ${datosGuardados.patente} asignado a la Línea ${datosGuardados.ruta} (Folio ${datosGuardados.folio}).`
    );
  };

  const handleSeleccionarRutaPreset = (ruta: typeof RUTAS_SELECCIONADAS[0]) => {
    setFolioSeleccionado(ruta.folio);
    setRutaInput(ruta.linea.replace('Línea ', ''));
    setTrayectoInput(`${ruta.callesIda[0].calle} ⇄ ${ruta.callesRegreso[0].calle}`);
  };

  const avisoControlGarita = () => {
    Alert.alert(
      '🔒 Control Operacional Centralizado',
      'El estado de tu móvil (En Garita, En Ruta o Fuera de Servicio) es gestionado de forma exclusiva por la Garita Central de la Línea.'
    );
  };

  const aumentarCupo = () => {
    if (cuposActuales < capacidadMaxima) {
      const nuevo = cuposActuales + 1;
      setCuposLocal(nuevo);
      if (typeof onCambiarCupos === 'function') onCambiarCupos(nuevo);
    } else {
      Alert.alert('Capacidad Máxima', `El colectivo ya tiene sus ${capacidadMaxima} asientos libres.`);
    }
  };

  const restarCupo = () => {
    if (cuposActuales > 0) {
      const nuevoCupo = cuposActuales - 1;
      setCuposLocal(nuevoCupo);
      if (typeof onCambiarCupos === 'function') onCambiarCupos(nuevoCupo);
      setPasajerosPagados((prev) => prev + 1);
      if (typeof onRegistrarPasajero === 'function') onRegistrarPasajero();

      const ahora = new Date();
      setUltimoPagoLocal({
        monto: tarifaPorPasaje,
        pasajeroNombre: 'Pasajero en Calle',
        hora: ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      });
    } else {
      Alert.alert('Colectivo Lleno', 'No puedes restar más cupos: todos los asientos están ocupados.');
    }
  };

  const handleIniciarNuevoDia = () => {
    Alert.alert(
      '🌅 Iniciar Nuevo Día',
      `¿Deseas cerrar la jornada actual?\n\n• Pasajeros transportados: ${pasajerosPagados}\n• Recaudación: $${(pasajerosPagados * tarifaPorPasaje).toLocaleString('es-CL')} CLP\n\nLos contadores volverán a 0 y este registro quedará archivado en tu historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Día y Reiniciar',
          style: 'destructive',
          onPress: () => {
            if (pasajerosPagados > 0) {
              const ahora = new Date();
              const fechaTexto = ahora.toLocaleDateString('es-CL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const nuevoRegistro: RegistroJornadaAnterior = {
                id: Date.now().toString(),
                fecha: fechaTexto,
                pasajerosTotales: pasajerosPagados,
                recaudacionTotal: pasajerosPagados * tarifaPorPasaje,
                patente: patenteInput || 'SIN PATENTE',
              };

              setHistorialJornadas((prev) => [nuevoRegistro, ...prev]);
            }

            setPasajerosPagados(0);
            setUltimoPagoLocal(null);
            setCuposLocal(capacidadMaxima);
            if (typeof onCambiarCupos === 'function') onCambiarCupos(capacidadMaxima);

            Alert.alert(
              '✅ Nueva Jornada Iniciada',
              'Los pasajeros y la recaudación están en $0. ¡Buen turno!'
            );
          },
        },
      ]
    );
  };

  const enviarReporteConductor = async () => {
    if (!detalleIncidente.trim()) {
      Alert.alert('Falta Detalle', 'Escribe una breve descripción del incidente vial.');
      return;
    }

    const origenTexto = `Colega: ${nombreConductor} (${patenteInput || 'En Ruta'})`;
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs';

    setEnviandoReporte(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      await supabase.from('reportes').insert({
        autor_id: authData?.user?.id || null,
        tipo_autor: 'conductor',
        linea_id: rutaInput || '6023',
        patente_colectivo: patenteInput,
        tipo_reporte: tipoIncidente,
        descripcion: detalleIncidente.trim(),
        estado: 'pendiente',
        difundir_a_flota: false,
      });

      const canalFlota = supabase.channel('flota-operacional-global');
      await canalFlota.send({
        type: 'broadcast',
        event: 'nuevo_reporte_escrito',
        payload: {
          id: Date.now().toString(),
          tipo: 'conductor_a_garita',
          origen: origenTexto,
          patenteAfectada: patenteInput,
          lineaAfectada: rutaInput || '6023',
          titulo: tipoIncidente,
          descripcion: detalleIncidente.trim(),
          hora: horaActual,
          estado: 'Pendiente',
          difundirAFlota: false,
        },
      });

      if (onCrearReporte) {
        onCrearReporte({
          tipo: 'conductor_a_garita',
          origen: origenTexto,
          patenteAfectada: patenteInput,
          titulo: tipoIncidente,
          descripcion: detalleIncidente.trim(),
        });
      }

      setModalReporteVisible(false);
      setDetalleIncidente('');
      Alert.alert(
        'Alerta Enviada a Garita',
        `Tu reporte de "${tipoIncidente}" fue transmitido a Garita Central. El operador decidirá si difundirlo a la flota.`
      );
    } catch (err: any) {
      Alert.alert('Error al enviar', err.message || 'No fue posible transmitir el reporte.');
    } finally {
      setEnviandoReporte(false);
    }
  };

  const handleBotonPanico = () => {
    Alert.alert(
      '⚠️ ALERTA DE EMERGENCIA',
      `¿Deseas enviar una señal de auxilio urgente a Garita y colegas para el móvil ${patenteInput || 'actual'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'EMITIR ALERTA',
          style: 'destructive',
          onPress: async () => {
            const ahora = new Date();
            const horaFormato = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs';

            try {
              const canalFlota = supabase.channel('flota-operacional-global');
              await canalFlota.send({
                type: 'broadcast',
                event: 'alerta_panico',
                payload: {
                  patente: patenteInput || 'S/P',
                  conductor: nombreConductor,
                  linea: rutaInput,
                  hora: horaFormato,
                  mensaje: 'El conductor ha activado el BOTÓN DE PÁNICO en ruta. Requiere auxilio o asistencia inmediata.',
                },
              });
            } catch (err) {
              console.log('Error transmitiendo señal de pánico:', err);
            }

            if (onCrearReporte) {
              onCrearReporte({
                tipo: 'conductor_a_garita',
                origen: `Colega: ${nombreConductor} (${patenteInput || 'S/P'})`,
                patenteAfectada: patenteInput,
                titulo: '🚨 ALERTA DE EMERGENCIA / AUXILIO',
                descripcion: 'El conductor ha activado el botón de pánico en ruta. Se solicita asistencia inmediata.',
              });
            }

            Alert.alert('Alerta Emitida', 'Señal de auxilio transmitida a Garita Central y a la flota.');
          },
        },
      ]
    );
  };

  const getEstiloTextoCupos = () => {
    if (cuposActuales === 0) return '#EF4444';
    if (cuposActuales <= 2) return '#F59E0B';
    return '#10B981';
  };

  const pagoMostrado = ultimoPagoLocal || ultimoPagoProp;
  const primerReporte = alertasModeradas.length > 0 ? alertasModeradas[0] : null;

  if (verificandoPapeles) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B132B', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={{ color: '#94A3B8', marginTop: 12, fontSize: 13 }}>Verificando acreditación gremial...</Text>
      </SafeAreaView>
    );
  }

  // PASO 1: Subir papeles por primera vez con la línea preasignada por el Administrador
  if (estadoValidacion === 'pendiente_subida' && !esCuentaAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B132B' }}>
        <FormularioDocumentosConductor
          conductorNombre={nombreConductor}
          usuarioId={usuarioIdActual}
          lineaAsignada={lineaAsignadaAdmin}
          onDocumentosEnviados={() => setEstadoValidacion('en_revision_garita')}
          onVolver={onVolver}
        />
      </SafeAreaView>
    );
  }

  // PASO 2: Esperando aprobación de Garita
  if (estadoValidacion === 'en_revision_garita' && !esCuentaAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B132B', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#1E293B', padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#F59E0B' }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⏳</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 }}>
            Acreditación en Revisión por Garita
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 18, lineHeight: 19 }}>
            Tus documentos profesionales están siendo auditados por Garita Central (Línea {lineaAsignadaAdmin}).{'\n\n'}Una vez que el controlador te apruebe, podrás ingresar la patente de tu colectivo e iniciar recorrido.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#0284C7', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
            onPress={onVolver}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Volver al Menú</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // PASO 3: Conductor aprobado -> Consola operativa
  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

      <ScrollView contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>
        {/* CABECERA COMPACTA SIN DESBORDE HORIZONTAL */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' }} numberOfLines={1}>
              🚕 Conductor
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 10 }} numberOfLines={1}>
              Línea {rutaInput} • CONATACOCH
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <TouchableOpacity
              style={{
                position: 'relative',
                backgroundColor: '#1E293B',
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: alertasModeradas.length > 0 ? '#F59E0B' : '#334155',
              }}
              onPress={() => setModalCampanitaVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>🔔</Text>
              {alertasModeradas.length > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    backgroundColor: '#DC2626',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' }}>
                    {alertasModeradas.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {!modoEdicionTurno && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#1E293B',
                  borderWidth: 1,
                  borderColor: '#38BDF8',
                  paddingVertical: 7,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                }}
                onPress={() => setModoEdicionTurno(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold' }}>⚙️ Móvil</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: '#0F172A',
                borderWidth: 1,
                borderColor: '#475569',
                paddingVertical: 7,
                paddingHorizontal: 8,
                borderRadius: 8,
              }}
              onPress={onVolver}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' }}>🗺️ Mapa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {modoEdicionTurno ? (
          <View style={styles.tarjetaRegistroTurno}>
            <Text style={styles.tituloRegistroTurno}>📋 Asignación de Móvil y Ruta</Text>
            <Text style={styles.subtituloRegistroTurno}>
              ¡Acreditación confirmada! Ingresa la patente del colectivo que operarás y confirma el trayecto autorizado:
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {RUTAS_SELECCIONADAS.map((ruta) => {
                const seleccionada = folioSeleccionado === ruta.folio;
                return (
                  <TouchableOpacity
                    key={ruta.id}
                    style={{
                      backgroundColor: seleccionada ? '#0284C7' : '#0F172A',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      marginRight: 6,
                      borderWidth: 1,
                      borderColor: seleccionada ? '#38BDF8' : '#334155',
                    }}
                    onPress={() => handleSeleccionarRutaPreset(ruta)}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 }}>
                      {ruta.linea}
                    </Text>
                    <Text style={{ color: seleccionada ? '#E0F2FE' : '#94A3B8', fontSize: 9 }}>
                      {ruta.comunas}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Patente del Colectivo</Text>
              <TextInput
                style={styles.inputFormulario}
                placeholder="Ej: FP-55-12 / JJ-14-55"
                placeholderTextColor="#64748B"
                autoCapitalize="characters"
                value={patenteInput}
                onChangeText={setPatenteInput}
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Línea y Folio MTT</Text>
              <TextInput
                style={styles.inputFormulario}
                value={`Línea ${rutaInput} (Folio: ${folioSeleccionado})`}
                editable={false}
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Trayecto Asignado</Text>
              <TextInput
                style={styles.inputFormulario}
                value={trayectoInput}
                onChangeText={setTrayectoInput}
              />
            </View>

            <TouchableOpacity
              style={styles.botonIniciarTurno}
              onPress={handleGuardarTurno}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotonIniciarTurno}>CONFIRMAR MÓVIL Y SALIR A RUTA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {pagoMostrado && (
              <View
                style={{
                  backgroundColor: '#064E3B',
                  borderWidth: 1.5,
                  borderColor: '#10B981',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 26, marginRight: 10 }}>💵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#A7F3D0', fontWeight: 'bold', fontSize: 13 }}>
                    ¡PASAJE REGISTRADO!
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
                    Origen: <Text style={{ fontWeight: 'bold' }}>{pagoMostrado.pasajeroNombre}</Text>
                  </Text>
                  <Text style={{ color: '#6EE7B7', fontSize: 11 }}>
                    {ocultarDinero
                      ? `+$•••••• CLP • ${pagoMostrado.hora}`
                      : `+$${pagoMostrado.monto.toLocaleString('es-CL')} CLP • ${pagoMostrado.hora}`}
                  </Text>
                </View>
              </View>
            )}

            {primerReporte && (
              <View
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                  borderWidth: 1.5,
                  borderColor: primerReporte.titulo.includes('ALERTA') ? '#EF4444' : '#F59E0B',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#FCD34D', fontWeight: 'bold', fontSize: 13 }}>
                    📡 Novedad en Ruta (Autorizada por Garita)
                  </Text>
                  {alertasModeradas.length > 1 && (
                    <TouchableOpacity
                      onPress={() => setModalCampanitaVisible(true)}
                      style={{
                        backgroundColor: '#0F172A',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#38BDF8',
                      }}
                    >
                      <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold' }}>
                        +{alertasModeradas.length - 1} más 🔔
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View
                  style={{
                    backgroundColor: '#0F172A',
                    padding: 10,
                    borderRadius: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: '#F59E0B',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>
                    {primerReporte.titulo}
                  </Text>
                  <Text style={{ color: '#CBD5E1', fontSize: 11, marginVertical: 3 }}>
                    {primerReporte.descripcion}
                  </Text>
                  <Text style={{ color: '#38BDF8', fontSize: 10 }}>{primerReporte.origen}</Text>
                </View>
              </View>
            )}

            <View style={styles.tarjetaVehiculo}>
              <View style={styles.filaVehiculoTop}>
                <View style={styles.badgeLinea}>
                  <Text style={styles.textoBadgeLinea}>LÍNEA {rutaInput} • FOLIO {folioSeleccionado}</Text>
                </View>
                <Text style={styles.patenteGrande}>{patenteInput}</Text>
              </View>
              <Text style={styles.trayectoTexto}>{trayectoInput}</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={avisoControlGarita}
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor:
                    estadoActual === 'en_ruta'
                      ? '#064E3B'
                      : estadoActual === 'en_garita'
                      ? '#0C4A6E'
                      : '#7F1D1D',
                  borderWidth: 1.5,
                  borderColor:
                    estadoActual === 'en_ruta'
                      ? '#10B981'
                      : estadoActual === 'en_garita'
                      ? '#38BDF8'
                      : '#EF4444',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>
                    {estadoActual === 'en_ruta' ? '🚀' : estadoActual === 'en_garita' ? '🏢' : '🚫'}
                  </Text>
                  <View>
                    <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}>
                      ESTADO ASIGNADO POR GARITA
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
                      {estadoActual === 'en_ruta'
                        ? 'EN RUTA (OPERATIVO)'
                        : estadoActual === 'en_garita'
                        ? 'EN GARITA (ESPERANDO DESPACHO)'
                        : 'FUERA DE SERVICIO'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14 }}>🔒</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.seccionCupos}>
              <Text style={styles.tituloSeccion}>Asientos Disponibles en el Colectivo</Text>
              <Text style={styles.subtituloSeccion}>
                Presiona (−) para subir pasajero (+${tarifaPorPasaje}) o (+) para liberar cupo
              </Text>

              <View style={styles.contadorCuposCaja}>
                <TouchableOpacity
                  style={[styles.botonCupoCirculo, { borderColor: '#EF4444' }]}
                  onPress={restarCupo}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.signoCupo, { color: '#EF4444' }]}>−</Text>
                </TouchableOpacity>

                <View style={styles.pantallaNumeroCupos}>
                  <Text style={[styles.numeroCuposGrande, { color: getEstiloTextoCupos() }]}>
                    {cuposActuales}
                  </Text>
                  <Text style={[styles.textoEtiquetaCupos, { color: getEstiloTextoCupos() }]}>
                    {cuposActuales === 0 ? 'LLENO' : 'LIBRES'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.botonCupoCirculo, { borderColor: '#10B981' }]}
                  onPress={aumentarCupo}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.signoCupo, { color: '#10B981' }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filaResumenRapido}>
              <View style={styles.tarjetaMini}>
                <Text style={styles.labelMini}>Pasajeros Hoy</Text>
                <Text style={styles.valorMini}>{pasajerosPagados} pax</Text>
              </View>

              <View style={styles.tarjetaMini}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.labelMini}>Recaudación</Text>
                  <TouchableOpacity
                    onPress={() => setOcultarDinero(!ocultarDinero)}
                    style={{ paddingHorizontal: 4 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: 13 }}>{ocultarDinero ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.valorMini, { color: '#10B981' }]}>
                  {ocultarDinero
                    ? '••••••'
                    : `$${(pasajerosPagados * tarifaPorPasaje).toLocaleString('es-CL')}`}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <TouchableOpacity
                style={{
                  flex: 1.2,
                  backgroundColor: '#0284C7',
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={handleIniciarNuevoDia}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>
                  🌅 NUEVO DÍA (CERRAR)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#1E293B',
                  borderWidth: 1,
                  borderColor: '#475569',
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setModalHistorialVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#CBD5E1', fontWeight: 'bold', fontSize: 12 }}>
                  📜 HISTORIAL ({historialJornadas.length})
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#B45309',
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
                marginBottom: 12,
                borderWidth: 1.5,
                borderColor: '#F59E0B',
              }}
              onPress={() => setModalReporteVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                📢 REPORTAR NOVEDAD O DESVÍO A GARITA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonPanico} onPress={handleBotonPanico} activeOpacity={0.8}>
              <Text style={{ fontSize: 18 }}>🚨</Text>
              <Text style={styles.textoPanico}>BOTÓN DE ASISTENCIA / PÁNICO</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* MODAL HISTORIAL DE TURNOS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalHistorialVisible}
        onRequestClose={() => setModalHistorialVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 20, maxHeight: '80%', borderWidth: 1.5, borderColor: '#38BDF8' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>📜 Historial de Turnos</Text>
              <TouchableOpacity
                onPress={() => setOcultarDinero(!ocultarDinero)}
                style={{ backgroundColor: '#0F172A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#334155' }}
              >
                <Text style={{ fontSize: 12, color: '#38BDF8', fontWeight: 'bold' }}>
                  {ocultarDinero ? '👁️ Ver montos' : '🙈 Ocultar'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 16 }}>
              Móvil: {patenteInput || 'N/A'} • Chofer: {nombreConductor}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {historialJornadas.length === 0 ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
                    No hay turnos archivados aún.{'\n'}Al presionar "NUEVO DÍA", tu jornada cerrada quedará guardada aquí.
                  </Text>
                </View>
              ) : (
                historialJornadas.map((jornada) => (
                  <View
                    key={jornada.id}
                    style={{
                      backgroundColor: '#0F172A',
                      padding: 14,
                      borderRadius: 10,
                      marginBottom: 10,
                      borderLeftWidth: 4,
                      borderLeftColor: '#10B981',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 11 }}>{jornada.fecha}</Text>
                      <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold' }}>{jornada.patente}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#CBD5E1', fontSize: 13 }}>
                        Pasajeros: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{jornada.pasajerosTotales}</Text>
                      </Text>
                      <Text style={{ color: '#10B981', fontSize: 15, fontWeight: 'bold' }}>
                        {ocultarDinero
                          ? '$•••••• CLP'
                          : `$${jornada.recaudacionTotal.toLocaleString('es-CL')} CLP`}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={{ backgroundColor: '#334155', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 }}
              onPress={() => setModalHistorialVisible(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Cerrar Historial</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CAMPANITA */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCampanitaVisible}
        onRequestClose={() => setModalCampanitaVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 20, maxHeight: '80%', borderWidth: 1.5, borderColor: '#F59E0B' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
                🔔 Centro de Novedades ({alertasModeradas.length})
              </Text>
              <TouchableOpacity onPress={() => setModalCampanitaVisible(false)}>
                <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {alertasModeradas.length === 0 ? (
                <View style={{ paddingVertical: 35, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                  <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
                    No hay novedades viales activas.{'\n'}La ruta opera con normalidad.
                  </Text>
                </View>
              ) : (
                alertasModeradas.map((alerta) => (
                  <View
                    key={alerta.id}
                    style={{
                      backgroundColor: '#0F172A',
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 10,
                      borderLeftWidth: 4,
                      borderLeftColor: '#F59E0B',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{alerta.titulo}</Text>
                    <Text style={{ color: '#CBD5E1', fontSize: 12, marginVertical: 4 }}>{alerta.descripcion}</Text>
                    <Text style={{ color: '#38BDF8', fontSize: 10 }}>{alerta.origen} • {alerta.hora}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL REPORTE INCIDENTE */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalReporteVisible}
        onRequestClose={() => setModalReporteVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: '#F59E0B' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
              📢 Reportar Incidente a la Garita
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 14 }}>
              Móvil: {patenteInput || 'En Ruta'} • Chofer: {nombreConductor}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {['Accidente en la ruta', 'Congestión / Desvío', 'Falla mecánica', 'Incidente con pasajero', 'Control Policial / MTT'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={{
                    backgroundColor: tipoIncidente === item ? '#B45309' : '#0F172A',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    marginRight: 6,
                    borderWidth: 1,
                    borderColor: tipoIncidente === item ? '#F59E0B' : '#334155',
                  }}
                  onPress={() => setTipoIncidente(item)}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 8,
                padding: 10,
                color: '#FFFFFF',
                height: 80,
                textAlignVertical: 'top',
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#334155',
                fontSize: 13,
              }}
              placeholder="Describe desvío, colisión o congestión..."
              placeholderTextColor="#64748B"
              multiline
              value={detalleIncidente}
              onChangeText={setDetalleIncidente}
            />

            <TouchableOpacity
              style={{
                backgroundColor: '#B45309',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 8,
              }}
              onPress={enviarReporteConductor}
              disabled={enviandoReporte}
            >
              {enviandoReporte ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>TRANSMITIR A GARITA CENTRAL</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 8, alignItems: 'center' }}
              onPress={() => setModalReporteVisible(false)}
            >
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL RESERVAS ENTRANTE */}
      <Modal
        visible={!!solicitudEntrante}
        transparent
        animationType="slide"
        onRequestClose={() => responderSolicitud(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 22, borderWidth: 2, borderColor: '#38BDF8' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#38BDF8', textAlign: 'center', marginBottom: 8 }}>
              🔔 ¡Solicitud de Reserva!
            </Text>
            <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 16 }}>
              Al aceptar apartarás los asientos. El dinero entrará cuando el pasajero confirme su pago al abordar.
            </Text>

            <View style={{ backgroundColor: '#0F172A', borderRadius: 10, padding: 14, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#38BDF8' }}>
              <Text style={{ color: '#CBD5E1', fontSize: 14, marginBottom: 6 }}>
                Pasajero: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{solicitudEntrante?.pasajero_nombre}</Text>
              </Text>
              <Text style={{ color: '#CBD5E1', fontSize: 14, marginBottom: 6 }}>
                Asientos solicitados:{' '}
                <Text style={{ color: '#FCD34D', fontWeight: 'bold', fontSize: 16 }}>
                  {solicitudEntrante?.asientos_solicitados} cupo(s)
                </Text>
              </Text>
              <Text style={{ color: '#CBD5E1', fontSize: 14 }}>
                Monto a percibir:{' '}
                <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 16 }}>
                  ${solicitudEntrante?.monto_total.toLocaleString('es-CL')} CLP
                </Text>
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginRight: 8 }}
                onPress={() => responderSolicitud(false)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>Rechazar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#0284C7', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginLeft: 8 }}
                onPress={() => responderSolicitud(true)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>Apartar Asiento(s)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

