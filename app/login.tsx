import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Hotel } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
    } else if (isSignUp) {
      setError('');
      setIsSignUp(false);
    }

    setLoading(false);
  };

  return (
    <View className="flex-1 bg-slate-900">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-12">
          <View className="bg-blue-500 p-4 rounded-full mb-4">
            <Hotel size={48} color="white" />
          </View>
          <Text className="text-white text-4xl font-bold">MenuQR</Text>
          <Text className="text-slate-400 text-lg mt-2">Dashboard Hôtelier</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-white mb-2 font-medium">Email</Text>
            <TextInput
              className="bg-slate-800 text-white px-4 py-4 rounded-lg"
              placeholder="votre@email.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="text-white mb-2 font-medium">Mot de passe</Text>
            <TextInput
              className="bg-slate-800 text-white px-4 py-4 rounded-lg"
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? (
            <View className="bg-red-500/10 border border-red-500 px-4 py-3 rounded-lg">
              <Text className="text-red-500">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className="bg-blue-500 py-4 rounded-lg mt-6"
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                {isSignUp ? "S'inscrire" : 'Se connecter'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="mt-4"
          >
            <Text className="text-slate-400 text-center">
              {isSignUp
                ? 'Vous avez déjà un compte ? '
                : "Vous n'avez pas de compte ? "}
              <Text className="text-blue-500 font-semibold">
                {isSignUp ? 'Se connecter' : "S'inscrire"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
