import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, error, ...props }) => {
  return (
    <View className="mb-4 w-full">
      <Text className="text-sm font-medium text-gray-300 mb-1.5">{label}</Text>
      <TextInput
        className={`w-full px-4 py-3 bg-zinc-900 border text-white rounded-xl text-base ${
          error ? 'border-red-500' : 'border-zinc-800 focus:border-emerald-500'
        }`}
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {error && <Text className="text-xs text-red-500 mt-1 pl-1">{error}</Text>}
    </View>
  );
};