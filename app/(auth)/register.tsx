import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useToast, useHaptics } from '@/hooks';
import { FormField } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer, AuthHero, AuthFooter } from '@/components/layout';
import { SharedStyles } from '@/constants';
import { validateRegisterForm } from '@/utils/validation';

/**
 * Register screen — email + password + confirm password with link to login.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const validationError = validateRegisterForm({ email, password, confirmPassword });
    if (validationError) {
      setError(validationError);
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);
    try {
      const authError = await register({ email, password, confirmPassword });
      if (authError) {
        setError(authError);
        haptics.error();
        return;
      }
      haptics.success();
      showToast('Account created!', 'success');
    } catch {
      setError('Something went wrong. Please try again.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <AuthHero tagline="Your holiday planner starts here" />
        <ScreenHeader title="Register" subtitle="Create a new account" />

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
            placeholder="At least 6 characters"
            secureTextEntry
            accessibilityLabel="Password"
          />
          <FormField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry
            accessibilityLabel="Confirm password"
          />
        </View>

        {error ? (
          <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text>
        ) : null}

        <PrimaryButton
          label="Register"
          loading={loading}
          onPress={handleRegister}
        />

        <AuthFooter
          message="Already have an account?"
          linkLabel="Login"
          onPress={() => router.replace('/(auth)/login')}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
