#!/bin/sh
# Renders every philosophy Short in promo/shorts/philosophy.json that has no video yet.
#   cd scripts/og && sh shorts-all.sh
cd "$(dirname "$0")"
for id in $(node -e "for (const x of require('../../promo/shorts/philosophy.json')) console.log(x.id)"); do
  [ -f "../../promo/shorts/philo-$id.mp4" ] || node x-video.mjs --philo "$id" || exit 1
done
