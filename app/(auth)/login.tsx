import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useToast, useHaptics } from '@/hooks';
import { FormField } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer, AuthHero, AuthFooter, DecorativeCircles } from '@/components/layout';
import { SharedStyles } from '@/constants';
import { validateLoginForm } from '@/utils/validation';

/**
 * The Login screen, where returning users sign in with their email and
 * password. Also has a link through to the Register screen for new users.
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
    try {
      const authError = await login({ email, password });
      if (authError) {
        setError(authError);
        haptics.error();
        return;
      }
      haptics.success();
      showToast('Welcome back!', 'success');
    } catch {
      setError('Something went wrong. Please try again.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <DecorativeCircles />
      <Toast {...toast} onHide={hideToast} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <AuthHero tagline="Plan, track and relive your holidays" />
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
          label="Login"
          loading={loading}
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
