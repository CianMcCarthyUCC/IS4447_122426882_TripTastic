import { Pressable, Text, View } from 'react-native';
import { SharedStyles } from '@/constants';

type Option<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  label?: string;
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
  accessibilityLabel?: string;
};

/**
 * Generic pill toggle — reusable segmented selector.
 * Used by PeriodPicker, ViewModeToggle, scope toggles, and anywhere
 * a user picks one option from a small set.
 */
export default function PillToggle<T extends string>({
  label,
  options,
  selected,
  onSelect,
  accessibilityLabel,
}: Props<T>) {
  return (
    <View style={SharedStyles.fieldWrapper}>
      {label ? (
        <Text style={SharedStyles.fieldLabel} accessibilityRole="text">{label}</Text>
      ) : null}
      <View
        style={SharedStyles.pillRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel ?? label ?? 'Select an option'}
      >
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[SharedStyles.pill, active && SharedStyles.pillSelected]}
              onPress={() => onSelect(opt.value)}
              accessibilityRole="radio"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected: active }}
            >
              <Text style={[SharedStyles.pillText, active && SharedStyles.pillTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
