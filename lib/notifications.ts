import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(hotelId: string) {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Sauvegarde le token dans Supabase
  await supabase.from('hotels').update({ push_token: token }).eq('id', hotelId);

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('orders', {
      name: 'Nouvelles commandes',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }

  return token;
}