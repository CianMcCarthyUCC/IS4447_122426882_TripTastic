import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks';
import { PressableOpacity } from '@/components/buttons';
import { Spacing } from '@/constants';

type CommonProps = {
  /** Ionicon rendered in the leading bubble. */
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Primary row label. */
  label: string;
  /** Optional hint shown under the label. */
  hint?: string;
  /** Renders the label in the destructive colour. */
  destructive?: boolean;
};

type SwitchRow = CommonProps & {
  trailing: 'switch';
  value: boolean;
  onValueChange: (value: boolean) => void;
  onPress?: never;
  loading?: never;
  trailingText?: never;
};

type ActionRow = CommonProps & {
  trailing?: 'chevron' | 'none';
  onPress: () => void;
  loading?: boolean;
  /** Optional right-aligned value text (e.g. "Private"). */
  trailingText?: string;
  value?: never;
  onValueChange?: never;
};

type Props = SwitchRow | ActionRow;

/**
 * A single row in the Settings list. Supports a toggle switch, a tappable
 * action with a chevron, or a plain row. Used everywhere the app surfaces
 * a preference or account action in the flat Instagram-style list.
 */
export function SettingsListRow(props: Props) {
  const theme = useAppTheme();
  const labelColor = props.destructive ? theme.dangerAction : theme.textPrimary;
  const iconColor = props.destructive ? theme.dangerAction : theme.accentAction;

  const content = (
    <View style={styles.row}>
      <View style={[styles.iconBubble, { backgroundColor: theme.tagBackground }]}>
        <Ionicons name={props.icon} size={18} color={iconColor} />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {props.label}
        </Text>
        {props.hint ? (
          <Text style={[styles.hint, { color: theme.textSecondary }]} numberOfLines={2}>
            {props.hint}
          </Text>
        ) : null}
      </View>
      {renderTrailing(props, theme)}
    </View>
  );

  if (props.trailing === 'switch') {
    return <View style={[styles.rowWrap, { borderBottomColor: theme.cardBorder }]}>{content}</View>;
  }

  return (
    <PressableOpacity
      onPress={props.onPress}
      disabled={props.loading}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ busy: Boolean(props.loading) }}
      style={[styles.rowWrap, { borderBottomColor: theme.cardBorder }]}
    >
      {content}
    </PressableOpacity>
  );
}

function renderTrailing(props: Props, theme: ReturnType<typeof useAppTheme>) {
  if (props.trailing === 'switch') {
    return (
      <Switch
        value={props.value}
        onValueChange={props.onValueChange}
        trackColor={{ false: theme.cardBorder, true: theme.accentAction }}
        accessibilityRole="switch"
        accessibilityState={{ checked: props.value }}
        accessibilityLabel={`Toggle ${props.label}`}
      />
    );
  }
  if (props.loading) {
    return <Ionicons name="time-outline" size={20} color={theme.textSecondary} />;
  }
  if (props.trailingText) {
    return (
      <Text style={[styles.trailingText, { color: theme.textSecondary }]} numberOfLines={1}>
        {props.trailingText}
      </Text>
    );
  }
  if (props.trailing === 'none') return null;
  return <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />;
}

const styles = StyleSheet.create({
  rowWrap: {
    borderBottomWidth: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
  trailingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
