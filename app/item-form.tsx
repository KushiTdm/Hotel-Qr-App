import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Check } from 'lucide-react-native';

type Category = 'room_service' | 'spa' | 'activities' | 'info';

const CATEGORY_LABELS: Record<Category, string> = {
  room_service: 'Room Service',
  spa: 'Spa & Bien-être',
  activities: 'Activités',
  info: 'Infos Pratiques',
};

export default function ItemFormScreen() {
  const router = useRouter();
  const { itemId, hotelId, category } = useLocalSearchParams<{ itemId?: string; hotelId: string; category: Category }>();
  const isEdit = !!itemId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      supabase.from('menu_items').select('*').eq('id', itemId).single().then(({ data }) => {
        if (data) {
          setName(data.name);
          setDescription(data.description || '');
          setPrice(data.price > 0 ? String(data.price) : '');
          setIsActive(data.is_active);
        }
        setLoading(false);
      });
    }
  }, [itemId]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Le nom est obligatoire'); return; }
    setSaving(true);
    setError('');
    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      is_active: isActive,
      category,
      hotel_id: hotelId,
      updated_at: new Date().toISOString(),
    };
    if (isEdit) {
      const { error: e } = await supabase.from('menu_items').update(payload).eq('id', itemId);
      if (e) setError(e.message); else router.back();
    } else {
      const { error: e } = await supabase.from('menu_items').insert([payload]);
      if (e) setError(e.message); else router.back();
    }
    setSaving(false);
  };

  if (loading) return (
    <View className="flex-1 bg-slate-900 items-center justify-center">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-slate-900">
      <View className="flex-row items-center px-6 pt-14 pb-4 border-b border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
          <ChevronLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">{isEdit ? 'Modifier' : 'Nouvel item'}</Text>
          <Text className="text-slate-400 text-sm">{CATEGORY_LABELS[category]}</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center">
          {saving
            ? <ActivityIndicator size="small" color="white" />
            : <><Check size={16} color="white" /><Text className="text-white font-semibold ml-1">Sauvegarder</Text></>
          }
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {!!error && (
          <View className="bg-red-500/10 border border-red-500 px-4 py-3 rounded-xl mb-4">
            <Text className="text-red-400">{error}</Text>
          </View>
        )}
        <View className="mb-5">
          <Text className="text-slate-300 font-medium mb-2">Nom *</Text>
          <TextInput
            className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700"
            placeholder="Ex: Petit-déjeuner continental"
            placeholderTextColor="#475569"
            value={name}
            onChangeText={setName}
          />
        </View>
        <View className="mb-5">
          <Text className="text-slate-300 font-medium mb-2">Description</Text>
          <TextInput
            className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700"
            placeholder="Décrivez cet item..."
            placeholderTextColor="#475569"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />
        </View>
        <View className="mb-5">
          <Text className="text-slate-300 font-medium mb-2">Prix (€) <Text className="text-slate-500 font-normal">— laisser vide si gratuit</Text></Text>
          <TextInput
            className="bg-slate-800 text-white px-4 py-4 rounded-xl border border-slate-700"
            placeholder="0.00"
            placeholderTextColor="#475569"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>
        <View className="bg-slate-800 rounded-xl px-4 py-4 border border-slate-700 flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-white font-medium">Visible par le client</Text>
            <Text className="text-slate-400 text-sm mt-1">Afficher dans le menu public</Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#334155', true: '#3b82f6' }} thumbColor="white" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}