import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const loginStyles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContenido: {
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    marginBottom: theme.spacing.md,
  },
  iconoLogo: {
    fontSize: 32,
  },
  tituloApp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: 1.5,
  },
  subtituloApp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  cajaTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  botonTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  botonTabActivo: {
    backgroundColor: theme.colors.primary,
  },
  textoTab: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  textoTabActivo: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  tarjetaForm: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 6,
  },
  campoForm: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 14,
  },
  contenedorInputPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  botonOjo: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPrincipal: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotonPrincipal: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 26,
    alignItems: 'center',
  },
  textoFooter: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  subTextoFooter: {
    color: '#475569',
    fontSize: 11,
    marginTop: 2,
  },
});