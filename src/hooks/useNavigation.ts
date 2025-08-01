import { useNavigation as useReactNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const useNavigation = () => useReactNavigation<NavigationProp>();
