import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from './src/services/supabase';
import LoginScreen from './src/screens/LoginScreen';
import CrudConductoresScreen from './src/screens/CrudConductoresScreen';
import CrudAutomovilesScreen from './src/screens/CrudAutomovilesScreen';
import ConductorScreen, {
  EstadoServicio,
  UltimoPagoRecibido,
  DatosTurnoConductor,
} from './src/screens/ConductorScreen';
import PasajeroScreen, { NuevoReporteData } from './src/screens/PasajeroScreen';
import GaritaScreen, { ReporteGremial } from './src/screens/GaritaScreen';
import AdminScreen, { UsuarioGestion, EstadoUsuario, RolSistema } from './src/screens/AdminScreen';
import { appStyles as styles } from './src/styles/appStyles';

export default function App() {
  const [cargando, setCargando] = useState<boolean>(true);
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioGestion | null>(null);
  const [usuariosLista, setUsuariosLista] = useState<UsuarioGestion[]>([]);
  const [vistaActiva, setVistaActiva] = useState<'pasajero' | 'conductor' | 'garita' | 'admin' | 'crud_conductores' | 'crud_automoviles'>('pasajero');

  // Datos dinámicos del turno del conductor
  const [datosTurnoConductor, setDatosTurnoConductor] = useState<DatosTurnoConductor>({
    patente: 'GH-89-21',
    ruta: '6023',
    origenDestino: 'René Olivares ⇄ Los Cancilleres (Maipú)',
    capacidad: 4,
  });

  const [cuposConductor, setCuposConductor] = useState<number>(4);
  const [estadoServicioConductor, setEstadoServicioConductor] = useState<EstadoServicio>('en_ruta');
  const [pasajerosHoy, setPasajerosHoy] = useState<number>(0);
  const [ultimoPagoRecibido, setUltimoPagoRecibido] = useState<UltimoPagoRecibido | null>(null);

  // Libro de reportes compartido entre Pasajeros, Choferes y Garita
  const [reportesGremiales, setReportesGremiales] = useState<ReporteGremial[]>([
    {
      id: '1',
      tipo: 'pasajero_a_conductor',
      origen: 'Pasajera: Camila Riquelme',
      patenteAfectada: 'FP-55-12',
      titulo: 'No se detuvo en paradero Silva Carvallo',
      descripcion: 'El móvil venía con 3 asientos libres según la app pero pasó por segunda pista y no paró.',
      hora: '17:40 hrs',
      estado: 'Pendiente',
    },
    {
      id: '2',
      tipo: 'conductor_a_garita',
      origen: 'Conductor: Patricio Fuentes (GH-89-21)',
      titulo: 'Congestión severa en Av. 5 de Abril',
      descripcion: 'Trabajos viales a la altura de Primera Transversal. La vuelta se retrasará aproximadamente 15 minutos.',
      hora: '18:05 hrs',
      estado: 'Revisado',
    },
  ]);

  useEffect(() => {
    verificarSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await cargarDatosPerfil(session.user);
      } else {
        setUsuarioActivo(null);
        setVistaActiva('pasajero');
        setCargando(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const verificarSesion = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await cargarDatosPerfil(session.user);
      } else {
        setCargando(false);
      }
    } catch (e) {
      setCargando(false);
    }
  };

  const cargarDatosPerfil = async (user: any) => {
    try {
      const userId = user.id;
      const email = user.email || '';
      const nombreMeta = user.user_metadata?.nombre || user.user_metadata?.full_name;

      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error al cargar perfil:', error.message);
      }

      const nombreFinal = data?.nombre || nombreMeta || email.split('@')[0];
      const rolDetectado = (data?.rol as RolSistema) || (email.includes('admin') ? 'admin' : 'pasajero');

      const perfilUsuario: UsuarioGestion = {
        id: userId,
        nombre: nombreFinal,
        correo: email,
        rolSolicitado: (data?.rol_solicitado as RolSistema) || 'pasajero',
        rolActual: rolDetectado,
        estado: (data?.estado as EstadoUsuario) || 'aprobado',
      };

      setUsuarioActivo(perfilUsuario);

      if (perfilUsuario.rolActual === 'admin') {
        await cargarTodosLosUsuarios();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const cargarTodosLosUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error al obtener perfiles:', error.message);
        return;
      }

      if (data) {
        const formateados: UsuarioGestion[] = data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre || 'Usuario',
          correo: item.correo || '',
          rolSolicitado: item.rol_solicitado || 'pasajero',
          rolActual: item.rol || 'pasajero',
          estado: item.estado || 'aprobado',
        }));
        setUsuariosLista(formateados);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cambiarEstadoUsuario = async (id: string, nuevoEstado: EstadoUsuario, nuevoRol: RolSistema) => {
    const { error } = await supabase
      .from('perfiles')
      .update({ estado: nuevoEstado, rol: nuevoRol })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar rol:', error.message);
      return;
    }

    setUsuariosLista((prev) =>
      prev.map((u) => (u.id === id ? { ...u, estado: nuevoEstado, rolActual: nuevoRol } : u))
    );
  };

  const handleOcuparAsientoAutomatico = (patente: string) => {
    if (patente === datosTurnoConductor.patente && cuposConductor > 0) {
      setCuposConductor((prev) => Math.max(0, prev - 1));
    }
  };

  const handleLiberarAsientoAutomatico = (patente: string) => {
    if (patente === datosTurnoConductor.patente) {
      setCuposConductor((prev) => Math.min(datosTurnoConductor.capacidad, prev + 1));
    }
  };

  const handleProcesarPagoPasaje = (monto: number, patente: string, chofer: string) => {
    if (patente === datosTurnoConductor.patente) {
      setPasajerosHoy((prev) => prev + 1);
      const ahora = new Date();
      const horaStr = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setUltimoPagoRecibido({
        monto,
        pasajeroNombre: usuarioActivo?.nombre || 'Pasajero Anónimo',
        hora: horaStr,
      });
    }
  };

  const handleCrearReporteCentral = (data: NuevoReporteData) => {
    const nuevoItem: ReporteGremial = {
      id: Date.now().toString(),
      tipo: data.tipo,
      origen: data.origen,
      patenteAfectada: data.patenteAfectada,
      titulo: data.titulo,
      descripcion: data.descripcion,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
      estado: 'Pendiente',
    };
    setReportesGremiales((prev) => [nuevoItem, ...prev]);
  };

  const handleCambiarEstadoReporte = (id: string, nuevoEstado: 'Pendiente' | 'Revisado' | 'Resuelto') => {
    setReportesGremiales((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r))
    );
  };

  const cerrarSesion = async () => {
    setCargando(true);
    setVistaActiva('pasajero');
    await supabase.auth.signOut();
    setUsuarioActivo(null);
    setCargando(false);
  };

  if (cargando) {
    return (
      <View style={styles.pantallaCarga}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // 1. Sin sesión activa
  if (!usuarioActivo) {
    return <LoginScreen />;
  }

  // 2. VISTA CRUD CONDUCTORES (Evaluación Parcial 3)
  if (vistaActiva === 'crud_conductores') {
    return <CrudConductoresScreen onVolver={() => setVistaActiva('admin')} />;
  }

  // 3. VISTA CRUD AUTOMÓVILES (Evaluación Parcial 3)
  if (vistaActiva === 'crud_automoviles') {
    return <CrudAutomovilesScreen onVolver={() => setVistaActiva('admin')} />;
  }

  // 4. VISTA CONDUCTOR
  if (vistaActiva === 'conductor') {
    return (
      <ConductorScreen
        onVolver={() => setVistaActiva('pasajero')}
        datosTurno={datosTurnoConductor}
        onGuardarDatosTurno={(nuevosDatos) => setDatosTurnoConductor(nuevosDatos)}
        cuposDisponibles={cuposConductor}
        onCambiarCupos={(nuevosCupos) => setCuposConductor(nuevosCupos)}
        estadoServicio={estadoServicioConductor}
        onCambiarEstadoServicio={(nuevoEstado) => setEstadoServicioConductor(nuevoEstado)}
        pasajerosHoy={pasajerosHoy}
        onRegistrarPasajero={() => setPasajerosHoy((prev) => prev + 1)}
        ultimoPago={ultimoPagoRecibido}
        onCrearReporte={handleCrearReporteCentral}
        nombreConductor={usuarioActivo.nombre}
        reportesColegas={reportesGremiales}
      />
    );
  }

  // 5. VISTA GARITA
  if (vistaActiva === 'garita') {
    return (
      <GaritaScreen
        onVolver={() => setVistaActiva('pasajero')}
        reportesExternos={reportesGremiales}
        onAgregarReporte={(rep) => setReportesGremiales((prev) => [rep, ...prev])}
        onCambiarEstadoReporte={handleCambiarEstadoReporte}
      />
    );
  }

  // 6. VISTA ADMIN
  if (vistaActiva === 'admin' && usuarioActivo.rolActual === 'admin') {
    return (
      <AdminScreen
        usuarios={usuariosLista}
        onCerrarSesion={cerrarSesion}
        onCambiarEstado={cambiarEstadoUsuario}
        onNavegarAVista={(v) => setVistaActiva(v)}
        onRecargar={cargarTodosLosUsuarios}
      />
    );
  }

  // 7. VISTA PASAJERO (Principal)
  return (
    <PasajeroScreen
      onVolver={cerrarSesion}
      esAdmin={usuarioActivo.rolActual === 'admin'}
      nombreUsuario={usuarioActivo.nombre}
      correoUsuario={usuarioActivo.correo}
      rolUsuario={usuarioActivo.rolActual}
      onNavegarAVista={(v) => setVistaActiva(v)}
      colectivoConductor={{
        cupos: cuposConductor,
        estado: estadoServicioConductor,
        conductorNombre: usuarioActivo.nombre,
      }}
      onOcuparAsientoAutomatico={handleOcuparAsientoAutomatico}
      onLiberarAsientoAutomatico={handleLiberarAsientoAutomatico}
      onRealizarPagoPasaje={handleProcesarPagoPasaje}
      onCrearReporte={handleCrearReporteCentral}
    />
  );
}

