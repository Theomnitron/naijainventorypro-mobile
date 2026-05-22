module.exports = {
  "expo": {
    "name": "naijainventory-pro",
    "slug": "naijainventory-pro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "naijainventorypro",
    "userInterfaceStyle": "automatic",
    "ios": {
      "icon": "./assets/expo.icon"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-sharing",
      "expo-router",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#208AEF",
          "android": {
            "image": "./assets/images/splash-icon.png",
            "imageWidth": 76
          }
        }
      ],
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "extra": {
      "firebaseApiKey": process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY,
      "firebaseMessagingSenderId": process.env.EXPO_FIREBASE_MESSAGING_SENDER_ID,
      "firebaseAppId": process.env.EXPO_FIREBASE_APP_ID,
      "emailjsServiceId": process.env.EXPO_EMAILJS_SERVICE_ID,
      "emailjsTemplateId": process.env.EXPO_EMAILJS_TEMPLATE_ID,
      "emailjsPublicKey": process.env.EXPO_EMAILJS_PUBLIC_KEY,
      "paystackPublicKey": process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY
    }
  }
}
