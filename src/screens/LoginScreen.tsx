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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { loginStyles as styles } from '../styles/loginStyles';

type ModoAcceso = 'login' | 'registro';

export default function LoginScreen() {
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

  // Paso 1: Envía el código numérico mediante signInWithOtp
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

  // Paso 2: Valida el código numérico y actualiza la contraseña
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
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContenido}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera con el logo oficial */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/logo-conatacoch.png')}
                style={{ width: 70, height: 70 }}
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
                  placeholderTextColor="#64748B"
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
                placeholderTextColor="#64748B"
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
                  placeholderTextColor="#64748B"
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
                    color="#94A3B8"
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
                <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: '600' }}>
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
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.textoBotonPrincipal}>
                  {modo === 'login' ? 'Acceder al Sistema' : 'Registrarme como Pasajero'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.textoFooter}>Sistema Integrado de Transporte Colectivo</Text>
            <Text style={styles.subTextoFooter}>Proyecto Académico INACAP</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Recuperación por Código OTP */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalRecuperarVisible}
        onRequestClose={cerrarModalRecuperacion}
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
              borderColor: '#38BDF8',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              🔑 Restablecer Contraseña
            </Text>

            {pasoRecuperacion === 'solicitar_codigo' ? (
              <>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#94A3B8',
                    textAlign: 'center',
                    marginBottom: 18,
                  }}
                >
                  Ingresa tu correo. Recibirás un código numérico para recuperar tu acceso.
                </Text>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
                    Correo Electrónico
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#0F172A',
                      borderRadius: 8,
                      padding: 12,
                      color: '#FFFFFF',
                      fontSize: 15,
                      borderWidth: 1,
                      borderColor: '#334155',
                    }}
                    placeholder="ejemplo@correo.cl"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={emailRecuperacion}
                    onChangeText={setEmailRecuperacion}
                  />
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#0284C7',
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                  onPress={handleSolicitarCodigoOtp}
                  disabled={procesandoRecuperacion}
                >
                  {procesandoRecuperacion ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
                      ENVIAR CÓDIGO
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#94A3B8',
                    textAlign: 'center',
                    marginBottom: 18,
                  }}
                >
                  Código enviado a: <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>{emailRecuperacion}</Text>
                </Text>

                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
                    Código recibido por correo
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#0F172A',
                      borderRadius: 8,
                      padding: 12,
                      color: '#FFFFFF',
                      fontSize: 18,
                      letterSpacing: 4,
                      textAlign: 'center',
                      borderWidth: 1,
                      borderColor: '#38BDF8',
                    }}
                    placeholder="12345678"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    maxLength={10}
                    value={codigoOtp}
                    onChangeText={setCodigoOtp}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
                    Nueva Contraseña
                  </Text>
                  <View style={styles.contenedorInputPassword}>
                    <TextInput
                      style={styles.inputPassword}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#64748B"
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
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#10B981',
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                  onPress={handleVerificarOtpYCambiarClave}
                  disabled={procesandoRecuperacion}
                >
                  {procesandoRecuperacion ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
                      CONFIRMAR NUEVA CONTRASEÑA
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ paddingVertical: 6, alignItems: 'center' }}
                  onPress={() => setPasoRecuperacion('solicitar_codigo')}
                  disabled={procesandoRecuperacion}
                >
                  <Text style={{ color: '#38BDF8', fontSize: 12 }}>¿No llegó? Solicitar otro código</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={{ paddingVertical: 8, alignItems: 'center', marginTop: 4 }}
              onPress={cerrarModalRecuperacion}
              disabled={procesandoRecuperacion}
            >
              <Text style={{ color: '#94A3B8', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

