import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const appStyles = StyleSheet.create({
  pantallaCarga: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});