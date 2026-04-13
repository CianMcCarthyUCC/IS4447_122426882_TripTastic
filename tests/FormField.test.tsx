import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock db/client to prevent SQLite initialization
jest.mock('@/db/client', () => ({
  db: { select: jest.fn(() => ({ from: jest.fn().mockResolvedValue([]) })), insert: jest.fn(), run: jest.fn() },
}));

// Mock useAppTheme to avoid db dependency
jest.mock('@/hooks/useAppTheme', () => ({
  useAppTheme: () => ({
    textLabel: '#334155',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    inputBackground: '#FFFFFF',
    inputBorder: '#CBD5E1',
  }),
  ThemeContext: { Provider: ({ children }: any) => children },
  useThemeProvider: () => ({}),
  useThemeControl: () => ({ mode: 'light', isDark: false, setMode: jest.fn() }),
}));

import FormField from '@/components/forms/FormField';

describe('FormField', () => {
  it('renders the label and fires onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByText, getByLabelText } = render(
      <FormField label="Name" value="" onChangeText={onChangeText} />
    );

    expect(getByText('Name')).toBeTruthy();

    fireEvent.changeText(getByLabelText('Name'), 'Alice');
    expect(onChangeText).toHaveBeenCalledWith('Alice');
  });
});
