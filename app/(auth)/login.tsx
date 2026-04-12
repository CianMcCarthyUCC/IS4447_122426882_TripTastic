import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useToast, useHaptics } from '@/hooks';
import { FormField } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer, AuthHero, AuthFooter } from '@/components/layout';
import { SharedStyles } from '@/constants';
import { validateLoginForm } from '@/utils/validation';

/**
 * Login screen — email + password form with link to register.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const validationError = validateLoginForm({ email, password });
    if (validationError) {
      setError(validationError);
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);

    const authError = await login({ email, password });
    if (authError) {
      setError(authError);
      setLoading(false);
      haptics.error();
      return;
    }
    haptics.success();
    showToast('Welcome back!', 'success');
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <AuthHero tagline="Plan your perfect holiday" />
        <ScreenHeader title="Login" subtitle="Sign in to your account" />

        <View style={SharedStyles.form}>
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Email address"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            accessibilityLabel="Password"
          />
        </View>

        {error ? (
          <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text>
        ) : null}

        <PrimaryButton
          label={loading ? 'Signing in...' : 'Login'}
          onPress={handleLogin}
        />

        <AuthFooter
          message="Don't have an account?"
          linkLabel="Register"
          onPress={() => router.replace('/(auth)/register')}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
