import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vku.fieldsurvey',
  appName: 'VKU Field Survey',
  webDir: 'dist',
  server: {
    // 🔴 CHỈ DÙNG KHI PHÁT TRIỂN — Xóa `url` trước khi build production!
    url: 'http://172.26.49.247:5173',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
