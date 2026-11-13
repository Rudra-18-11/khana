import * as Location from 'expo-location';
import { Address } from '../types';

export async function requestAndGetCurrentLocation(): Promise<{
  coords: { latitude: number; longitude: number };
  detectedAddress: Partial<Address>;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return {
        coords: { latitude: 12.9716, longitude: 77.5946 },
        detectedAddress: {
          label: 'Home',
          addressLine1: 'Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const [geocoded] = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    return {
      coords: {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      },
      detectedAddress: {
        label: 'Other',
        addressLine1: `${geocoded?.streetNumber || ''} ${geocoded?.street || geocoded?.name || 'Current Location'}`.trim(),
        addressLine2: geocoded?.district || geocoded?.subregion || '',
        city: geocoded?.city || 'Bengaluru',
        state: geocoded?.region || 'Karnataka',
        pincode: geocoded?.postalCode || '560001',
      },
    };
  } catch (error) {
    console.warn('Location detection fallback:', error);
    return {
      coords: { latitude: 12.9716, longitude: 77.5946 },
      detectedAddress: {
        label: 'Home',
        addressLine1: 'Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
    };
  }
}
