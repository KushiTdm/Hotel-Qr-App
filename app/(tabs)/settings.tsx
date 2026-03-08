import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Bell, Shield } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="px-6 py-8">
        <Text className="text-white text-3xl font-bold mb-2">Paramètres</Text>
        <Text className="text-slate-400 text-lg mb-8">Gérez votre compte</Text>

        <View className="space-y-4">
          <View className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <View className="flex-row items-center mb-4">
              <View className="bg-blue-500/10 p-3 rounded-xl">
                <User size={24} color="#3b82f6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-slate-400 text-sm">Email</Text>
                <Text className="text-white text-base font-medium">{user?.email}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <View className="flex-row items-center">
              <View className="bg-purple-500/10 p-3 rounded-xl">
                <Bell size={24} color="#a855f7" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white text-base font-medium">Notifications</Text>
                <Text className="text-slate-400 text-sm">Gérer vos alertes</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <View className="flex-row items-center">
              <View className="bg-green-500/10 p-3 rounded-xl">
                <Shield size={24} color="#22c55e" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white text-base font-medium">Sécurité</Text>
                <Text className="text-slate-400 text-sm">Modifier le mot de passe</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-red-500/10 border border-red-500 rounded-2xl p-5 mt-8"
            onPress={handleSignOut}>
            <View className="flex-row items-center justify-center">
              <LogOut size={24} color="#ef4444" />
              <Text className="text-red-500 text-base font-semibold ml-3">Se déconnecter</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
