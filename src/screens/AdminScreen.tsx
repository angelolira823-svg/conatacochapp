import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { adminStyles as styles } from '../styles/adminStyles';
import { RUTAS_SELECCIONADAS } from '../data/rutasOficiales';

export type RolSistema = 'admin' | 'conductor' | 'garita' | 'conductor_garita' | 'pasajero' | 'pendiente';
export type EstadoUsuario = 'aprobado' | 'pendiente' | 'rechazado';

export interface UsuarioGestion {
  id: string;
  nombre: string;
  correo: string;
  rolSolicitado: RolSistema;
  rolActual: RolSistema;
  estado: EstadoUsuario;
  lineaAsignada?: string;
}

interface AdminScreenProps {
  usuarios: UsuarioGestion[];
  onCerrarSesion: () => void;
  onCambiarEstado: (id: string, nuevoEstado: EstadoUsuario, nuevoRol: RolSistema, nuevaLinea?: string) => void;
  onNavegarAVista: (vista: 'pasajero' | 'conductor' | 'garita' | 'crud_conductores' | 'crud_automoviles') => void;
  onRecargar?: () => void;
}

export default function AdminScreen({
  usuarios,
  onCerrarSesion,
  onCambiarEstado,
  onNavegarAVista,
  onRecargar,
}: AdminScreenProps) {
  const [busquedaEmail, setBusquedaEmail] = useState<string>('');

  const usuariosFiltrados = usuarios.filter((u) => {
    const termino = busquedaEmail.trim().toLowerCase();
    return (
      u.correo.toLowerCase().includes(termino) ||
      u.nombre.toLowerCase().includes(termino)
    );
  });

  // Alternar permisos de Conductor o Garita de forma independiente
  const togglePermisoOperativo = (usuario: UsuarioGestion, permiso: 'conductor' | 'garita') => {
    const tieneConductor = usuario.rolActual === 'conductor' || usuario.rolActual === 'conductor_garita';
    const tieneGarita = usuario.rolActual === 'garita' || usuario.rolActual === 'conductor_garita';

    let nuevoConductor = tieneConductor;
    let nuevoGarita = tieneGarita;

    if (permiso === 'conductor') {
      nuevoConductor = !tieneConductor;
    } else if (permiso === 'garita') {
      nuevoGarita = !tieneGarita;
    }

    let nuevoRol: RolSistema = 'pasajero';
    if (nuevoConductor && nuevoGarita) {
      nuevoRol = 'conductor_garita';
    } else if (nuevoConductor) {
      nuevoRol = 'conductor';
    } else if (nuevoGarita) {
      nuevoRol = 'garita';
    }

    onCambiarEstado(usuario.id, 'aprobado', nuevoRol, usuario.lineaAsignada || '6023');
  };

  const asignarPasajero = (usuario: UsuarioGestion) => {
    onCambiarEstado(usuario.id, 'aprobado', 'pasajero', usuario.lineaAsignada || '6023');
  };

  const cambiarLineaConductor = (usuario: UsuarioGestion, lineaNumero: string) => {
    onCambiarEstado(usuario.id, usuario.estado, usuario.rolActual, lineaNumero);
    Alert.alert(
      '✅ Ruta Asignada',
      `Se ha asignado a ${usuario.nombre} a la Línea ${lineaNumero}.`
    );
  };

  const colorBadgePorRol = (rol: RolSistema) => {
    switch (rol) {
      case 'conductor':
        return '#B45309';
      case 'garita':
        return '#0369A1';
      case 'conductor_garita':
        return '#6D28D9';
      case 'admin':
        return '#B91C1C';
      default:
        return '#15803D';
    }
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.tituloHeader}>🛡️ Panel Administrador</Text>
            <Text style={styles.subtituloHeader}>CONATACOCH • Control Gremial</Text>
          </View>
          <TouchableOpacity style={styles.botonCerrarSesion} onPress={onCerrarSesion}>
            <Text style={styles.textoCerrarSesion}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Supervisión de Vistas y Módulos CRUD */}
        <View style={styles.seccionSupervision}>
          <Text style={styles.tituloSeccion}>Supervisión de Vistas y Módulos</Text>
          <View style={styles.filaBotonesSupervision}>
            <TouchableOpacity
              style={styles.botonVista}
              onPress={() => onNavegarAVista('pasajero')}
            >
              <Text style={styles.iconoVista}>🚶</Text>
              <Text style={styles.textoBotonVista}>Pasajeros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonVista}
              onPress={() => onNavegarAVista('conductor')}
            >
              <Text style={styles.iconoVista}>🚕</Text>
              <Text style={styles.textoBotonVista}>Choferes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonVista}
              onPress={() => onNavegarAVista('garita')}
            >
              <Text style={styles.iconoVista}>🏢</Text>
              <Text style={styles.textoBotonVista}>Garita</Text>
            </TouchableOpacity>
          </View>

          {/* Botones directos a los CRUDs de Conductores y Automóviles */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#0284C7',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#38BDF8',
              }}
              onPress={() => onNavegarAVista('crud_conductores')}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 }}>👥 CRUD Conductores</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#0D9488',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#2DD4BF',
              }}
              onPress={() => onNavegarAVista('crud_automoviles')}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 }}>🚗 CRUD Automóviles</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gestión de Usuarios */}
        <View style={styles.seccionGestion}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.tituloSeccion}>Gestión de Accesos</Text>
            {onRecargar && (
              <TouchableOpacity onPress={onRecargar} style={{ padding: 6 }}>
                <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: 'bold' }}>🔄 Actualizar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contenedorBuscador}>
            <Text style={styles.iconoLupa}>🔍</Text>
            <TextInput
              style={styles.inputBuscador}
              placeholder="Buscar por correo o nombre..."
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              keyboardType="email-address"
              value={busquedaEmail}
              onChangeText={setBusquedaEmail}
            />
            {busquedaEmail !== '' && (
              <TouchableOpacity
                onPress={() => setBusquedaEmail('')}
                style={styles.botonLimpiar}
              >
                <Text style={styles.textoLimpiar}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.contadorResultados}>
            Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
          </Text>

          {usuariosFiltrados.length === 0 ? (
            <View style={styles.sinResultados}>
              <Text style={styles.textoSinResultados}>
                No se encontraron usuarios.
              </Text>
            </View>
          ) : (
            usuariosFiltrados.map((u) => {
              const lineaActual = u.lineaAsignada || '6023';

              // Evaluar si tiene activo cada acceso
              const tieneConductor = u.rolActual === 'conductor' || u.rolActual === 'conductor_garita';
              const tieneGarita = u.rolActual === 'garita' || u.rolActual === 'conductor_garita';
              const esPasajero = u.rolActual === 'pasajero';

              return (
                <View key={u.id} style={styles.tarjetaUsuario}>
                  <View style={styles.cabeceraTarjeta}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.nombreUsuario}>{u.nombre}</Text>
                      <Text style={styles.correoUsuario}>{u.correo}</Text>
                    </View>
                    <View
                      style={[
                        styles.badgeRol,
                        { backgroundColor: colorBadgePorRol(u.rolActual) },
                      ]}
                    >
                      <Text style={styles.textoBadgeRol}>
                        {u.rolActual === 'conductor_garita' ? 'CHOFER & GARITA' : u.rolActual.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Botones de Asignación con soporte de Selección Simultánea */}
                  <View style={styles.cajaAsignarRoles}>
                    <Text style={styles.labelAsignar}>Habilitar accesos (puedes activar ambos):</Text>
                    <View style={styles.filaBotonesAsignar}>
                      {/* Botón 1: Conductor */}
                      <TouchableOpacity
                        style={[
                          styles.btnRol,
                          tieneConductor && {
                            backgroundColor: '#78350F',
                            borderColor: '#F59E0B',
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => togglePermisoOperativo(u, 'conductor')}
                      >
                        <Text
                          style={[
                            styles.textoBtnRol,
                            tieneConductor && { color: '#FDE68A', fontWeight: 'bold' },
                          ]}
                        >
                          {tieneConductor ? '✅ 🚕 Conductor' : '🚕 Conductor'}
                        </Text>
                      </TouchableOpacity>

                      {/* Botón 2: Garita */}
                      <TouchableOpacity
                        style={[
                          styles.btnRol,
                          tieneGarita && {
                            backgroundColor: '#0C4A6E',
                            borderColor: '#38BDF8',
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => togglePermisoOperativo(u, 'garita')}
                      >
                        <Text
                          style={[
                            styles.textoBtnRol,
                            tieneGarita && { color: '#BAE6FD', fontWeight: 'bold' },
                          ]}
                        >
                          {tieneGarita ? '✅ 🏢 Garita' : '🏢 Garita'}
                        </Text>
                      </TouchableOpacity>

                      {/* Botón 3: Pasajero (Solo si no tiene roles operativos) */}
                      <TouchableOpacity
                        style={[
                          styles.btnRol,
                          esPasajero && {
                            backgroundColor: '#064E3B',
                            borderColor: '#10B981',
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => asignarPasajero(u)}
                      >
                        <Text
                          style={[
                            styles.textoBtnRol,
                            esPasajero && { color: '#A7F3D0', fontWeight: 'bold' },
                          ]}
                        >
                          {esPasajero ? '✅ 🚶 Pasajero' : '🚶 Pasajero'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Asignación de Línea / Ruta Oficial */}
                  {(tieneConductor || tieneGarita) && (
                    <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold' }}>
                          📍 Línea Oficial Asignada:
                        </Text>
                        <View style={{ backgroundColor: '#0284C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                            Línea {lineaActual}
                          </Text>
                        </View>
                      </View>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {RUTAS_SELECCIONADAS.map((ruta) => {
                          const numLinea = ruta.linea.replace('Línea ', '');
                          const esActiva = lineaActual === numLinea;

                          return (
                            <TouchableOpacity
                              key={ruta.id}
                              style={{
                                backgroundColor: esActiva ? '#0284C7' : '#0F172A',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 6,
                                marginRight: 6,
                                borderWidth: 1,
                                borderColor: esActiva ? '#38BDF8' : '#334155',
                              }}
                              onPress={() => cambiarLineaConductor(u, numLinea)}
                            >
                              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: esActiva ? 'bold' : 'normal' }}>
                                {ruta.linea}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

