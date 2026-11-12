import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { supabase } from '../services/supabase';
import { garitaStyles as styles } from '../styles/garitaStyles';
import { RUTAS_SELECCIONADAS, RutaOficial } from '../data/rutasOficiales';

interface GaritaScreenProps {
  onVolver: () => void;
}

interface DatosTurnoGarita {
  nombreGarita: string;
  linea: string;
  folio: string;
  trayecto: string;
  operador: string;
  turno: 'Mañana (06:00 - 14:00)' | 'Tarde (14:00 - 22:00)' | 'Noche (22:00 - 06:00)';
}

export interface ReporteGremial {
  id: string;
  tipo: 'pasajero_a_conductor' | 'conductor_a_garita' | 'operacional';
  origen: string;
  patenteAfectada?: string;
  lineaAfectada?: string;
  titulo: string;
  descripcion: string;
  hora: string;
  estado: 'Pendiente' | 'Revisado' | 'Resuelto';
  difundirAFlota?: boolean;
}

export interface ConductorEnMonitoreo {
  patente: string;
  nombre: string;
  vueltasHoy: number;
  pasajerosTrasladados: number;
  recaudacionTotal: number;
  estado: 'en_ruta' | 'en_garita' | 'fuera_servicio';
  ultimaSalida: string;
  folioLinea?: string;
}

export interface DocumentacionConductor {
  patente: string;
  conductor_nombre: string;
  conductor_rut: string;
  clase_licencia: string;
  vencimiento_licencia: string;
  vencimiento_revision_tecnica: string;
  vencimiento_soap: string;
  vencimiento_permiso_circulacion: string;
  carton_recorrido_mtt_al_dia: boolean;
  estado_documental: 'al_dia' | 'por_vencer' | 'vencido';
  estado_validacion?: 'pendiente_subida' | 'en_revision_garita' | 'aprobado';
  folio_linea?: string;
  usuario_id?: string;
}

interface DatosAlertaPanico {
  patente: string;
  conductor: string;
  linea: string;
  hora: string;
  mensaje: string;
}

export default function GaritaScreen({ onVolver }: GaritaScreenProps) {
  const rutaInicial = RUTAS_SELECCIONADAS[0];

  const [datosGarita, setDatosGarita] = useState<DatosTurnoGarita>({
    nombreGarita: `Garita ${rutaInicial.linea} (Terminal ${rutaInicial.callesIda[0].calle.split(' ')[0]})`,
    linea: rutaInicial.linea.replace('Línea ', ''),
    folio: rutaInicial.folio,
    trayecto: `${rutaInicial.callesIda[0].calle} ⇄ ${rutaInicial.callesRegreso[0].calle}`,
    operador: 'Controlador Central',
    turno: 'Tarde (14:00 - 22:00)',
  });

  const [modoConfigurarGarita, setModoConfigurarGarita] = useState<boolean>(false);

  const [rutaSeleccionadaModal, setRutaSeleccionadaModal] = useState<RutaOficial>(rutaInicial);
  const [inputNombreGarita, setInputNombreGarita] = useState(datosGarita.nombreGarita);
  const [inputOperador, setInputOperador] = useState(datosGarita.operador);
  const [inputTurno, setInputTurno] = useState(datosGarita.turno);

  const [tabActiva, setTabActiva] = useState<'flota' | 'pasajeros' | 'reportes' | 'documentos'>('flota');
  const [alertaPanicoActiva, setAlertaPanicoActiva] = useState<DatosAlertaPanico | null>(null);

  const [conductores, setConductores] = useState<ConductorEnMonitoreo[]>([
    {
      patente: 'GH-89-21',
      nombre: 'Patricio Fuentes C.',
      vueltasHoy: 5,
      pasajerosTrasladados: 42,
      recaudacionTotal: 42000,
      estado: 'en_ruta',
      ultimaSalida: '18:15 hrs',
      folioLinea: '236023',
    },
    {
      patente: 'FP-55-12',
      nombre: 'Rodrigo Morales V.',
      vueltasHoy: 6,
      pasajerosTrasladados: 51,
      recaudacionTotal: 51000,
      estado: 'en_ruta',
      ultimaSalida: '18:25 hrs',
      folioLinea: '236023',
    },
    {
      patente: 'JJ-14-55',
      nombre: 'Carlos Santander L.',
      vueltasHoy: 4,
      pasajerosTrasladados: 33,
      recaudacionTotal: 33000,
      estado: 'en_garita',
      ultimaSalida: 'Esperando despacho',
      folioLinea: '236023',
    },
    {
      patente: 'LK-90-44',
      nombre: 'Marcelo Gómez P.',
      vueltasHoy: 3,
      pasajerosTrasladados: 24,
      recaudacionTotal: 24000,
      estado: 'fuera_servicio',
      ultimaSalida: 'Taller / Colación',
      folioLinea: '236023',
    },
  ]);

  const [reportes, setReportes] = useState<ReporteGremial[]>([]);
  const [documentosFlota, setDocumentosFlota] = useState<DocumentacionConductor[]>([]);

  const [modalEditarDoc, setModalEditarDoc] = useState<boolean>(false);
  const [docSeleccionado, setDocSeleccionado] = useState<DocumentacionConductor | null>(null);
  const [editLicencia, setEditLicencia] = useState<string>('');
  const [editRevision, setEditRevision] = useState<string>('');
  const [editSoap, setEditSoap] = useState<string>('');
  const [editPermiso, setEditPermiso] = useState<string>('');

  const [modalNuevoReporte, setModalNuevoReporte] = useState<boolean>(false);
  const [nuevoTipo, setNuevoTipo] = useState<'pasajero_a_conductor' | 'conductor_a_garita'>('conductor_a_garita');
  const [nuevoOrigen, setNuevoOrigen] = useState<string>('');
  const [nuevaPatente, setNuevaPatente] = useState<string>('');
  const [nuevoTitulo, setNuevoTitulo] = useState<string>('');
  const [nuevaDesc, setNuevaDesc] = useState<string>('');

  const cargarReportesDesdeBD = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .or(`linea_id.eq.${datosGarita.linea},linea_id.eq.${datosGarita.folio}`)
        .order('creado_en', { ascending: false });

      if (!error && data) {
        const formateados: ReporteGremial[] = data.map((d: any) => ({
          id: d.id,
          tipo: d.tipo_autor === 'pasajero' ? 'pasajero_a_conductor' : 'conductor_a_garita',
          origen: `${d.tipo_autor === 'pasajero' ? 'Pasajero' : 'Conductor'} registrado`,
          patenteAfectada: d.patente_colectivo || undefined,
          lineaAfectada: d.linea_id,
          titulo: d.tipo_reporte,
          descripcion: d.descripcion,
          hora: new Date(d.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
          estado: d.estado === 'resuelto' ? 'Resuelto' : d.estado === 'en_revision' ? 'Revisado' : 'Pendiente',
          difundirAFlota: d.difundir_a_flota ?? false,
        }));
        setReportes(formateados);
      } else {
        setReportes([]);
      }
    } catch (e) {
      console.log('Error cargando reportes BD:', e);
    }
  }, [datosGarita.linea, datosGarita.folio]);

  const cargarPapelesDesdeBD = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('documentacion_conductores')
        .select('*')
        .or(`folio_linea.eq.${datosGarita.linea},folio_linea.eq.${datosGarita.folio}`);

      if (!error && data) {
        setDocumentosFlota(data);
      } else {
        setDocumentosFlota([]);
      }
    } catch (e) {
      console.log('Error cargando papeles exclusivos:', e);
    }
  }, [datosGarita.linea, datosGarita.folio]);

  useEffect(() => {
    cargarReportesDesdeBD();
    cargarPapelesDesdeBD();
  }, [cargarReportesDesdeBD, cargarPapelesDesdeBD]);

  useEffect(() => {
    const canalFlota = supabase
      .channel('flota-operacional-global')
      .on(
        'broadcast',
        { event: 'cambio_estado_movil' },
        (payload: { payload: { patente: string; nuevoEstado: 'en_ruta' | 'en_garita' | 'fuera_servicio' } }) => {
          const { patente, nuevoEstado } = payload.payload;
          setConductores((prev) =>
            prev.map((c) => (c.patente === patente ? { ...c, estado: nuevoEstado } : c))
          );
        }
      )
      .on(
        'broadcast',
        { event: 'alerta_panico' },
        (payload: { payload: DatosAlertaPanico }) => {
          const datos = payload.payload;
          if (datos.linea === datosGarita.linea || datos.linea === datosGarita.folio) {
            setAlertaPanicoActiva(datos);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'nuevo_conductor_documentos_pendientes' },
        (payload: { payload: { documento: DocumentacionConductor } }) => {
          const nuevoDoc = payload.payload?.documento;
          if (!nuevoDoc) return;

          const pertenece =
            nuevoDoc.folio_linea === datosGarita.linea || nuevoDoc.folio_linea === datosGarita.folio;

          if (pertenece) {
            setDocumentosFlota((prev) => {
              const existe = prev.some((d) => d.usuario_id === nuevoDoc.usuario_id || d.patente === nuevoDoc.patente);
              if (existe) {
                return prev.map((d) =>
                  d.usuario_id === nuevoDoc.usuario_id || d.patente === nuevoDoc.patente ? nuevoDoc : d
                );
              }
              return [nuevoDoc, ...prev];
            });

            Alert.alert(
              '📄 Nuevo Chofer en tu Garita',
              `El chofer ${nuevoDoc.conductor_nombre} ha subido sus papeles para la Línea ${datosGarita.linea}.`
            );
          }
        }
      )
      .on(
        'broadcast',
        { event: 'nuevo_reporte_escrito' },
        (payload: { payload: ReporteGremial }) => {
          const rep = payload.payload;
          if (!rep) return;

          const perteneceALinea =
            !rep.lineaAfectada ||
            rep.lineaAfectada === datosGarita.linea ||
            rep.lineaAfectada === datosGarita.folio;

          if (perteneceALinea) {
            setReportes((prev) => [rep, ...prev]);

            Alert.alert(
              '⚠️ Novedad en tu Línea',
              `Línea ${datosGarita.linea}\nOrigen: ${rep.origen}\nAsunto: ${rep.titulo}\nDetalle: ${rep.descripcion}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalFlota);
    };
  }, [datosGarita.linea, datosGarita.folio]);

  const guardarRegistroGarita = () => {
    const numLinea = rutaSeleccionadaModal.linea.replace('Línea ', '');
    const folioMTT = rutaSeleccionadaModal.folio;
    const trayecto = `${rutaSeleccionadaModal.callesIda[0].calle} ⇄ ${rutaSeleccionadaModal.callesRegreso[0].calle}`;

    setDatosGarita({
      nombreGarita: inputNombreGarita,
      linea: numLinea,
      folio: folioMTT,
      trayecto,
      operador: inputOperador,
      turno: inputTurno,
    });

    setModoConfigurarGarita(false);

    Alert.alert(
      '🏢 Control Exclusivo Asignado',
      `Esta Garita ha asumido el control de la:\n\n• ${rutaSeleccionadaModal.linea} (Folio ${folioMTT})\n• Comunas: ${rutaSeleccionadaModal.comunas}\n• Trayecto: ${trayecto}\n\nLos reportes, papeles y móviles ahora son exclusivamente de esta línea.`
    );
  };

  const cambiarEstadoDesdeGarita = async (
    patente: string,
    nuevoEstado: 'en_ruta' | 'en_garita' | 'fuera_servicio'
  ) => {
    setConductores((prev) =>
      prev.map((c) => {
        if (c.patente === patente) {
          const nuevaSalida =
            nuevoEstado === 'en_ruta'
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs'
              : c.ultimaSalida;
          return {
            ...c,
            estado: nuevoEstado,
            vueltasHoy: nuevoEstado === 'en_ruta' && c.estado === 'en_garita' ? c.vueltasHoy + 1 : c.vueltasHoy,
            ultimaSalida: nuevaSalida,
          };
        }
        return c;
      })
    );

    try {
      const canalFlota = supabase.channel('flota-operacional-global');
      await canalFlota.send({
        type: 'broadcast',
        event: 'cambio_estado_movil',
        payload: { patente, nuevoEstado },
      });
    } catch (e) {
      console.log('Error notificando cambio de estado:', e);
    }
  };

  const abrirEdicionDocumentos = (doc: DocumentacionConductor) => {
    setDocSeleccionado(doc);
    setEditLicencia(doc.vencimiento_licencia);
    setEditRevision(doc.vencimiento_revision_tecnica);
    setEditSoap(doc.vencimiento_soap);
    setEditPermiso(doc.vencimiento_permiso_circulacion);
    setModalEditarDoc(true);
  };

  const guardarActualizacionDocumental = async () => {
    if (!docSeleccionado) return;

    const docActualizado: DocumentacionConductor = {
      ...docSeleccionado,
      vencimiento_licencia: editLicencia.trim(),
      vencimiento_revision_tecnica: editRevision.trim(),
      vencimiento_soap: editSoap.trim(),
      vencimiento_permiso_circulacion: editPermiso.trim(),
      estado_documental: 'al_dia',
      estado_validacion: 'aprobado',
    };

    setDocumentosFlota((prev) =>
      prev.map((d) => (d.patente === docSeleccionado.patente ? docActualizado : d))
    );

    try {
      await supabase
        .from('documentacion_conductores')
        .update({
          vencimiento_licencia: editLicencia.trim(),
          vencimiento_revision_tecnica: editRevision.trim(),
          vencimiento_soap: editSoap.trim(),
          vencimiento_permiso_circulacion: editPermiso.trim(),
          estado_documental: 'al_dia',
          estado_validacion: 'aprobado',
        })
        .eq('patente', docSeleccionado.patente);
    } catch (e) {
      console.log('Error guardando papeles en BD:', e);
    }

    setModalEditarDoc(false);
    Alert.alert('✅ Papeles Actualizados', `La documentación del móvil ${docSeleccionado.patente} ha quedado regularizada.`);
  };

  const aprobarConductorNuevo = async (doc: DocumentacionConductor) => {
    setDocumentosFlota((prev) =>
      prev.map((d) =>
        d.usuario_id === doc.usuario_id || d.patente === doc.patente
          ? { ...d, estado_validacion: 'aprobado', estado_documental: 'al_dia' }
          : d
      )
    );

    try {
      if (doc.usuario_id) {
        await supabase
          .from('documentacion_conductores')
          .update({ estado_validacion: 'aprobado', estado_documental: 'al_dia' })
          .eq('usuario_id', doc.usuario_id);
      }

      const canalFlota = supabase.channel('flota-operacional-global');
      await canalFlota.send({
        type: 'broadcast',
        event: 'conductor_aprobado_garita',
        payload: { usuarioId: doc.usuario_id, patente: doc.patente },
      });

      Alert.alert(
        '✅ Conductor Acreditado',
        `El chofer ${doc.conductor_nombre} ha sido habilitado para operar en la Línea ${datosGarita.linea}.`
      );
    } catch (e) {
      console.log('Error aprobando:', e);
    }
  };

  const alternarDifusionReporte = async (reporte: ReporteGremial) => {
    const nuevoValor = !reporte.difundirAFlota;
    const reportesActualizados = reportes.map((r) =>
      r.id === reporte.id ? { ...r, difundirAFlota: nuevoValor } : r
    );
    setReportes(reportesActualizados);

    try {
      const canalFlota = supabase.channel('flota-operacional-global');
      await canalFlota.send({
        type: 'broadcast',
        event: 'actualizar_alertas_conductores',
        payload: { reportesAprobados: reportesActualizados.filter((r) => r.difundirAFlota) },
      });
    } catch (e) {
      console.log('Error difusión:', e);
    }
  };

  const cambiarEstadoReporte = async (id: string, nuevoEstado: 'Revisado' | 'Resuelto') => {
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r))
    );

    try {
      await supabase
        .from('reportes')
        .update({ estado: nuevoEstado === 'Resuelto' ? 'resuelto' : 'en_revision' })
        .eq('id', id);
    } catch (e) {
      console.log('Error actualizando estado reporte en BD:', e);
    }
  };

  const handleCrearReporte = async () => {
    if (!nuevoTitulo.trim() || !nuevaDesc.trim() || !nuevoOrigen.trim()) {
      Alert.alert('Campos Incompletos', 'Completa el título, detalle y emisor.');
      return;
    }

    const nuevoItem: ReporteGremial = {
      id: Date.now().toString(),
      tipo: nuevoTipo,
      origen: nuevoOrigen.trim(),
      patenteAfectada: nuevaPatente.trim().toUpperCase() || undefined,
      lineaAfectada: datosGarita.linea,
      titulo: nuevoTitulo.trim(),
      descripcion: nuevaDesc.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
      estado: 'Pendiente',
      difundirAFlota: false,
    };

    setReportes([nuevoItem, ...reportes]);
    setModalNuevoReporte(false);
    setNuevoOrigen('');
    setNuevaPatente('');
    setNuevoTitulo('');
    setNuevaDesc('');

    try {
      await supabase.from('reportes').insert({
        tipo_autor: nuevoTipo === 'pasajero_a_conductor' ? 'pasajero' : 'conductor',
        linea_id: datosGarita.linea,
        patente_colectivo: nuevaPatente.trim().toUpperCase() || null,
        tipo_reporte: nuevoTitulo.trim(),
        descripcion: nuevaDesc.trim(),
        estado: 'pendiente',
        difundir_a_flota: false,
      });
    } catch (e) {
      console.log('Error guardando reporte nuevo:', e);
    }

    Alert.alert('Reporte Ingresado', `Se ha añadido al Libro de Novedades de la Línea ${datosGarita.linea}.`);
  };

  const conductoresLineaActiva = conductores.filter(
    (c) => !c.folioLinea || c.folioLinea === datosGarita.folio || c.folioLinea === datosGarita.linea
  );

  const totalPasajerosTurno = conductoresLineaActiva.reduce((acc, c) => acc + c.pasajerosTrasladados, 0);
  const totalRecaudacionTurno = conductoresLineaActiva.reduce((acc, c) => acc + c.recaudacionTotal, 0);
  const autosEnRuta = conductoresLineaActiva.filter((c) => c.estado === 'en_ruta').length;
  const papelesAlDia = documentosFlota.filter((d) => d.estado_documental === 'al_dia').length;

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

      <ScrollView contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>
        {/* CABECERA COMPACTA SIN DESBORDE */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }} numberOfLines={1}>
              🏢 Central de Garita
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 11 }} numberOfLines={1}>
              Línea {datosGarita.linea} ({datosGarita.folio})
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#1E293B',
                borderWidth: 1,
                borderColor: '#38BDF8',
                paddingVertical: 7,
                paddingHorizontal: 9,
                borderRadius: 8,
              }}
              onPress={() => {
                const rutaEncontrada =
                  RUTAS_SELECCIONADAS.find((r) => r.folio === datosGarita.folio) || RUTAS_SELECCIONADAS[0];
                setRutaSeleccionadaModal(rutaEncontrada);
                setInputNombreGarita(datosGarita.nombreGarita);
                setInputOperador(datosGarita.operador);
                setInputTurno(datosGarita.turno);
                setModoConfigurarGarita(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold' }}>📍 Ruta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#0F172A',
                borderWidth: 1,
                borderColor: '#475569',
                paddingVertical: 7,
                paddingHorizontal: 9,
                borderRadius: 8,
              }}
              onPress={onVolver}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' }}>🗺️ Mapa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner de Control Exclusivo */}
        <View style={styles.bannerInfoGarita}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={{ backgroundColor: '#0284C7', color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 }}>
                CONTROL EXCLUSIVO
              </Text>
              <Text style={styles.nombreTerminal} numberOfLines={1}>
                {datosGarita.nombreGarita}
              </Text>
            </View>
            <Text style={styles.detalleTerminal}>
              Ruta: {datosGarita.trayecto}
            </Text>
            <Text style={[styles.detalleTerminal, { color: '#38BDF8', marginTop: 2 }]}>
              Turno: {datosGarita.turno} • Operador: {datosGarita.operador}
            </Text>
          </View>
        </View>

        {/* Pestañas de Navegación */}
        <View style={styles.contenedorPestanas}>
          <TouchableOpacity
            style={[styles.tabBtn, tabActiva === 'flota' && styles.tabBtnActivo]}
            onPress={() => setTabActiva('flota')}
          >
            <Text style={[styles.textoTab, tabActiva === 'flota' && styles.textoTabActivo]}>
              🚕 Flota ({conductoresLineaActiva.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tabActiva === 'pasajeros' && styles.tabBtnActivo]}
            onPress={() => setTabActiva('pasajeros')}
          >
            <Text style={[styles.textoTab, tabActiva === 'pasajeros' && styles.textoTabActivo]}>
              👥 Pasajeros
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tabActiva === 'reportes' && styles.tabBtnActivo]}
            onPress={() => setTabActiva('reportes')}
          >
            <Text style={[styles.textoTab, tabActiva === 'reportes' && styles.textoTabActivo]}>
              ⚠️ Reportes ({reportes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tabActiva === 'documentos' && styles.tabBtnActivo]}
            onPress={() => setTabActiva('documentos')}
          >
            <Text style={[styles.textoTab, tabActiva === 'documentos' && styles.textoTabActivo]}>
              📋 Papeles ({papelesAlDia}/{documentosFlota.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Métricas Rápidas */}
        <View style={styles.filaMetricas}>
          <View style={styles.tarjetaMetrica}>
            <Text style={styles.labelMetrica}>En Tránsito</Text>
            <Text style={[styles.valorMetrica, { color: '#38BDF8' }]}>
              {autosEnRuta} / {conductoresLineaActiva.length}
            </Text>
          </View>

          <View style={styles.tarjetaMetrica}>
            <Text style={styles.labelMetrica}>Pasajeros Hoy</Text>
            <Text style={[styles.valorMetrica, { color: '#4ADE80' }]}>
              {totalPasajerosTurno} pax
            </Text>
          </View>

          <View style={styles.tarjetaMetrica}>
            <Text style={styles.labelMetrica}>Recaudación</Text>
            <Text style={[styles.valorMetrica, { color: '#FACC15' }]}>
              ${(totalRecaudacionTurno / 1000).toFixed(0)}k
            </Text>
          </View>
        </View>

        {/* PESTAÑA 1: FLOTA */}
        {tabActiva === 'flota' && (
          <View>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
              DESPACHO OPERACIONAL • LÍNEA {datosGarita.linea}
            </Text>
            {conductoresLineaActiva.map((item) => (
              <View key={item.patente} style={styles.tarjetaItem}>
                <View style={styles.filaItemTop}>
                  <View style={styles.patenteBadge}>
                    <Text style={styles.textoPatente}>{item.patente}</Text>
                  </View>
                  <View
                    style={
                      item.estado === 'en_ruta'
                        ? styles.tagEstadoEnRuta
                        : item.estado === 'en_garita'
                        ? styles.tagEstadoGarita
                        : styles.tagEstadoFuera
                    }
                  >
                    <Text style={styles.textoTagEstado}>
                      {item.estado === 'en_ruta'
                        ? 'EN RUTA'
                        : item.estado === 'en_garita'
                        ? 'EN GARITA'
                        : 'FUERA DE SERV.'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.nombreConductorItem}>{item.nombre}</Text>

                <View style={styles.filaDetallesMóvil}>
                  <Text style={styles.textoDetalleMóvil}>
                    Vueltas: <Text style={{ color: '#F8FAFC', fontWeight: 'bold' }}>{item.vueltasHoy}</Text>
                  </Text>
                  <Text style={styles.textoDetalleMóvil}>
                    Última Salida: <Text style={{ color: '#F8FAFC', fontWeight: 'bold' }}>{item.ultimaSalida}</Text>
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: item.estado === 'en_ruta' ? '#10B981' : '#0F172A',
                      paddingVertical: 7,
                      borderRadius: 6,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: item.estado === 'en_ruta' ? '#10B981' : '#334155',
                    }}
                    onPress={() => cambiarEstadoDesdeGarita(item.patente, 'en_ruta')}
                  >
                    <Text style={{ color: item.estado === 'en_ruta' ? '#FFFFFF' : '#94A3B8', fontWeight: 'bold', fontSize: 11 }}>
                      🚀 Despachar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: item.estado === 'en_garita' ? '#0284C7' : '#0F172A',
                      paddingVertical: 7,
                      borderRadius: 6,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: item.estado === 'en_garita' ? '#0284C7' : '#334155',
                    }}
                    onPress={() => cambiarEstadoDesdeGarita(item.patente, 'en_garita')}
                  >
                    <Text style={{ color: item.estado === 'en_garita' ? '#FFFFFF' : '#94A3B8', fontWeight: 'bold', fontSize: 11 }}>
                      🏢 En Garita
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: item.estado === 'fuera_servicio' ? '#DC2626' : '#0F172A',
                      paddingVertical: 7,
                      borderRadius: 6,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: item.estado === 'fuera_servicio' ? '#DC2626' : '#334155',
                    }}
                    onPress={() => cambiarEstadoDesdeGarita(item.patente, 'fuera_servicio')}
                  >
                    <Text style={{ color: item.estado === 'fuera_servicio' ? '#FFFFFF' : '#94A3B8', fontWeight: 'bold', fontSize: 11 }}>
                      🚫 Fuera Serv.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PESTAÑA 2: PASAJEROS */}
        {tabActiva === 'pasajeros' && (
          <View>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
              RECAUDACIÓN DE PASAJES • LÍNEA {datosGarita.linea}
            </Text>
            {conductoresLineaActiva.map((c) => (
              <View key={c.patente} style={styles.tarjetaItem}>
                <View style={styles.filaItemTop}>
                  <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 }}>{c.nombre}</Text>
                  <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 13 }}>{c.patente}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <View>
                    <Text style={{ color: '#94A3B8', fontSize: 11 }}>Pasajeros a Bordo:</Text>
                    <Text style={{ color: '#4ADE80', fontSize: 16, fontWeight: 'bold' }}>
                      {c.pasajerosTrasladados} personas
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11 }}>Total Recaudado:</Text>
                    <Text style={{ color: '#FACC15', fontSize: 16, fontWeight: 'bold' }}>
                      ${c.recaudacionTotal.toLocaleString('es-CL')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PESTAÑA 3: REPORTES */}
        {tabActiva === 'reportes' && (
          <View>
            <TouchableOpacity
              style={styles.botonNuevoReporte}
              onPress={() => setModalNuevoReporte(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotonNuevoReporte}>✍️ REGISTRAR NUEVA NOVEDAD O RECLAMO</Text>
            </TouchableOpacity>

            {reportes.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
                  No hay reportes ni reclamos activos para la Línea {datosGarita.linea}.{'\n'}La ruta opera con normalidad.
                </Text>
              </View>
            ) : (
              reportes.map((rep) => (
                <View key={rep.id} style={styles.tarjetaReporte}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View
                      style={[
                        styles.badgeTipoReporte,
                        rep.tipo === 'pasajero_a_conductor'
                          ? styles.badgeReportePasajero
                          : styles.badgeReporteConductor,
                      ]}
                    >
                      <Text style={styles.textoBadgeReporte}>
                        {rep.tipo === 'pasajero_a_conductor' ? 'RECLAMO DE PASAJERO' : 'REPORTE DE CONDUCTOR'}
                      </Text>
                    </View>

                    {rep.difundirAFlota ? (
                      <View style={{ backgroundColor: '#065F46', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#10B981' }}>
                        <Text style={{ color: '#A7F3D0', fontSize: 10, fontWeight: 'bold' }}>📢 DIFUNDIDO A COLEGAS</Text>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#475569' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 10 }}>🔒 SOLO GARITA</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.tituloReporte}>{rep.titulo}</Text>
                  {rep.patenteAfectada && (
                    <Text style={{ color: '#FACC15', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                      Móvil: {rep.patenteAfectada}
                    </Text>
                  )}
                  <Text style={styles.descripcionReporte}>{rep.descripcion}</Text>

                  <View style={styles.footerReporte}>
                    <Text style={styles.autorReporte}>{rep.origen}</Text>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: rep.estado === 'Resuelto' ? '#10B981' : rep.estado === 'Revisado' ? '#38BDF8' : '#F59E0B' }}>
                      {rep.hora} • {rep.estado.toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: rep.difundirAFlota ? '#7F1D1D' : '#047857',
                        paddingVertical: 7,
                        borderRadius: 6,
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                      onPress={() => alternarDifusionReporte(rep)}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 }}>
                        {rep.difundirAFlota
                          ? '🔇 OCULTAR DE CAMPANITA DE CONDUCTORES'
                          : '📢 APROBAR Y DIFUNDIR A CAMPANITA DE CONDUCTORES'}
                      </Text>
                    </TouchableOpacity>

                    {rep.estado !== 'Resuelto' && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        {rep.estado === 'Pendiente' && (
                          <TouchableOpacity
                            style={{ flex: 1, backgroundColor: '#0369A1', paddingVertical: 6, borderRadius: 4, alignItems: 'center' }}
                            onPress={() => cambiarEstadoReporte(rep.id, 'Revisado')}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>Marcar Revisado</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: '#059669', paddingVertical: 6, borderRadius: 4, alignItems: 'center' }}
                          onPress={() => cambiarEstadoReporte(rep.id, 'Resuelto')}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>Resolver</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* PESTAÑA 4: FISCALIZACIÓN DOCUMENTAL */}
        {tabActiva === 'documentos' && (
          <View>
            <View style={{ backgroundColor: '#0F172A', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>
                🔒 FISCALIZACIÓN EXCLUSIVA • LÍNEA {datosGarita.linea}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                Esta garita administra exclusivamente los choferes y móviles inscritos bajo el Folio {datosGarita.folio}.
              </Text>
            </View>

            {documentosFlota.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 30, marginBottom: 8 }}>📋</Text>
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
                  No hay conductores registrados para la Línea {datosGarita.linea}.{'\n'}Cuando un chofer suba sus papeles para esta garita, aparecerá aquí.
                </Text>
              </View>
            ) : (
              documentosFlota.map((doc) => {
                const esAlDia = doc.estado_documental === 'al_dia';
                const esVencido = doc.estado_documental === 'vencido';
                const pendienteRevision = doc.estado_validacion === 'en_revision_garita';

                return (
                  <View
                    key={doc.patente}
                    style={[
                      styles.tarjetaItem,
                      {
                        borderLeftWidth: 5,
                        borderLeftColor: pendienteRevision
                          ? '#38BDF8'
                          : esAlDia
                          ? '#10B981'
                          : esVencido
                          ? '#EF4444'
                          : '#F59E0B',
                      },
                    ]}
                  >
                    <View style={styles.filaItemTop}>
                      <View>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                          {doc.conductor_nombre}
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                          RUT: {doc.conductor_rut} • Patente: <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>{doc.patente}</Text>
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: pendienteRevision
                            ? '#0C4A6E'
                            : esAlDia
                            ? '#065F46'
                            : esVencido
                            ? '#7F1D1D'
                            : '#78350F',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: pendienteRevision
                            ? '#38BDF8'
                            : esAlDia
                            ? '#10B981'
                            : esVencido
                            ? '#EF4444'
                            : '#F59E0B',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 10 }}>
                          {pendienteRevision
                            ? '⏳ PENDIENTE'
                            : esAlDia
                            ? '✅ AL DÍA'
                            : esVencido
                            ? '🚫 VENCIDO'
                            : '⚠️ POR RENOVAR'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#0F172A', padding: 10, borderRadius: 8, marginTop: 10 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, marginBottom: 2 }}>
                        • Licencia: <Text style={{ fontWeight: 'bold' }}>{doc.clase_licencia} ({doc.vencimiento_licencia})</Text>
                      </Text>
                      <Text style={{ color: esVencido ? '#EF4444' : '#FFFFFF', fontSize: 11, marginBottom: 2 }}>
                        • Revisión Técnica: <Text style={{ fontWeight: 'bold' }}>{doc.vencimiento_revision_tecnica}</Text>
                      </Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, marginBottom: 2 }}>
                        • SOAP: <Text style={{ fontWeight: 'bold' }}>{doc.vencimiento_soap}</Text>
                      </Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 11 }}>
                        • Permiso: <Text style={{ fontWeight: 'bold' }}>{doc.vencimiento_permiso_circulacion}</Text>
                      </Text>
                    </View>

                    {pendienteRevision && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#10B981',
                          paddingVertical: 10,
                          borderRadius: 6,
                          alignItems: 'center',
                          marginTop: 8,
                        }}
                        onPress={() => aprobarConductorNuevo(doc)}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>
                          ✅ APROBAR CHOFER PARA ESTA LÍNEA
                        </Text>
                      </TouchableOpacity>
                    )}

                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: '#0284C7',
                          paddingVertical: 8,
                          borderRadius: 6,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: '#38BDF8',
                        }}
                        onPress={() => abrirEdicionDocumentos(doc)}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 }}>
                          📝 ACTUALIZAR PAPELES / FECHAS
                        </Text>
                      </TouchableOpacity>

                      {esVencido && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#DC2626',
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderRadius: 6,
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            cambiarEstadoDesdeGarita(doc.patente, 'fuera_servicio');
                            Alert.alert('Móvil Bloqueado', `El móvil ${doc.patente} ha sido puesto fuera de servicio por papeles vencidos.`);
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 }}>
                            ⛔ BLOQUEAR
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL EDITAR DOCUMENTOS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalEditarDoc}
        onRequestClose={() => setModalEditarDoc(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
          <View style={styles.tarjetaRegistroGarita}>
            <Text style={styles.tituloRegistro}>📋 Actualizar Documentación</Text>
            <Text style={styles.subtituloRegistro}>
              Móvil: <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>{docSeleccionado?.patente}</Text> • {docSeleccionado?.conductor_nombre}
            </Text>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Vencimiento Licencia de Conducir</Text>
              <TextInput
                style={styles.inputFormulario}
                value={editLicencia}
                onChangeText={setEditLicencia}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Vencimiento Revisión Técnica</Text>
              <TextInput
                style={styles.inputFormulario}
                value={editRevision}
                onChangeText={setEditRevision}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Vencimiento Seguro Obligatorio (SOAP)</Text>
              <TextInput
                style={styles.inputFormulario}
                value={editSoap}
                onChangeText={setEditSoap}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Vencimiento Permiso de Circulación</Text>
              <TextInput
                style={styles.inputFormulario}
                value={editPermiso}
                onChangeText={setEditPermiso}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#64748B"
              />
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
              onPress={guardarActualizacionDocumental}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                GUARDAR Y MARCAR PAPELES AL DÍA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 12, alignItems: 'center', marginTop: 4 }}
              onPress={() => setModalEditarDoc(false)}
            >
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIGURACIÓN DE GARITA */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modoConfigurarGarita}
        onRequestClose={() => setModoConfigurarGarita(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 }}>
          <View style={styles.tarjetaRegistroGarita}>
            <Text style={styles.tituloRegistro}>🏢 Ubicación de Garita y Control de Ruta</Text>
            <Text style={styles.subtituloRegistro}>
              Selecciona la ruta oficial sobre la cual esta Garita ejercerá el control exclusivo:
            </Text>

            <Text style={[styles.labelFormulario, { marginBottom: 6 }]}>Ruta Oficial Autorizada por el MTT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {RUTAS_SELECCIONADAS.map((ruta) => {
                const seleccionada = rutaSeleccionadaModal.folio === ruta.folio;
                return (
                  <TouchableOpacity
                    key={ruta.id}
                    style={{
                      backgroundColor: seleccionada ? '#0284C7' : '#0F172A',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 8,
                      marginRight: 8,
                      borderWidth: 1.5,
                      borderColor: seleccionada ? '#38BDF8' : '#334155',
                      minWidth: 120,
                    }}
                    onPress={() => {
                      setRutaSeleccionadaModal(ruta);
                      setInputNombreGarita(`Garita ${ruta.linea} (Terminal ${ruta.callesIda[0].calle.split(' ')[0]})`);
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                      {ruta.linea}
                    </Text>
                    <Text style={{ color: seleccionada ? '#E0F2FE' : '#94A3B8', fontSize: 10, marginTop: 2 }}>
                      Folio: {ruta.folio}
                    </Text>
                    <Text style={{ color: seleccionada ? '#FFFFFF' : '#64748B', fontSize: 9, marginTop: 2 }}>
                      {ruta.comunas}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Nombre del Terminal / Garita</Text>
              <TextInput
                style={styles.inputFormulario}
                value={inputNombreGarita}
                onChangeText={setInputNombreGarita}
                placeholder="Ej: Garita Terminal René Olivares"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Línea y Trayecto Asignado (Automático)</Text>
              <View style={[styles.inputFormulario, { backgroundColor: '#0B132B', justifyContent: 'center' }]}>
                <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 12 }}>
                  {rutaSeleccionadaModal.linea} • Folio {rutaSeleccionadaModal.folio}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                  {rutaSeleccionadaModal.callesIda[0].calle} ⇄ {rutaSeleccionadaModal.callesRegreso[0].calle}
                </Text>
              </View>
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Nombre del Controlador a Cargo</Text>
              <TextInput
                style={styles.inputFormulario}
                value={inputOperador}
                onChangeText={setInputOperador}
                placeholder="Identificador del operador"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Turno Operacional</Text>
              <View style={styles.filaBotonesOpcion}>
                {['Mañana (06:00 - 14:00)', 'Tarde (14:00 - 22:00)', 'Noche (22:00 - 06:00)'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.btnOpcionTurno, inputTurno.startsWith(t.split(' ')[0]) && styles.btnOpcionTurnoActivo]}
                    onPress={() => setInputTurno(t as any)}
                  >
                    <Text style={[styles.textoBtnOpcion, inputTurno.startsWith(t.split(' ')[0]) && styles.textoBtnOpcionActivo]}>
                      {t.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.botonIniciarGarita} onPress={guardarRegistroGarita}>
              <Text style={styles.textoBotonIniciarGarita}>GUARDAR Y ASUMIR CONTROL EXCLUSIVO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 12, alignItems: 'center', marginTop: 4 }}
              onPress={() => setModoConfigurarGarita(false)}
            >
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL NUEVO REPORTE */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalNuevoReporte}
        onRequestClose={() => setModalNuevoReporte(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
          <View style={styles.tarjetaRegistroGarita}>
            <Text style={styles.tituloRegistro}>✍️ Libro de Novedades</Text>
            <Text style={styles.subtituloRegistro}>
              Registra un reclamo de pasajero o informe vial para la Línea {datosGarita.linea}.
            </Text>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Tipo de Evento</Text>
              <View style={styles.filaBotonesOpcion}>
                <TouchableOpacity
                  style={[styles.btnOpcionTurno, nuevoTipo === 'pasajero_a_conductor' && styles.btnOpcionTurnoActivo]}
                  onPress={() => setNuevoTipo('pasajero_a_conductor')}
                >
                  <Text style={[styles.textoBtnOpcion, nuevoTipo === 'pasajero_a_conductor' && styles.textoBtnOpcionActivo]}>
                    Reclamo Pasajero
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnOpcionTurno, nuevoTipo === 'conductor_a_garita' && styles.btnOpcionTurnoActivo]}
                  onPress={() => setNuevoTipo('conductor_a_garita')}
                >
                  <Text style={[styles.textoBtnOpcion, nuevoTipo === 'conductor_a_garita' && styles.textoBtnOpcionActivo]}>
                    Reporte Conductor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Emisor</Text>
              <TextInput
                style={styles.inputFormulario}
                value={nuevoOrigen}
                onChangeText={setNuevoOrigen}
                placeholder="Ej: Pasajera María Soto / Chofer Juan P."
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Patente Involucrada</Text>
              <TextInput
                style={styles.inputFormulario}
                value={nuevaPatente}
                onChangeText={setNuevaPatente}
                placeholder="Ej: GH-89-21"
                placeholderTextColor="#64748B"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Motivo / Asunto</Text>
              <TextInput
                style={styles.inputFormulario}
                value={nuevoTitulo}
                onChangeText={setNuevoTitulo}
                placeholder="Ej: Cobro indebido, desvío, pana mecánica"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.campoFormulario}>
              <Text style={styles.labelFormulario}>Detalle</Text>
              <TextInput
                style={[styles.inputFormulario, { height: 70, textAlignVertical: 'top' }]}
                value={nuevaDesc}
                onChangeText={setNuevaDesc}
                placeholder="Escribe la descripción de los hechos..."
                placeholderTextColor="#64748B"
                multiline
              />
            </View>

            <TouchableOpacity style={styles.botonIniciarGarita} onPress={handleCrearReporte}>
              <Text style={styles.textoBotonIniciarGarita}>INGRESAR REPORTE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 12, alignItems: 'center', marginTop: 4 }}
              onPress={() => setModalNuevoReporte(false)}
            >
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ALERTA DE PÁNICO EN RUTA */}
      <Modal
        visible={!!alertaPanicoActiva}
        transparent
        animationType="slide"
        onRequestClose={() => setAlertaPanicoActiva(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 22, borderWidth: 3, borderColor: '#EF4444' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#EF4444', textAlign: 'center', marginBottom: 6 }}>
              🚨 ¡ALERTA DE PÁNICO EN RUTA!
            </Text>
            <Text style={{ fontSize: 13, color: '#FECACA', textAlign: 'center', marginBottom: 16 }}>
              Un conductor de tu línea ha presionado el botón de auxilio de emergencia.
            </Text>

            <View style={{ backgroundColor: '#7F1D1D', borderRadius: 10, padding: 14, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#FCA5A5' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>
                Móvil: {alertaPanicoActiva?.patente} (Línea {alertaPanicoActiva?.linea})
              </Text>
              <Text style={{ color: '#FEE2E2', fontSize: 13, marginBottom: 4 }}>
                Chofer: {alertaPanicoActiva?.conductor}
              </Text>
              <Text style={{ color: '#FEE2E2', fontSize: 12, marginBottom: 8 }}>
                Hora de emisión: {alertaPanicoActiva?.hora}
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontStyle: 'italic' }}>
                "{alertaPanicoActiva?.mensaje}"
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                onPress={() => {
                  Alert.alert('Protocolo Activado', `Asistencia despachada para el móvil ${alertaPanicoActiva?.patente}.`);
                  setAlertaPanicoActiva(null);
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
                  ATENDER Y DESPACHAR ASISTENCIA
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ paddingVertical: 10, alignItems: 'center' }} onPress={() => setAlertaPanicoActiva(null)}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>Descartar aviso</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

