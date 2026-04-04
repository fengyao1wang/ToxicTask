module.exports = {
  expo: {
    name: "ToxicTask",
    slug: "toxictask",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "toxictask",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0a"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.toxictask.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0a0a0a"
      },
      package: "com.toxictask.app"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-dev-client"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "bf4f0b92-e551-47ce-85de-c7f8fadbf316"
      }
    }
  }
};
