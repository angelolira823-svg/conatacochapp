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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '../services/supabase';

export interface ConductorRecord {
  id?: string;
  nombre_completo: string;
  rut: string;
  direccion: string;
  fono_celular: string;
  fono_domicilio: string;
  fecha_incorporacion: string;
  tipo_licencia: string;
  municipio_licencia: string;
  fecha_obtencion_licencia: string;
  duracion_anos: string;
  fecha_vencimiento_licencia: string;
}

interface CrudConductoresProps {
  onVolver: () => void;
}

export default function CrudConductoresScreen({ onVolver }: CrudConductoresProps) {
  const [conductores, setConductores] = useState<ConductorRecord[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Estados del formulario exigidos por INACAP
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rut, setRut] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fonoCelular, setFonoCelular] = useState('');
  const [fonoDomicilio, setFonoDomicilio] = useState('');
  const [fechaIncorporacion, setFechaIncorporacion] = useState('');
  const [tipoLicencia, setTipoLicencia] = useState('A2');
  const [municipioLicencia, setMunicipioLicencia] = useState('');
  const [fechaObtencionLicencia, setFechaObtencionLicencia] = useState('');
  const [duracionAnos, setDuracionAnos] = useState('');
  const [fechaVencimientoLicencia, setFechaVencimientoLicencia] = useState('');

  useEffect(() => {
    cargarConductores();
  }, []);

  const cargarConductores = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('conductores')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;
      if (data) setConductores(data);
    } catch (err: any) {
      Alert.alert('Error al cargar', err.message || 'No se pudo conectar a la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    setNombreCompleto('');
    setRut('');
    setDireccion('');
    setFonoCelular('');
    setFonoDomicilio('');
    setFechaIncorporacion('');
    setTipoLicencia('A2');
    setMunicipioLicencia('');
    setFechaObtencionLicencia('');
    setDuracionAnos('');
    setFechaVencimientoLicencia('');
  };

  const guardarConductor = async () => {
    if (!nombreCompleto.trim() || !rut.trim() || !tipoLicencia.trim()) {
      Alert.alert('Campos incompletos', 'Nombre, RUT y Tipo de Licencia son obligatorios.');
      return;
    }

    try {
      setGuardando(true);
      const nuevoConductor = {
        nombre_completo: nombreCompleto.trim(),
        rut: rut.trim(),
        direccion: direccion.trim(),
        fono_celular: fonoCelular.trim(),
        fono_domicilio: fonoDomicilio.trim(),
        fecha_incorporacion: fechaIncorporacion.trim() || null,
        tipo_licencia: tipoLicencia.trim(),
        municipio_licencia: municipioLicencia.trim(),
        fecha_obtencion_licencia: fechaObtencionLicencia.trim() || null,
        duracion_anos: duracionAnos ? parseInt(duracionAnos, 10) : null,
        fecha_vencimiento_licencia: fechaVencimientoLicencia.trim() || null,
      };

      const { error } = await supabase.from('conductores').insert([nuevoConductor]);

      if (error) throw error;

      Alert.alert('✅ Éxito', 'Conductor registrado correctamente en el sistema.');
      limpiarFormulario();
      setModalVisible(false);
      cargarConductores();
    } catch (err: any) {
      Alert.alert('Error al guardar', err.message || 'Verifica los datos ingresados.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarConductor = async (id: string, nombre: string) => {
    Alert.alert(
      '🗑️ Eliminar Conductor',
      `¿Estás seguro de dar de baja a ${nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('conductores').delete().eq('id', id);
              if (error) throw error;
              cargarConductores();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B132B' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
      
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' }}>
        <TouchableOpacity onPress={onVolver} style={{ padding: 6 }}>
          <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 14 }}>← Volver</Text>
        </TouchableOpacity>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>📋 CRUD de Conductores</Text>
        <TouchableOpacity style={{ backgroundColor: '#0284C7', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }} onPress={() => setModalVisible(true)}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Registros */}
      {cargando ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={{ color: '#94A3B8', marginTop: 10 }}>Cargando conductores...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {conductores.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: '#64748B', fontSize: 13 }}>No hay conductores registrados en la base de datos.</Text>
            </View>
          ) : (
            conductores.map((c: any) => (
              <View key={c.id} style={{ backgroundColor: '#1E293B', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>{c.nombre_completo}</Text>
                  <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 13 }}>LIC: {c.tipo_licencia}</Text>
                </View>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 2 }}>RUT: {c.rut} • Fono: {c.fono_celular || 'N/A'}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 2 }}>Municipio: {c.municipio_licencia || 'N/A'} • Vencimiento: {c.fecha_vencimiento_licencia || 'N/A'}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 8 }}>Incorporación CONATACOCH: {c.fecha_incorporacion || 'N/A'}</Text>

                <TouchableOpacity 
                  style={{ backgroundColor: '#7F1D1D', paddingVertical: 6, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }}
                  onPress={() => eliminarConductor(c.id, c.nombre_completo)}
                >
                  <Text style={{ color: '#FECACA', fontSize: 11, fontWeight: 'bold' }}>🗑️ Dar de Baja / Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal Formulario de Registro */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 20, maxHeight: '90%', borderWidth: 1.5, borderColor: '#38BDF8' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
              ➕ Registrar Nuevo Conductor
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Nombre Completo *', val: nombreCompleto, set: setNombreCompleto, placeholder: 'Ej: Juan Pérez Soto' },
                { label: 'RUT *', val: rut, set: setRut, placeholder: 'Ej: 12.345.678-9' },
                { label: 'Dirección', val: direccion, set: setDireccion, placeholder: 'Ej: Av. Pajaritos 1234' },
                { label: 'Fono Celular', val: fonoCelular, set: setFonoCelular, placeholder: '+56912345678' },
                { label: 'Fono Domicilio', val: fonoDomicilio, set: setFonoDomicilio, placeholder: '223456789' },
                { label: 'Fecha Incorporación CONATACOCH', val: fechaIncorporacion, set: setFechaIncorporacion, placeholder: 'AAAA-MM-DD' },
                { label: 'Tipo de Licencia (A2-A3) *', val: tipoLicencia, set: setTipoLicencia, placeholder: 'A2' },
                { label: 'Municipio que otorgó licencia', val: municipioLicencia, set: setMunicipioLicencia, placeholder: 'Municipalidad de Maipú' },
                { label: 'Fecha Obtención Licencia', val: fechaObtencionLicencia, set: setFechaObtencionLicencia, placeholder: 'AAAA-MM-DD' },
                { label: 'Duración (en años)', val: duracionAnos, set: setDuracionAnos, placeholder: '4', num: true },
                { label: 'Fecha Vencimiento Licencia', val: fechaVencimientoLicencia, set: setFechaVencimientoLicencia, placeholder: 'AAAA-MM-DD' },
              ].map((campo, index) => (
                <View key={index} style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{campo.label}</Text>
                  <TextInput
                    style={{ backgroundColor: '#0F172A', borderRadius: 8, padding: 10, color: '#FFFFFF', fontSize: 13, borderWidth: 1, borderColor: '#334155' }}
                    placeholder={campo.placeholder}
                    placeholderTextColor="#64748B"
                    value={campo.val}
                    onChangeText={campo.set}
                    keyboardTarget={campo.num ? 'numeric' : 'default'}
                  />
                </View>
              ))}

              <TouchableOpacity 
                style={{ backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 8 }}
                onPress={guardarConductor}
                disabled={guardando}
              >
                {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>GUARDAR CONDUCTOR</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ paddingVertical: 10, alignItems: 'center' }}
                onPress={() => setModalVisible(false)}
                disabled={guardando}
              >
                <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}