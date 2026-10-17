// Settings that differ between test builds and the store build.
//
// AdMob rewarded ad units. These are Google's demo units: they always show
// test ads and earn nothing. Before release, put this app's own ad unit IDs
// here (AdMob → アプリ → 広告ユニット), and the app IDs in
// android/app/src/main/res/values/strings.xml and ios/App/App/Info.plist.
// See docs/release.md.
export const ADMOB_REWARDED = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313',
};
