import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { QrCode, UtensilsCrossed, Sparkles, MapPin, Info, ArrowRight, Hotel, ShoppingBag } from 'lucide-react-native';

// ⚠️ Change cette URL quand tu déploies sur Vercel
const BASE_URL = 'https://menuqr.app';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface Stats {
  hotelId: string;
  hotelName: string;
  qrCodeUrl: string;
  counts: { room_service: number; spa: number; activities: number; info: number };
  totalActive: number;
  totalItems: number;
  pendingOrders: number;
}

const SECTIONS = [
  { key: 'room_service', label: 'Room Service', icon: UtensilsCrossed, color: '#f59e0b' },
  { key: 'spa',          label: 'Spa & Bien-être', icon: Sparkles, color: '#a855f7' },
  { key: 'activities',   label: 'Activités', icon: MapPin, color: '#22c55e' },
  { key: 'info',         label: 'Infos Pratiques', icon: Info, color: '#3b82f6' },
];

async function getOrCreateHotel(userId: string) {
  const { data: existing } = await supabase
    .from('hotels')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing;

  const { data: newHotel, error } = await supabase
    .from('hotels')
    .insert({ user_id: userId, name: 'Mon Hôtel', qr_code_url: '' })
    .select()
    .single();

  if (error || !newHotel) {
    console.error('Erreur création hôtel:', error?.message);
    return null;
  }

  const qrUrl = `${BASE_URL}/menu/${newHotel.id}`;
  await supabase.from('hotels').update({ qr_code_url: qrUrl }).eq('id', newHotel.id);
  newHotel.qr_code_url = qrUrl;

  return newHotel;
}

async function registerPushToken(hotelId: string) {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await supabase.from('hotels').update({ push_token: token }).eq('id', hotelId);
  } catch (e) {
    console.log('Push token error:', e);
  }
}

export default function HomeScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchStats = async () => {
    if (!user) return;
    try {
      const hotel = await getOrCreateHotel(user.id);
      if (!hotel) return;

      await registerPushToken(hotel.id);

      const [itemsRes, ordersRes] = await Promise.all([
        supabase.from('menu_items').select('category, is_active').eq('hotel_id', hotel.id),
        supabase.from('orders').select('id').eq('hotel_id', hotel.id).eq('status', 'pending'),
      ]);

      const counts = { room_service: 0, spa: 0, activities: 0, info: 0 };
      let totalActive = 0;
      itemsRes.data?.forEach(i => {
        counts[i.category as keyof typeof counts]++;
        if (i.is_active) totalActive++;
      });

      setStats({
        hotelId: hotel.id,
        hotelName: hotel.name,
        qrCodeUrl: hotel.qr_code_url,
        counts,
        totalActive,
        totalItems: itemsRes.data?.length || 0,
        pendingOrders: ordersRes.data?.length || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStats(); }, [user]));

  // Écoute les nouvelles commandes en temps réel
  useEffect(() => {
    if (!stats?.hotelId) return;

    const channel = supabase
      .channel(`orders-${stats.hotelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `hotel_id=eq.${stats.hotelId}`,
      }, (payload) => {
        // Notification locale
        Notifications.scheduleNotificationAsync({
          content: {
            title: '🛎️ Nouvelle commande !',
            body: `Chambre ${payload.new.room_number} — ${payload.new.item_name}`,
            sound: 'default',
          },
          trigger: null,
        });
        // Met à jour le compteur
        setStats(prev => prev ? { ...prev, pendingOrders: prev.pendingOrders + 1 } : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [stats?.hotelId]);

  if (loading) return (
    <View className="flex-1 bg-slate-900 items-center justify-center">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor="#3b82f6" />}
    >
      <View className="px-6 pt-14 pb-8">

        {/* Header */}
        <View className="mb-8">
          <View className="flex-row items-center mb-1">
            <Hotel size={24} color="#3b82f6" />
            <Text className="text-white text-2xl font-bold ml-2">{stats?.hotelName || 'Mon Hôtel'}</Text>
          </View>
          <Text className="text-slate-400">Bienvenue sur votre dashboard</Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Text className="text-slate-400 text-xs mb-1 font-medium">Items actifs</Text>
            <Text className="text-white text-3xl font-bold">{stats?.totalActive || 0}</Text>
            <Text className="text-slate-500 text-xs mt-1">sur {stats?.totalItems || 0} total</Text>
          </View>
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Text className="text-slate-400 text-xs mb-1 font-medium">Sections</Text>
            <Text className="text-white text-3xl font-bold">4</Text>
            <Text className="text-slate-500 text-xs mt-1">configurées</Text>
          </View>
        </View>

        {/* Commandes en attente */}
        {(stats?.pendingOrders ?? 0) > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/orders')}
            className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 mb-6 flex-row items-center"
          >
            <View className="bg-amber-500/20 p-2 rounded-xl mr-3">
              <ShoppingBag size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-amber-400 font-semibold">
                {stats?.pendingOrders} commande{(stats?.pendingOrders ?? 0) > 1 ? 's' : ''} en attente
              </Text>
              <Text className="text-amber-500/70 text-xs mt-0.5">Appuyez pour voir les détails</Text>
            </View>
            <ArrowRight size={18} color="#f59e0b" />
          </TouchableOpacity>
        )}

        {/* Sections */}
        <Text className="text-white font-bold text-lg mb-3">Vos sections</Text>
        <View className="mb-6">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const count = stats?.counts[s.key as keyof typeof stats.counts] || 0;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => router.push('/(tabs)/menu')}
                className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700 flex-row items-center"
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: s.color + '20' }}>
                  <Icon size={20} color={s.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{s.label}</Text>
                  <Text className="text-slate-400 text-sm">{count} item{count > 1 ? 's' : ''}</Text>
                </View>
                <ArrowRight size={18} color="#475569" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* QR Link */}
        <View className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5">
          <View className="flex-row items-center mb-3">
            <QrCode size={20} color="#3b82f6" />
            <Text className="text-blue-400 font-semibold ml-2">Lien menu client</Text>
          </View>
          <Text className="text-slate-300 text-xs font-mono mb-3" numberOfLines={2}>
            {stats?.qrCodeUrl}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            className="bg-blue-500/20 py-2 rounded-xl items-center"
          >
            <Text className="text-blue-400 text-sm font-medium">Gérer dans Paramètres →</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}