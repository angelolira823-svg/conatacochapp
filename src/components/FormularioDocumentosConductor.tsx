import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../services/supabase';

interface Props {
  conductorNombre: string;
  usuarioId?: string;
  lineaAsignada?: string;
  onDocumentosEnviados: () => void;
  onVolver: () => void;
}

export default function FormularioDocumentosConductor({
  conductorNombre,
  usuarioId,
  lineaAsignada = '6023',
  onDocumentosEnviados,
  onVolver,
}: Props) {
  // Campos obligatorios del Protocolo INACAP para Conductor
  const [nombreCompleto, setNombreCompleto] = useState<string>(conductorNombre || '');
  const [rutInput, setRutInput] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [fonoCelular, setFonoCelular] = useState<string>('');
  const [fonoDomicilio, setFonoDomicilio] = useState<string>('');
  const [fechaIncorporacion, setFechaIncorporacion] = useState<string>('');
  const [tipoLicencia, setTipoLicencia] = useState<string>('A2');
  const [municipioLicencia, setMunicipioLicencia] = useState<string>('');
  const [fechaObtencionLicencia, setFechaObtencionLicencia] = useState<string>('');
  const [duracionAnos, setDuracionAnos] = useState<string>('4');
  const [fechaVencimientoLicencia, setFechaVencimientoLicencia] = useState<string>('');

  // Campos para el CRUD de Automóviles (Vehículo del Conductor)
  const [patente, setPatente] = useState<string>('');
  const [marca, setMarca] = useState<string>('');
  const [modelo, setModelo] = useState<string>('');
  const [anio, setAnio] = useState<string>('2022');
  const [combustible, setCombustible] = useState<string>('Bencina');
  const [vencimientoPermiso, setVencimientoPermiso] = useState<string>('');
  const [vencimientoRevision, setVencimientoRevision] = useState<string>('');
  const [vencimientoSoap, setVencimientoSoap] = useState<string>('');

  const [subiendo, setSubiendo] = useState<boolean>(false);

  // Estados para manejar los selectores de fecha desplegables
  const [fechaTemporal, setFechaTemporal] = useState<Date>(new Date());
  const [campoFechaActivo, setCampoFechaActivo] = useState<
    | 'fechaIncorporacion'
    | 'fechaObtencionLicencia'
    | 'fechaVencimientoLicencia'
    | 'vencimientoPermiso'
    | 'vencimientoRevision'
    | 'vencimientoSoap'
    | null
  >(null);

  const alCambiarFecha = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setCampoFechaActivo(null); // Cierra automáticamente en Android
    }
    if (date) {
      setFechaTemporal(date);
      const fechaFormateada = date.toISOString().split('T')[0];

      if (campoFechaActivo === 'fechaIncorporacion') setFechaIncorporacion(fechaFormateada);
      if (campoFechaActivo === 'fechaObtencionLicencia') setFechaObtencionLicencia(fechaFormateada);
      if (campoFechaActivo === 'fechaVencimientoLicencia') setFechaVencimientoLicencia(fechaFormateada);
      if (campoFechaActivo === 'vencimientoPermiso') setVencimientoPermiso(fechaFormateada);
      if (campoFechaActivo === 'vencimientoRevision') setVencimientoRevision(fechaFormateada);
      if (campoFechaActivo === 'vencimientoSoap') setVencimientoSoap(fechaFormateada);
    }
  };

  const handleEnviarDocumentacion = async () => {
    if (!rutInput.trim() || !nombreCompleto.trim() || !patente.trim()) {
      Alert.alert('Faltan Datos', 'Por favor ingresa tu Nombre, RUT y la Patente de tu vehículo.');
      return;
    }

    setSubiendo(true);

    try {
      const patenteLimpia = patente.trim().toUpperCase();

      // 1. Guardar registro en el CRUD de Conductores usando insert
      const { error: errConductor } = await supabase.from('conductores').insert([
        {
          nombre_completo: nombreCompleto.trim(),
          rut: rutInput.trim().toUpperCase(),
          direccion: direccion.trim(),
          fono_celular: fonoCelular.trim(),
          fono_domicilio: fonoDomicilio.trim(),
          fecha_incorporacion: fechaIncorporacion.trim() || null,
          tipo_licencia: tipoLicencia.trim(),
          municipio_licencia: municipioLicencia.trim(),
          fecha_obtencion_licencia: fechaObtencionLicencia.trim() || null,
          duracion_anos: duracionAnos ? parseInt(duracionAnos, 10) : null,
          fecha_vencimiento_licencia: fechaVencimientoLicencia.trim() || null,
        },
      ]);

      if (errConductor) console.log('Aviso en CRUD Conductores:', errConductor.message);

      // 2. Registrar el vehículo en el CRUD de Automóviles usando insert
      const { error: errAuto } = await supabase.from('automoviles').insert([
        {
          marca: marca.trim() || 'Nissan',
          modelo: modelo.trim() || 'V-16',
          anio: anio.trim() || '2022',
          patente: patenteLimpia,
          combustible: combustible.trim(),
          comuna: municipioLicencia.trim() || 'Santiago',
          vencimiento_permiso: vencimientoPermiso.trim() || null,
          planta_revision: 'PRT Central',
          comuna_revision: municipioLicencia.trim() || 'Santiago',
          vencimiento_revision: vencimientoRevision.trim() || null,
          compania_soap: 'Consorcio',
          prima_soap: '7500',
          vencimiento_soap: vencimientoSoap.trim() || null,
        },
      ]);

      if (errAuto) console.log('Aviso en CRUD Automóviles:', errAuto.message);

      // 3. Registrar estado de validación para la aprobación de Garita
      const payloadDocumental = {
        usuario_id: usuarioId || null,
        patente: patenteLimpia,
        conductor_nombre: nombreCompleto.trim(),
        conductor_rut: rutInput.trim().toUpperCase(),
        folio_linea: lineaAsignada.trim(),
        clase_licencia: `Clase ${tipoLicencia} Profesional`,
        vencimiento_licencia: fechaVencimientoLicencia.trim() || new Date().toISOString().split('T')[0],
        vencimiento_revision_tecnica: vencimientoRevision.trim() || new Date().toISOString().split('T')[0],
        vencimiento_soap: vencimientoSoap.trim() || new Date().toISOString().split('T')[0],
        vencimiento_permiso_circulacion: vencimientoPermiso.trim() || new Date().toISOString().split('T')[0],
        carton_recorrido_mtt_al_dia: true,
        estado_validacion: 'en_revision_garita',
        actualizado_en: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('documentacion_conductores')
        .insert([payloadDocumental]);

      if (dbError) throw dbError;

      // Notificar a Garita Central mediante Broadcast
      const canalFlota = supabase.channel('flota-operacional-global');
      await canalFlota.send({
        type: 'broadcast',
        event: 'nuevo_conductor_documentos_pendientes',
        payload: { documento: payloadDocumental },
      });

      Alert.alert(
        '📋 Registro Enviado',
        `Tus antecedentes y los datos del móvil ${patenteLimpia} han sido ingresados al sistema y remitidos a la Garita de la Línea ${lineaAsignada}.`,
        [{ text: 'Entendido', onPress: onDocumentosEnviados }]
      );
    } catch (err: any) {
      console.log('Error al enviar registro:', err);
      Alert.alert('Error de Registro', err.message || 'No fue posible guardar los datos.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.scroll}>
      <View style={styles.tarjetaHeader}>
        <Text style={styles.badgeNorma}>PROTOCOLO INACAP • CONATACOCH</Text>
        <Text style={styles.titulo}>Formulario de Acreditación Gremial</Text>
        <Text style={styles.subtitulo}>
          Completa los datos exigidos para tu incorporación a la <Text style={{ color: '#FCD34D', fontWeight: 'bold' }}>Línea {lineaAsignada}</Text>.{'\n'}
          Estos registros alimentarán directamente el CRUD de Conductores y Automóviles.
        </Text>
      </View>

      {/* SECCIÓN 1: DATOS PERSONALES Y LICENCIA (CRUD CONDUCTORES) */}
      <View style={styles.seccionCaja}>
        <Text style={styles.tituloSeccion}>👤 1. Datos Personales y Licencia</Text>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Nombre Completo *</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="Ej: Juan Pérez Soto"
            placeholderTextColor="#64748B"
            value={nombreCompleto}
            onChangeText={setNombreCompleto}
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>RUT *</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="Ej: 12.345.678-9"
            placeholderTextColor="#64748B"
            value={rutInput}
            onChangeText={setRutInput}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Dirección</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="Ej: Av. Pajaritos 1234"
            placeholderTextColor="#64748B"
            value={direccion}
            onChangeText={setDireccion}
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Fono Celular</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="+56912345678"
            placeholderTextColor="#64748B"
            value={fonoCelular}
            onChangeText={(t) => setFonoCelular(t.replace(/[^0-9+]/g, ''))}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Fono Domicilio</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="223456789"
            placeholderTextColor="#64748B"
            value={fonoDomicilio}
            onChangeText={(t) => setFonoDomicilio(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </View>

        {/* Fecha Incorporación (Selector) */}
        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Fecha Incorporación CONATACOCH</Text>
          <TouchableOpacity style={styles.inputForm} onPress={() => setCampoFechaActivo('fechaIncorporacion')}>
            <Text style={{ color: fechaIncorporacion ? '#FFFFFF' : '#64748B', fontSize: 13 }}>
              {fechaIncorporacion || '📅 Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Tipo de Licencia (A2-A3) *</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="A2"
            placeholderTextColor="#64748B"
            value={tipoLicencia}
            onChangeText={setTipoLicencia}
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Municipio que otorgó la licencia</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="Municipalidad de Maipú"
            placeholderTextColor="#64748B"
            value={municipioLicencia}
            onChangeText={setMunicipioLicencia}
          />
        </View>

        {/* Fecha Obtención Licencia (Selector) */}
        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Fecha de Obtención Licencia</Text>
          <TouchableOpacity style={styles.inputForm} onPress={() => setCampoFechaActivo('fechaObtencionLicencia')}>
            <Text style={{ color: fechaObtencionLicencia ? '#FFFFFF' : '#64748B', fontSize: 13 }}>
              {fechaObtencionLicencia || '📅 Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Duración (en años)</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="4"
            placeholderTextColor="#64748B"
            value={duracionAnos}
            onChangeText={(t) => setDuracionAnos(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </View>

        {/* Fecha Vencimiento Licencia (Selector) */}
        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Fecha de Vencimiento Licencia</Text>
          <TouchableOpacity style={styles.inputForm} onPress={() => setCampoFechaActivo('fechaVencimientoLicencia')}>
            <Text style={{ color: fechaVencimientoLicencia ? '#FFFFFF' : '#64748B', fontSize: 13 }}>
              {fechaVencimientoLicencia || '📅 Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECCIÓN 2: DATOS DEL VEHÍCULO (CRUD AUTOMÓVILES) */}
      <View style={styles.seccionCaja}>
        <Text style={[styles.tituloSeccion, { color: '#10B981' }]}>🚗 2. Antecedentes del Automóvil</Text>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Patente del Colectivo *</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="GH-89-21"
            placeholderTextColor="#64748B"
            value={patente}
            onChangeText={setPatente}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Marca</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="Nissan / Toyota"
            placeholderTextColor="#64748B"
            value={marca}
            onChangeText={setMarca}
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Modelo</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="V-16 / Yaris"
            placeholderTextColor="#64748B"
            value={modelo}
            onChangeText={setModelo}
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Año</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="2022"
            placeholderTextColor="#64748B"
            value={anio}
            onChangeText={(t) => setAnio(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Combustible</Text>
          <TextInput
            style={styles.inputForm}
            placeholder="Bencina / Gas"
            placeholderTextColor="#64748B"
            value={combustible}
            onChangeText={setCombustible}
          />
        </View>

        {/* Vencimiento Permiso (Selector) */}
        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Vencimiento Permiso de Circulación</Text>
          <TouchableOpacity style={styles.inputForm} onPress={() => setCampoFechaActivo('vencimientoPermiso')}>
            <Text style={{ color: vencimientoPermiso ? '#FFFFFF' : '#64748B', fontSize: 13 }}>
              {vencimientoPermiso || '📅 Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vencimiento Revisión (Selector) */}
        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Vencimiento Revisión Técnica</Text>
          <TouchableOpacity style={styles.inputForm} onPress={() => setCampoFechaActivo('vencimientoRevision')}>
            <Text style={{ color: vencimientoRevision ? '#FFFFFF' : '#64748B', fontSize: 13 }}>
              {vencimientoRevision || '📅 Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vencimiento SOAP (Selector) */}
        <View style={styles.cajaCampo}>
          <Text style={styles.labelCampo}>Vencimiento SOAP</Text>
          <TouchableOpacity style={styles.inputForm} onPress={() => setCampoFechaActivo('vencimientoSoap')}>
            <Text style={{ color: vencimientoSoap ? '#FFFFFF' : '#64748B', fontSize: 13 }}>
              {vencimientoSoap || '📅 Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Renderizado condicional del componente DateTimePicker */}
      {campoFechaActivo && (
        <DateTimePicker
          value={fechaTemporal}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={alCambiarFecha}
        />
      )}

      <TouchableOpacity
        style={[styles.botonEnviar, subiendo && { backgroundColor: '#334155' }]}
        onPress={handleEnviarDocumentacion}
        disabled={subiendo}
        activeOpacity={0.8}
      >
        {subiendo ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBotonEnviar}>TRANSMITIR ACREDITACIÓN A GARITA</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonCancelar} onPress={onVolver} disabled={subiendo}>
        <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>Volver al Menú Principal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#0B132B' },
  scroll: { padding: 20 },
  tarjetaHeader: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    marginBottom: 18,
  },
  badgeNorma: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  titulo: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  subtitulo: { color: '#CBD5E1', fontSize: 12, lineHeight: 18 },
  seccionCaja: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tituloSeccion: { color: '#38BDF8', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cajaCampo: { marginBottom: 12 },
  labelCampo: { color: '#CBD5E1', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  inputForm: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
    justifyContent: 'center',
  },
  botonEnviar: {
    backgroundColor: '#0284C7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  textoBotonEnviar: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  botonCancelar: { marginTop: 14, paddingVertical: 10, marginBottom: 30 },
});

