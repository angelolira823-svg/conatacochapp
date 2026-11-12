import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const adminStyles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContenido: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface,
  },
  tituloHeader: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtituloHeader: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  botonCerrarSesion: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textoCerrarSesion: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  seccionSupervision: {
    marginBottom: theme.spacing.xl,
  },
  tituloSeccion: {
    color: theme.colors.primaryLight,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filaBotonesSupervision: {
    flexDirection: 'row',
    gap: 8,
  },
  botonVista: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconoVista: {
    fontSize: 20,
    marginBottom: 4,
  },
  textoBotonVista: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  seccionGestion: {
    flex: 1,
  },
  contenedorBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    marginBottom: theme.spacing.md,
    height: 46,
  },
  iconoLupa: {
    fontSize: 16,
    marginRight: 8,
  },
  inputBuscador: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  botonLimpiar: {
    padding: 6,
  },
  textoLimpiar: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  contadorResultados: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: theme.spacing.md,
  },
  tarjetaUsuario: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cabeceraTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nombreUsuario: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  correoUsuario: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  badgeRol: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  textoBadgeRol: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cajaAsignarRoles: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  labelAsignar: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '600',
  },
  filaBotonesAsignar: {
    flexDirection: 'row',
    gap: 8,
  },
  btnRol: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  btnRolActivo: {
    borderColor: theme.colors.primaryLight,
  },
  textoBtnRol: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sinResultados: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  textoSinResultados: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});

