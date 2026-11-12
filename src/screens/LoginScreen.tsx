import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

type ModoAcceso = 'login' | 'registro';

interface LoginScreenProps {
  onAccesoInvitado?: () => void; // Callback para permitir el paso a la app como invitado
}

export default function LoginScreen({ onAccesoInvitado }: LoginScreenProps) {
  const [modo, setModo] = useState<ModoAcceso>('login');
  const [cargando, setCargando] = useState<boolean>(false);

  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  // Estados del flujo de restablecimiento por código OTP
  const [modalRecuperarVisible, setModalRecuperarVisible] = useState<boolean>(false);
  const [pasoRecuperacion, setPasoRecuperacion] = useState<'solicitar_codigo' | 'verificar_y_cambiar'>('solicitar_codigo');
  const [emailRecuperacion, setEmailRecuperacion] = useState<string>('');
  const [codigoOtp, setCodigoOtp] = useState<string>('');
  const [nuevaPassword, setNuevaPassword] = useState<string>('');
  const [mostrarNuevaPassword, setMostrarNuevaPassword] = useState<boolean>(false);
  const [procesandoRecuperacion, setProcesandoRecuperacion] = useState<boolean>(false);

  // Estado del Modal de Advertencia para Invitados
  const [modalInvitadoVisible, setModalInvitadoVisible] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }

    try {
      setCargando(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Alert.alert('Error de acceso', 'Credenciales inválidas o correo no registrado.');
      }
    } catch (err: any) {
      Alert.alert('Error inesperado', err.message || 'Inténtalo nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Completa tu nombre, correo y contraseña.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setCargando(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            nombre: nombre.trim(),
          },
        },
      });

      if (authError) {
        Alert.alert('Error al registrar', authError.message);
        return;
      }

      if (authData.user) {
        await supabase.from('perfiles').upsert({
          id: authData.user.id,
          nombre: nombre.trim(),
          correo: email.trim(),
          rol_solicitado: 'pasajero',
          rol: 'pasajero',
          estado: 'aprobado',
        });

        Alert.alert(
          '¡Cuenta Creada con Éxito!',
          'Tu cuenta de pasajero está lista. Ya puedes iniciar sesión y usar la aplicación.'
        );

        setModo('login');
        setPassword('');
        setMostrarPassword(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo procesar el registro.');
    } finally {
      setCargando(false);
    }
  };

  const handleSolicitarCodigoOtp = async () => {
    if (!emailRecuperacion.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu correo electrónico registrado.');
      return;
    }

    try {
      setProcesandoRecuperacion(true);

      const { error } = await supabase.auth.signInWithOtp({
        email: emailRecuperacion.trim(),
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        Alert.alert('Error', error.message || 'No se pudo enviar el código de verificación.');
        return;
      }

      Alert.alert(
        'Código Enviado',
        `Revisa tu bandeja de entrada en ${emailRecuperacion.trim()}. Te llegará un mensaje con tu código de verificación.`
      );
      setPasoRecuperacion('verificar_y_cambiar');
    } catch (err: any) {
      Alert.alert('Error inesperado', err.message || 'Inténtalo nuevamente.');
    } finally {
      setProcesandoRecuperacion(false);
    }
  };

  const handleVerificarOtpYCambiarClave = async () => {
    const tokenLimpio = codigoOtp.trim();

    if (!tokenLimpio || tokenLimpio.length < 6) {
      Alert.alert('Código requerido', 'Ingresa el código numérico completo recibido por correo.');
      return;
    }

    if (nuevaPassword.length < 6) {
      Alert.alert('Contraseña corta', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setProcesandoRecuperacion(true);

      const { error: otpError } = await supabase.auth.verifyOtp({
        email: emailRecuperacion.trim(),
        token: tokenLimpio,
        type: 'email',
      });

      if (otpError) {
        Alert.alert('Código inválido', 'El código es incorrecto o ha vencido.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: nuevaPassword.trim(),
      });

      if (updateError) {
        Alert.alert('Error al guardar contraseña', updateError.message);
        return;
      }

      Alert.alert(
        '✅ Contraseña Restablecida',
        'Tu contraseña ha sido actualizada exitosamente. Tu sesión ya está iniciada.'
      );

      cerrarModalRecuperacion();
    } catch (err: any) {
      Alert.alert('Error inesperado', err.message || 'Inténtalo nuevamente.');
    } finally {
      setProcesandoRecuperacion(false);
    }
  };

  const cerrarModalRecuperacion = () => {
    setModalRecuperarVisible(false);
    setPasoRecuperacion('solicitar_codigo');
    setCodigoOtp('');
    setNuevaPassword('');
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#231f1e" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContenido}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera con identidad institucional */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/logo-conatacoch.png')}
                style={{ width: 75, height: 75 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.tituloApp}>CONATACOCH</Text>
            <Text style={styles.subtituloApp}>
              Confederación Nacional de Taxis Colectivos de Chile
            </Text>
          </View>

          <View style={styles.cajaTabs}>
            <TouchableOpacity
              style={[styles.botonTab, modo === 'login' && styles.botonTabActivo]}
              onPress={() => setModo('login')}
            >
              <Text style={[styles.textoTab, modo === 'login' && styles.textoTabActivo]}>
                Iniciar Sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonTab, modo === 'registro' && styles.botonTabActivo]}
              onPress={() => setModo('registro')}
            >
              <Text style={[styles.textoTab, modo === 'registro' && styles.textoTabActivo]}>
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tarjetaForm}>
            {modo === 'registro' && (
              <View style={styles.campoForm}>
                <Text style={styles.label}>Nombre y Apellido</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juan Pérez"
                  placeholderTextColor="#888888"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>
            )}

            <View style={styles.campoForm}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.cl"
                placeholderTextColor="#888888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.campoForm}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.contenedorInputPassword}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#888888"
                  secureTextEntry={!mostrarPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.botonOjo}
                  onPress={() => setMostrarPassword(!mostrarPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={mostrarPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {modo === 'login' && (
              <TouchableOpacity
                style={{ alignSelf: 'flex-end', marginTop: 4, marginBottom: 16 }}
                onPress={() => {
                  setEmailRecuperacion(email.trim());
                  setPasoRecuperacion('solicitar_codigo');
                  setModalRecuperarVisible(true);
                }}
              >
                <Text style={{ color: '#41ba47', fontSize: 13, fontWeight: '600' }}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.botonPrincipal}
              onPress={modo === 'login' ? handleLogin : handleRegistro}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.textoBotonPrincipal}>
                  {modo === 'login' ? 'Acceder al Sistema' : 'Registrarme como Pasajero'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Opción de ingreso como Invitado */}
            <TouchableOpacity
              style={styles.botonInvitado}
              onPress={() => setModalInvitadoVisible(true)}
            >
              <Text style={styles.textoBotonInvitado}>Ingresar como Invitado</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.textoFooter}>Sistema Integrado de Transporte Colectivo</Text>
            <Text style={styles.subTextoFooter}>Proyecto Académico INACAP</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DE ADVERTENCIA DE RIESGO PARA INVITADOS */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalInvitadoVisible}
        onRequestClose={() => setModalInvitadoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTituloRiesgo}>⚠️ Advertencia de Uso como Invitado</Text>
            <Text style={styles.modalTextoRiesgo}>
              Estás ingresando a la red CONATACOCH en modo invitado. Utilizar la aplicación bajo este modo por un periodo prolongado conlleva los siguientes riesgos y limitaciones:
              {'\n\n'}• Pérdida permanente de historiales de viajes y registros locales.
              {'\n'}• Imposibilidad absoluta de sincronizar saldo digital y reservas a través de múltiples dispositivos.
              {'\n'}• Restricciones operativas en flotas prioritarias y acreditaciones gremiales.
            </Text>

            <TouchableOpacity
              style={styles.botonAceptarRiesgo}
              onPress={() => {
                setModalInvitadoVisible(false);
                if (onAccesoInvitado) onAccesoInvitado();
              }}
            >
              <Text style={styles.textoBotonAceptarRiesgo}>Acepto los Riesgos y Continuar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonCancelarInvitado}
              onPress={() => setModalInvitadoVisible(false)}
            >
              <Text style={styles.textoBotonCancelarInvitado}>Volver al Inicio de Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Recuperación por Código OTP */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalRecuperarVisible}
        onRequestClose={cerrarModalRecuperacion}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 6 }}>
              🔑 Restablecer Contraseña
            </Text>

            {pasoRecuperacion === 'solicitar_codigo' ? (
              <>
                <Text style={{ fontSize: 13, color: '#cccccc', textAlign: 'center', marginBottom: 18 }}>
                  Ingresa tu correo. Recibirás un código numérico para recuperar tu acceso.
                </Text>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
                    Correo Electrónico
                  </Text>
                  <TextInput
                    style={styles.inputModal}
                    placeholder="ejemplo@correo.cl"
                    placeholderTextColor="#888888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={emailRecuperacion}
                    onChangeText={setEmailRecuperacion}
                  />
                </View>

                <TouchableOpacity
                  style={styles.botonPrincipal}
                  onPress={handleSolicitarCodigoOtp}
                  disabled={procesandoRecuperacion}
                >
                  {procesandoRecuperacion ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.textoBotonPrincipal}>ENVIAR CÓDIGO</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: '#cccccc', textAlign: 'center', marginBottom: 18 }}>
                  Código enviado a: <Text style={{ color: '#41ba47', fontWeight: 'bold' }}>{emailRecuperacion}</Text>
                </Text>

                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
                    Código recibido por correo
                  </Text>
                  <TextInput
                    style={[styles.inputModal, { fontSize: 18, letterSpacing: 4, textAlign: 'center' }]}
                    placeholder="12345678"
                    placeholderTextColor="#888888"
                    keyboardType="numeric"
                    maxLength={10}
                    value={codigoOtp}
                    onChangeText={setCodigoOtp}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
                    Nueva Contraseña
                  </Text>
                  <View style={styles.contenedorInputPassword}>
                    <TextInput
                      style={styles.inputPassword}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#888888"
                      secureTextEntry={!mostrarNuevaPassword}
                      value={nuevaPassword}
                      onChangeText={setNuevaPassword}
                    />
                    <TouchableOpacity
                      style={styles.botonOjo}
                      onPress={() => setMostrarNuevaPassword(!mostrarNuevaPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={mostrarNuevaPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.botonPrincipal}
                  onPress={handleVerificarOtpYCambiarClave}
                  disabled={procesandoRecuperacion}
                >
                  {procesandoRecuperacion ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.textoBotonPrincipal}>CONFIRMAR NUEVA CONTRASEÑA</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ paddingVertical: 6, alignItems: 'center' }}
                  onPress={() => setPasoRecuperacion('solicitar_codigo')}
                  disabled={procesandoRecuperacion}
                >
                  <Text style={{ color: '#41ba47', fontSize: 12 }}>¿No llegó? Solicitar otro código</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={{ paddingVertical: 8, alignItems: 'center', marginTop: 4 }}
              onPress={cerrarModalRecuperacion}
              disabled={procesandoRecuperacion}
            >
              <Text style={{ color: '#888888', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#231f1e', // Negro institucional
  },
  scrollContenido: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#41ba47', // Verde institucional
  },
  tituloApp: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  subtituloApp: {
    color: '#cccccc',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  cajaTabs: {
    flexDirection: 'row',
    backgroundColor: '#332d2c',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  botonTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  botonTabActivo: {
    backgroundColor: '#41ba47', // Verde institucional
  },
  textoTab: {
    color: '#888888',
    fontWeight: 'bold',
    fontSize: 13,
  },
  textoTabActivo: {
    color: '#ffffff',
  },
  tarjetaForm: {
    backgroundColor: '#332d2c',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#41ba47',
  },
  campoForm: {
    marginBottom: 14,
  },
  label: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#231f1e',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#44403f',
  },
  contenedorInputPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#231f1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#44403f',
  },
  inputPassword: {
    flex: 1,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  botonOjo: {
    paddingHorizontal: 12,
  },
  botonPrincipal: {
    backgroundColor: '#41ba47', // Verde institucional
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  textoBotonPrincipal: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  botonInvitado: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#41ba47',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotonInvitado: {
    color: '#41ba47',
    fontWeight: 'bold',
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  textoFooter: {
    color: '#888888',
    fontSize: 11,
  },
  subTextoFooter: {
    color: '#41ba47',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#332d2c',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#41ba47',
  },
  modalTituloRiesgo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalTextoRiesgo: {
    fontSize: 12,
    color: '#dddddd',
    lineHeight: 18,
    marginBottom: 20,
  },
  botonAceptarRiesgo: {
    backgroundColor: '#41ba47',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  textoBotonAceptarRiesgo: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  botonCancelarInvitado: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  textoBotonCancelarInvitado: {
    color: '#888888',
    fontSize: 13,
  },
  inputModal: {
    backgroundColor: '#231f1e',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#44403f',
  },
});
