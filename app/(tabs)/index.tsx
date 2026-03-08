import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { QrCode, UtensilsCrossed, Sparkles, MapPin, Info, ArrowRight, Hotel } from 'lucide-react-native';

interface Stats {
  hotelName: string;
  qrCodeUrl: string;
  counts: { room_service: number; spa: number; activities: number; info: number };
  totalActive: number;
  totalItems: number;
}

const SECTIONS = [
  { key: 'room_service', label: 'Room Service', icon: UtensilsCrossed, color: '#f59e0b' },
  { key: 'spa', label: 'Spa & Bien-être', icon: Sparkles, color: '#a855f7' },
  { key: 'activities', label: 'Activités', icon: MapPin, color: '#22c55e' },
  { key: 'info', label: 'Infos Pratiques', icon: Info, color: '#3b82f6' },
];

export default function HomeScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchStats = async () => {
    if (!user) return;
    try {
      const { data: hotel } = await supabase
        .from('hotels').select('id, name, qr_code_url').eq('user_id', user.id).maybeSingle();

      if (hotel) {
        const { data: items } = await supabase
          .from('menu_items').select('category, is_active').eq('hotel_id', hotel.id);

        const counts = { room_service: 0, spa: 0, activities: 0, info: 0 };
        let totalActive = 0;
        items?.forEach(i => {
          counts[i.category as keyof typeof counts] = (counts[i.category as keyof typeof counts] || 0) + 1;
          if (i.is_active) totalActive++;
        });

        setStats({
          hotelName: hotel.name,
          qrCodeUrl: hotel.qr_code_url || '',
          counts,
          totalActive,
          totalItems: items?.length || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStats(); }, [user]));

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
        <View className="mb-8">
          <View className="flex-row items-center mb-1">
            <Hotel size={24} color="#3b82f6" />
            <Text className="text-white text-2xl font-bold ml-2">{stats?.hotelName || 'Mon Hôtel'}</Text>
          </View>
          <Text className="text-slate-400">Bienvenue sur votre dashboard</Text>
        </View>

        <View className="flex-row gap-3 mb-6">
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

        <Text className="text-white font-bold text-lg mb-3">Vos sections</Text>
        <View className="mb-6">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const count = stats?.counts[s.key as keyof typeof stats.counts] || 0;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => router.push('/menu' as Href)}
                className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700 flex-row items-center"
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: s.color + '20' }}>
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

        <View className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5">
          <View className="flex-row items-center mb-3">
            <QrCode size={20} color="#3b82f6" />
            <Text className="text-blue-400 font-semibold ml-2">Lien menu client</Text>
          </View>
          <Text className="text-slate-300 text-xs font-mono mb-3" numberOfLines={2}>{stats?.qrCodeUrl}</Text>
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