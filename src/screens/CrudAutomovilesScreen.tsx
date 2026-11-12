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

export interface AutomovilRecord {
  id?: string;
  marca: string;
  modelo: string;
  anio: string;
  patente: string;
  combustible: string;
  comuna: string;
  fecha_otorgacion_permiso: string;
  vencimiento_permiso: string;
  planta_revision: string;
  comuna_revision: string;
  vencimiento_revision: string;
  compania_soap: string;
  prima_soap: string;
  vencimiento_soap: string;
}

interface CrudAutomovilesProps {
  onVolver: () => void;
}

export default function CrudAutomovilesScreen({ onVolver }: CrudAutomovilesProps) {
  const [autos, setAutos] = useState<AutomovilRecord[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Estados del formulario para Automóviles (INACAP)
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [patente, setPatente] = useState('');
  const [combustible, setCombustible] = useState('Bencina');
  const [comuna, setComuna] = useState('');
  const [fechaOtorgacionPermiso, setFechaOtorgacionPermiso] = useState('');
  const [vencimientoPermiso, setVencimientoPermiso] = useState('');
  const [plantaRevision, setPlantaRevision] = useState('');
  const [comunaRevision, setComunaRevision] = useState('');
  const [vencimientoRevision, setVencimientoRevision] = useState('');
  const [companiaSoap, setCompaniaSoap] = useState('');
  const [primaSoap, setPrimaSoap] = useState('');
  const [vencimientoSoap, setVencimientoSoap] = useState('');

  useEffect(() => {
    cargarAutos();
  }, []);

  const cargarAutos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('automoviles')
        .select('*')
        .order('patente', { ascending: true });

      if (error) throw error;
      if (data) setAutos(data);
    } catch (err: any) {
      Alert.alert('Error al cargar', err.message || 'No se pudieron obtener los automóviles.');
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    setMarca('');
    setModelo('');
    setAnio('');
    setPatente('');
    setCombustible('Bencina');
    setComuna('');
    setFechaOtorgacionPermiso('');
    setVencimientoPermiso('');
    setPlantaRevision('');
    setComunaRevision('');
    setVencimientoRevision('');
    setCompaniaSoap('');
    setPrimaSoap('');
    setVencimientoSoap('');
  };

  const guardarAuto = async () => {
    if (!patente.trim() || !marca.trim() || !modelo.trim()) {
      Alert.alert('Campos incompletos', 'Patente, Marca y Modelo son obligatorios.');
      return;
    }

    try {
      setGuardando(true);
      const nuevoAuto = {
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: anio.trim(),
        patente: patente.trim().toUpperCase(),
        combustible: combustible.trim(),
        comuna: comuna.trim(),
        fecha_otorgacion_permiso: fechaOtorgacionPermiso.trim() || null,
        vencimiento_permiso: vencimientoPermiso.trim() || null,
        planta_revision: plantaRevision.trim(),
        comuna_revision: comunaRevision.trim(),
        vencimiento_revision: vencimientoRevision.trim() || null,
        compania_soap: companiaSoap.trim(),
        prima_soap: primaSoap.trim(),
        vencimiento_soap: vencimientoSoap.trim() || null,
      };

      const { error } = await supabase.from('automoviles').insert([nuevoAuto]);
      if (error) throw error;

      Alert.alert('✅ Éxito', 'Automóvil registrado correctamente.');
      limpiarFormulario();
      setModalVisible(false);
      cargarAutos();
    } catch (err: any) {
      Alert.alert('Error al guardar', err.message || 'Verifica los datos ingresados.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarAuto = async (id: string, pat: string) => {
    Alert.alert(
      '🗑️ Eliminar Automóvil',
      `¿Deseas dar de baja el vehículo con patente ${pat}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('automoviles').delete().eq('id', id);
              if (error) throw error;
              cargarAutos();
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
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>🚗 CRUD de Automóviles</Text>
        <TouchableOpacity style={{ backgroundColor: '#0284C7', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }} onPress={() => setModalVisible(true)}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {cargando ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={{ color: '#94A3B8', marginTop: 10 }}>Cargando vehículos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {autos.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: '#64748B', fontSize: 13 }}>No hay automóviles registrados en la base de datos.</Text>
            </View>
          ) : (
            autos.map((a: any) => (
              <View key={a.id} style={{ backgroundColor: '#1E293B', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>{a.marca} {a.modelo} ({a.anio})</Text>
                  <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 13 }}>{a.patente}</Text>
                </View>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 2 }}>Combustible: {a.combustible} • Comuna: {a.comuna || 'N/A'}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 2 }}>Venc. Permiso: {a.vencimiento_permiso || 'N/A'} • Revisión: {a.vencimiento_revision || 'N/A'}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 8 }}>SOAP ({a.compania_soap || 'N/A'}): {a.vencimiento_soap || 'N/A'}</Text>

                <TouchableOpacity 
                  style={{ backgroundColor: '#7F1D1D', paddingVertical: 6, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }}
                  onPress={() => eliminarAuto(a.id, a.patente)}
                >
                  <Text style={{ color: '#FECACA', fontSize: 11, fontWeight: 'bold' }}>🗑️ Dar de Baja / Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal Formulario */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 20, maxHeight: '90%', borderWidth: 1.5, borderColor: '#38BDF8' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
              ➕ Registrar Nuevo Automóvil
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Marca *', val: marca, set: setMarca, placeholder: 'Ej: Nissan' },
                { label: 'Modelo *', val: modelo, set: setModelo, placeholder: 'Ej: V-16' },
                { label: 'Año', val: anio, set: setAnio, placeholder: '2022' },
                { label: 'Patente *', val: patente, set: setPatente, placeholder: 'GH-89-21' },
                { label: 'Combustible', val: combustible, set: setCombustible, placeholder: 'Bencina / Gas' },
                { label: 'Comuna Permiso Circulación', val: comuna, set: setComuna, placeholder: 'Maipú' },
                { label: 'Fecha Otorgación Permiso', val: fechaOtorgacionPermiso, set: setFechaOtorgacionPermiso, placeholder: 'AAAA-MM-DD' },
                { label: 'Vencimiento Permiso', val: vencimientoPermiso, set: setVencimientoPermiso, placeholder: 'AAAA-MM-DD' },
                { label: 'Planta de Revisión Técnica', val: plantaRevision, set: setPlantaRevision, placeholder: 'PRT Maipú' },
                { label: 'Comuna Revisión', val: comunaRevision, set: setComunaRevision, placeholder: 'Maipú' },
                { label: 'Vencimiento Revisión Técnica', val: vencimientoRevision, set: setVencimientoRevision, placeholder: 'AAAA-MM-DD' },
                { label: 'Compañía SOAP', val: companiaSoap, set: setCompaniaSoap, placeholder: 'Consorcio / Mapfre' },
                { label: 'Prima SOAP ($)', val: primaSoap, set: setPrimaSoap, placeholder: '7500' },
                { label: 'Vencimiento SOAP', val: vencimientoSoap, set: setVencimientoSoap, placeholder: 'AAAA-MM-DD' },
              ].map((campo, index) => (
                <View key={index} style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{campo.label}</Text>
                  <TextInput
                    style={{ backgroundColor: '#0F172A', borderRadius: 8, padding: 10, color: '#FFFFFF', fontSize: 13, borderWidth: 1, borderColor: '#334155' }}
                    placeholder={campo.placeholder}
                    placeholderTextColor="#64748B"
                    value={campo.val}
                    onChangeText={campo.set}
                  />
                </View>
              ))}

              <TouchableOpacity 
                style={{ backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 8 }}
                onPress={guardarAuto}
                disabled={guardando}
              >
                {guardando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>GUARDAR AUTOMÓVIL</Text>}
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