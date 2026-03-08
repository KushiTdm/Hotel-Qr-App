import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Switch, Alert,
} from 'react-native';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Plus, UtensilsCrossed, Sparkles, MapPin, Info, Pencil, Trash2 } from 'lucide-react-native';

export type Category = 'room_service' | 'spa' | 'activities' | 'info';

export interface MenuItem {
  id: string;
  hotel_id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  is_active: boolean;
}

const CATEGORIES = [
  { key: 'room_service' as Category, label: 'Room Service', icon: UtensilsCrossed, color: '#f59e0b' },
  { key: 'spa' as Category, label: 'Spa', icon: Sparkles, color: '#a855f7' },
  { key: 'activities' as Category, label: 'Activités', icon: MapPin, color: '#22c55e' },
  { key: 'info' as Category, label: 'Infos', icon: Info, color: '#3b82f6' },
];

export default function MenuScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>('room_service');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: hotel } = await supabase
        .from('hotels').select('id').eq('user_id', user.id).maybeSingle();
      if (hotel) {
        setHotelId(hotel.id);
        const { data } = await supabase
          .from('menu_items').select('*').eq('hotel_id', hotel.id).order('created_at');
        setItems((data as MenuItem[]) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [user]));

  const toggleActive = async (item: MenuItem) => {
    await supabase.from('menu_items').update({ is_active: !item.is_active }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
  };

  const deleteItem = (item: MenuItem) => {
    Alert.alert('Supprimer', `Supprimer "${item.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          await supabase.from('menu_items').delete().eq('id', item.id);
          setItems(prev => prev.filter(i => i.id !== item.id));
        }
      }
    ]);
  };

  const filtered = items.filter(i => i.category === activeCategory);
  const cat = CATEGORIES.find(c => c.key === activeCategory)!;

  if (loading) return (
    <View className="flex-1 bg-slate-900 items-center justify-center">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <View className="px-6 pt-14 pb-4">
        <Text className="text-white text-3xl font-bold">Menu Digital</Text>
        <Text className="text-slate-400 mt-1">Gérez vos sections</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-4" style={{ maxHeight: 52 }}>
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          const active = c.key === activeCategory;
          return (
            <TouchableOpacity
              key={c.key}
              onPress={() => setActiveCategory(c.key)}
              className={`flex-row items-center mr-3 px-4 py-2 rounded-full border ${active ? 'bg-blue-500 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
            >
              <Icon size={14} color={active ? 'white' : '#64748b'} />
              <Text className={`ml-2 text-sm font-medium ${active ? 'text-white' : 'text-slate-400'}`}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#3b82f6" />}
      >
        {filtered.length === 0 ? (
          <View className="items-center py-20">
            <cat.icon size={48} color="#334155" />
            <Text className="text-slate-500 text-lg mt-4 font-medium">Aucun item</Text>
            <Text className="text-slate-600 text-sm mt-1 text-center">Appuyez sur + pour ajouter</Text>
          </View>
        ) : (
          filtered.map(item => (
            <View key={item.id} className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-white font-semibold text-base">{item.name}</Text>
                  {!!item.description && (
                    <Text className="text-slate-400 text-sm mt-1" numberOfLines={2}>{item.description}</Text>
                  )}
                  {item.price > 0 && (
                    <Text className="text-blue-400 font-semibold mt-2">{item.price.toFixed(2)} €</Text>
                  )}
                </View>
                <Switch
                  value={item.is_active}
                  onValueChange={() => toggleActive(item)}
                  trackColor={{ false: '#334155', true: '#3b82f6' }}
                  thumbColor="white"
                />
              </View>
              <View className="flex-row mt-3 pt-3 border-t border-slate-700 items-center">
                <TouchableOpacity
                  className="flex-row items-center mr-4"
                  onPress={() => router.push({ pathname: '/item-form', params: { itemId: item.id, hotelId: hotelId!, category: activeCategory } } as unknown as Href)}
                >
                  <Pencil size={14} color="#3b82f6" />
                  <Text className="text-blue-400 text-sm ml-1 font-medium">Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center" onPress={() => deleteItem(item)}>
                  <Trash2 size={14} color="#ef4444" />
                  <Text className="text-red-400 text-sm ml-1 font-medium">Supprimer</Text>
                </TouchableOpacity>
                <View className="ml-auto">
                  <Text className={`text-xs font-medium px-2 py-1 rounded-full ${item.is_active ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                    {item.is_active ? 'Visible' : 'Masqué'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View className="h-6" />
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/item-form', params: { hotelId: hotelId!, category: activeCategory } } as unknown as Href)}
        className="absolute bottom-8 right-6 bg-blue-500 w-14 h-14 rounded-full items-center justify-center"
        style={{ elevation: 8 }}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}