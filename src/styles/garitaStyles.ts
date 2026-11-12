import { StyleSheet, Platform, StatusBar } from 'react-native';
import { theme } from './theme';

export const garitaStyles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContenido: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 16,
    paddingBottom: 40,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface,
  },
  tituloCabecera: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtituloCabecera: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  filaAccionesCabecera: {
    flexDirection: 'row',
    gap: 8,
  },
  botonCambiarGarita: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textoBotonGarita: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  botonVolver: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textoBotonVolver: {
    color: theme.colors.primaryLight,
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Tarjeta de Registro de Garita
  tarjetaRegistroGarita: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    marginBottom: 20,
    elevation: 6,
  },
  tituloRegistro: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtituloRegistro: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  campoFormulario: {
    marginBottom: 14,
  },
  labelFormulario: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputFormulario: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 14,
    fontWeight: '600',
  },
  filaBotonesOpcion: {
    flexDirection: 'row',
    gap: 8,
  },
  btnOpcionTurno: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  btnOpcionTurnoActivo: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  textoBtnOpcion: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  textoBtnOpcionActivo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  botonIniciarGarita: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotonIniciarGarita: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Banner Informativo de Garita Activa
  bannerInfoGarita: {
    backgroundColor: '#0F2942',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreTerminal: {
    color: '#E0F2FE',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detalleTerminal: {
    color: '#7DD3FC',
    fontSize: 11,
    marginTop: 2,
  },

  // Selector de Pestañas
  contenedorPestanas: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActivo: {
    backgroundColor: '#0284C7',
  },
  textoTab: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  textoTabActivo: {
    color: '#FFFFFF',
  },

  // Métricas Rápidas
  filaMetricas: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tarjetaMetrica: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  labelMetrica: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  valorMetrica: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },

  // Lista de Conductores / Flota
  tarjetaItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filaItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patenteBadge: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textoPatente: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  tagEstadoEnRuta: {
    backgroundColor: '#14532D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagEstadoGarita: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagEstadoFuera: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  textoTagEstado: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  nombreConductorItem: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  filaDetallesMóvil: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: theme.colors.background,
  },
  textoDetalleMóvil: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  // Estilos de Reportes y Novedades
  tarjetaReporte: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeTipoReporte: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeReportePasajero: {
    backgroundColor: '#7F1D1D',
  },
  badgeReporteConductor: {
    backgroundColor: '#B45309',
  },
  badgeReporteOperacional: {
    backgroundColor: '#1E3A8A',
  },
  textoBadgeReporte: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tituloReporte: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  descripcionReporte: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  footerReporte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: theme.colors.background,
  },
  fechaReporte: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  autorReporte: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },

  // Botón Agregar Reporte
  botonNuevoReporte: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: 16,
  },
  textoBotonNuevoReporte: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});