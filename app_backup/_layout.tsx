import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Provider } from 'react-redux';
import { Colors } from '../src/constants/theme';
import { AppNavigator } from '../src/navigation/AppNavigator';
import { store } from '../src/redux/store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <AppNavigator />
    </Provider>
  );
}
