import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LogOut, Hotel, QrCode, Pencil, Check, X } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [hotelName, setHotelName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchHotel = async () => {
    if (!user) return;
    const { data } = await supabase.from('hotels').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setHotelName(data.name);
      setNameInput(data.name);
      setQrUrl(data.qr_code_url || '');
      setHotelId(data.id);
    }
  };

  useFocusEffect(useCallback(() => { fetchHotel(); }, [user]));

  const saveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    await supabase.from('hotels').update({ name: nameInput.trim(), updated_at: new Date().toISOString() }).eq('id', hotelId);
    setHotelName(nameInput.trim());
    setEditingName(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: async () => { await signOut(); router.replace('/login'); } }
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="px-6 pt-14 pb-8">
        <Text className="text-white text-3xl font-bold mb-1">Paramètres</Text>
        <Text className="text-slate-400 mb-8">Gérez votre compte</Text>

        <View className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-500/10 p-2 rounded-xl">
              <Hotel size={20} color="#3b82f6" />
            </View>
            <Text className="text-slate-400 text-sm ml-3 font-medium">Nom de l'hôtel</Text>
          </View>
          {editingName ? (
            <View>
              <TextInput
                className="bg-slate-700 text-white px-4 py-3 rounded-xl mb-3 border border-slate-600"
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                placeholderTextColor="#475569"
              />
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={saveName} disabled={saving} className="flex-1 bg-blue-500 py-3 rounded-xl flex-row items-center justify-center">
                  {saving ? <ActivityIndicator size="small" color="white" /> : <><Check size={16} color="white" /><Text className="text-white font-semibold ml-2">Sauvegarder</Text></>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setNameInput(hotelName); }} className="bg-slate-700 px-4 py-3 rounded-xl">
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-lg font-semibold flex-1">{hotelName || '—'}</Text>
              <TouchableOpacity onPress={() => setEditingName(true)} className="p-2">
                <Pencil size={18} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="bg-green-500/10 p-2 rounded-xl">
              <QrCode size={20} color="#22c55e" />
            </View>
            <Text className="text-slate-400 text-sm ml-3 font-medium">Lien menu QR</Text>
          </View>
          <Text className="text-white text-sm font-mono" numberOfLines={3}>{qrUrl || 'Non configuré'}</Text>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex-row items-center justify-center mt-8"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-400 font-semibold ml-2">Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}