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

// Store product IDs of the two purchases (both "non-consumable", bought once).
// They must be created with the same IDs in App Store Connect and Google Play
// Console before anything can be bought; until the store knows them, no
// purchase is offered. See docs/length-and-purchases.md.
export const PRODUCT_IDS = {
  skip: 'com.moutonarchive.count.skipnights',
  noads: 'com.moutonarchive.count.noads',
};
