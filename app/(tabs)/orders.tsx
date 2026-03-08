import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Clock, Check, X } from 'lucide-react-native';

interface Order {
  id: string;
  item_name: string;
  guest_name: string;
  room_number: string;
  note: string;
  status: 'pending' | 'done' | 'cancelled';
  created_at: string;
}

const STATUS = {
  pending:   { label: 'En attente', color: '#f59e0b', bg: '#fef3c720' },
  done:      { label: 'Traité',     color: '#22c55e', bg: '#dcfce720' },
  cancelled: { label: 'Annulé',    color: '#ef4444', bg: '#fee2e220' },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const { user } = useAuth();

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data: hotel } = await supabase
        .from('hotels').select('id').eq('user_id', user.id).maybeSingle();
      if (!hotel) return;

      const query = supabase
        .from('orders')
        .select('*')
        .eq('hotel_id', hotel.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') query.eq('status', filter);

      const { data } = await query;
      setOrders((data as Order[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, [user, filter]));

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const pending = orders.filter(o => o.status === 'pending').length;

  if (loading) return (
    <View className="flex-1 bg-slate-900 items-center justify-center">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <View className="px-6 pt-14 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white text-3xl font-bold">Commandes</Text>
          {pending > 0 && (
            <View className="bg-red-500 px-3 py-1 rounded-full">
              <Text className="text-white text-sm font-bold">{pending} en attente</Text>
            </View>
          )}
        </View>
        <Text className="text-slate-400">Gérez les demandes clients</Text>
      </View>

      {/* Filtres */}
      <View className="flex-row px-6 mb-4 gap-2">
        {[
          { key: 'pending', label: 'En attente' },
          { key: 'all', label: 'Toutes' },
          { key: 'done', label: 'Traitées' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-full border ${filter === f.key ? 'bg-blue-500 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
          >
            <Text className={`text-sm font-medium ${filter === f.key ? 'text-white' : 'text-slate-400'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#3b82f6" />}
      >
        {orders.length === 0 ? (
          <View className="items-center py-20">
            <ShoppingBag size={48} color="#334155" />
            <Text className="text-slate-500 text-lg mt-4 font-medium">Aucune commande</Text>
            <Text className="text-slate-600 text-sm mt-1">Les nouvelles commandes apparaîtront ici</Text>
          </View>
        ) : (
          orders.map(order => {
            const s = STATUS[order.status];
            return (
              <View key={order.id} className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">{order.item_name}</Text>
                    <Text className="text-slate-400 text-sm mt-1">
                      {order.guest_name} · Chambre {order.room_number}
                    </Text>
                    {!!order.note && (
                      <Text className="text-slate-500 text-xs mt-1 italic">"{order.note}"</Text>
                    )}
                  </View>
                  <View className="items-end gap-2">
                    <View style={{ backgroundColor: s.bg, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: s.color, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Clock size={11} color="#475569" />
                      <Text className="text-slate-500 text-xs">{formatTime(order.created_at)}</Text>
                    </View>
                  </View>
                </View>

                {order.status === 'pending' && (
                  <View className="flex-row gap-2 pt-3 border-t border-slate-700">
                    <TouchableOpacity
                      onPress={() => updateStatus(order.id, 'done')}
                      className="flex-1 flex-row items-center justify-center bg-green-500/10 border border-green-500/30 py-2 rounded-xl gap-2"
                    >
                      <Check size={15} color="#22c55e" />
                      <Text className="text-green-400 text-sm font-medium">Traité</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateStatus(order.id, 'cancelled')}
                      className="flex-1 flex-row items-center justify-center bg-red-500/10 border border-red-500/30 py-2 rounded-xl gap-2"
                    >
                      <X size={15} color="#ef4444" />
                      <Text className="text-red-400 text-sm font-medium">Annuler</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}