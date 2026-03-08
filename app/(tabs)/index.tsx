import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { QrCode, UtensilsCrossed, TrendingUp, Hotel } from 'lucide-react-native';

interface Stats {
  activeItems: number;
  totalItems: number;
  hotelName: string;
  qrCodeUrl: string;
}

export default function HomeScreen() {
  const [stats, setStats] = useState<Stats>({
    activeItems: 0,
    totalItems: 0,
    hotelName: '',
    qrCodeUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: hotels } = await supabase
        .from('hotels')
        .select('id, name, qr_code_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (hotels) {
        const { data: items } = await supabase
          .from('menu_items')
          .select('is_active')
          .eq('hotel_id', hotels.id);

        const activeItems = items?.filter((item) => item.is_active).length || 0;
        const totalItems = items?.length || 0;

        setStats({
          activeItems,
          totalItems,
          hotelName: hotels.name,
          qrCodeUrl: hotels.qr_code_url || '',
        });
      } else {
        const { data: newHotel } = await supabase
          .from('hotels')
          .insert([
            {
              user_id: user.id,
              name: 'Mon Hôtel',
              qr_code_url: `https://menuqr.app/menu/${user.id}`,
            },
          ])
          .select()
          .single();

        if (newHotel) {
          setStats({
            activeItems: 0,
            totalItems: 0,
            hotelName: newHotel.name,
            qrCodeUrl: newHotel.qr_code_url,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchStats();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }>
      <View className="px-6 py-8">
        <View className="mb-8">
          <View className="flex-row items-center mb-2">
            <Hotel size={32} color="#3b82f6" />
            <Text className="text-white text-3xl font-bold ml-3">{stats.hotelName}</Text>
          </View>
          <Text className="text-slate-400 text-lg">Dashboard MenuQR</Text>
        </View>

        <View className="space-y-4">
          <View className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <View className="flex-row items-center mb-4">
              <View className="bg-green-500/10 p-3 rounded-xl">
                <UtensilsCrossed size={24} color="#22c55e" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-slate-400 text-sm">Items Actifs</Text>
                <Text className="text-white text-3xl font-bold">{stats.activeItems}</Text>
              </View>
            </View>
            <View className="border-t border-slate-700 pt-3 mt-2">
              <Text className="text-slate-500 text-sm">
                Sur un total de {stats.totalItems} items
              </Text>
            </View>
          </View>

          <View className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <View className="flex-row items-center mb-4">
              <View className="bg-blue-500/10 p-3 rounded-xl">
                <TrendingUp size={24} color="#3b82f6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-slate-400 text-sm">Total Items</Text>
                <Text className="text-white text-3xl font-bold">{stats.totalItems}</Text>
              </View>
            </View>
            <View className="border-t border-slate-700 pt-3 mt-2">
              <Text className="text-slate-500 text-sm">Dans votre menu</Text>
            </View>
          </View>

          <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 mt-4">
            <View className="flex-row items-center mb-4">
              <View className="bg-white/20 p-3 rounded-xl">
                <QrCode size={28} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white text-xl font-bold">Menu Client</Text>
                <Text className="text-blue-100 text-sm mt-1">Scannez pour accéder</Text>
              </View>
            </View>

            {stats.qrCodeUrl ? (
              <View className="bg-white/10 rounded-xl p-4 mt-2">
                <Text className="text-white text-xs font-mono" numberOfLines={2}>
                  {stats.qrCodeUrl}
                </Text>
              </View>
            ) : (
              <Text className="text-blue-100 text-sm">Configuration du QR code en cours...</Text>
            )}
          </View>

          <TouchableOpacity className="bg-blue-500 py-4 rounded-xl mt-4">
            <Text className="text-white text-center font-semibold text-lg">
              Gérer les Items
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
