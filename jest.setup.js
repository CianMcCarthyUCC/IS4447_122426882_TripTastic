// Fix Expo SDK 54 import.meta issue in Jest
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  globalThis.__ExpoImportMetaRegistry = {
    url: 'file:///test',
  };
}
