# Mobile (Expo + NativeWind)

Fresh Expo Router app scaffolded with NativeWind and Tailwind CSS.

What's included:

- Expo SDK 53 tabs template
- NativeWind + Tailwind configured (babel + tailwind preset)
- Example className usage on Tab One

## Scripts

- npm start
- npm run ios
- npm run android
- npm run web

## Notes

- Styles via `className` work on RN core elements out of the box. For custom wrappers, extend props to include `className`.
- Global Tailwind layers are imported in `app/_layout.tsx` via `global.css`.
