import { memo, useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { SharedStyles } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  label?: string;
  helpText?: string;
  imageUri: string | null;
  onImageSelected: (uri: string | null) => void;
};

/**
 * Image picker — tap to pick from gallery or camera.
 * Shows preview when image is selected.
 */
function ImagePicker({ label = 'Cover Photo', helpText, imageUri, onImageSelected }: Props) {
  const theme = useAppTheme();

  const pickImage = useCallback(async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  }, [onImageSelected]);

  const removeImage = useCallback(() => {
    onImageSelected(null);
  }, [onImageSelected]);

  return (
    <View style={SharedStyles.fieldWrapper}>
      {label ? <Text style={[SharedStyles.fieldLabel, { color: theme.textLabel }]}>{label}</Text> : null}
      {helpText ? <Text style={[styles.helpText, { color: theme.textSecondary }]}>{helpText}</Text> : null}

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Pressable
            style={styles.removeButton}
            onPress={removeImage}
            accessibilityLabel="Remove photo"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={28} color={Palette.white} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.placeholder, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
          onPress={pickImage}
          accessibilityLabel="Add cover photo"
          accessibilityRole="button"
        >
          <Ionicons name="camera-outline" size={32} color={theme.textSecondary} />
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Tap to add a photo</Text>
        </Pressable>
      )}
    </View>
  );
}

export default memo(ImagePicker);

const styles = StyleSheet.create({
  helpText: { fontSize: 13, marginBottom: Spacing.xs },
  previewContainer: { position: 'relative' },
  preview: {
    borderRadius: BorderRadius.md,
    height: 160,
    width: '100%',
  },
  removeButton: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
  },
  placeholder: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  placeholderText: { fontSize: 14, fontWeight: '600' },
});
