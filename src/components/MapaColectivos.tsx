import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ColectivoRuta } from '../screens/PasajeroScreen';

export interface MapaColectivosRef {
  centrarEnCoordenada: (lat: number, lng: number) => void;
}

export interface RutaOficialFlex {
  id?: string | number;
  nombre?: string;
  folio?: string | number;
  centro?: { lat: number; lng: number };
  trazadoIda?: any[];
  trazadoRegreso?: any[];
}

interface Props {
  colectivos: ColectivoRuta[];
  rutaSeleccionada: RutaOficialFlex;
  sentidoTrazado: 'ida' | 'regreso' | 'ambos';
  ubicacionInicial: { lat: number; lng: number };
  onSeleccionarColectivo: (id: string) => void;
}

const MapaColectivos = forwardRef<MapaColectivosRef, Props>(
  ({ colectivos = [], rutaSeleccionada, sentidoTrazado = 'ida', ubicacionInicial, onSeleccionarColectivo }, ref) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      centrarEnCoordenada: (lat: number, lng: number) => {
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          1000
        );
      },
    }));

    const centroLat = rutaSeleccionada?.centro?.lat ?? -33.5186;
    const centroLng = rutaSeleccionada?.centro?.lng ?? -70.7601;

    // Centrar automáticamente el mapa cuando cambie la ruta seleccionada
    useEffect(() => {
      if (
        rutaSeleccionada?.trazadoIda &&
        rutaSeleccionada.trazadoIda.length > 0 &&
        mapRef.current
      ) {
        const primerPunto = rutaSeleccionada.trazadoIda[0];
        if (primerPunto?.latitude && primerPunto?.longitude) {
          mapRef.current.animateToRegion(
            {
              latitude: primerPunto.latitude,
              longitude: primerPunto.longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            },
            800
          );
        }
      }
    }, [rutaSeleccionada]);

    const puntosIda = Array.isArray(rutaSeleccionada?.trazadoIda) ? rutaSeleccionada.trazadoIda : [];
    const puntosRegreso = Array.isArray(rutaSeleccionada?.trazadoRegreso) ? rutaSeleccionada.trazadoRegreso : [];

    const ubiLat = ubicacionInicial?.lat ?? centroLat;
    const ubiLng = ubicacionInicial?.lng ?? centroLng;

    return (
      <View style={styles.wrapper}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.mapaNativo}
          initialRegion={{
            latitude: centroLat,
            longitude: centroLng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Trazado de Ida */}
          {(sentidoTrazado === 'ida' || sentidoTrazado === 'ambos') && puntosIda.length > 0 && (
            <Polyline
              coordinates={puntosIda}
              strokeColor="#0284C7"
              strokeWidth={6}
            />
          )}

          {/* Trazado de Regreso */}
          {(sentidoTrazado === 'regreso' || sentidoTrazado === 'ambos') && puntosRegreso.length > 0 && (
            <Polyline
              coordinates={puntosRegreso}
              strokeColor="#F59E0B"
              strokeWidth={6}
              lineDashPattern={sentidoTrazado === 'ambos' ? [8, 8] : undefined}
            />
          )}

          {/* Marcador de la Ubicación del Usuario */}
          <Marker
            coordinate={{ latitude: ubiLat, longitude: ubiLng }}
            title="Tu Ubicación"
            pinColor="#38BDF8"
          />

          {/* Marcadores de la Flota de Colectivos */}
          {Array.isArray(colectivos) &&
            colectivos.map((c) => {
              const colorPin = c.cupos > 0 ? '#10B981' : '#EF4444';
              return (
                <Marker
                  key={c.id}
                  coordinate={{ latitude: c.lat, longitude: c.lng }}
                  title={`Móvil ${c.patente || ''}`}
                  description={`Chofer: ${c.conductorNombre || ''} (${c.cupos > 0 ? `${c.cupos} libres` : 'Lleno'})`}
                  pinColor={colorPin}
                  onPress={() => onSeleccionarColectivo(c.id)}
                />
              );
            })}
        </MapView>

        {/* Leyenda flotante sobre el mapa */}
        <View style={styles.leyendaMapa}>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11 }}>🔵 <Text style={{ fontWeight: 'bold' }}>Ida:</Text> ({puntosIda.length} pts)</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11 }}>🟡 <Text style={{ fontWeight: 'bold' }}>Regreso:</Text> ({puntosRegreso.length} pts)</Text>
          </View>
        </View>
      </View>
    );
  }
);

export default MapaColectivos;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#0B132B',
  },
  mapaNativo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  leyendaMapa: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
});

