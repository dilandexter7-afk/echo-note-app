// assets.js — Centralised decorative image URLs for Echo & Note
// 
// HOW IT WORKS:
// - In production: images are served from Cloudinary CDN for global fast delivery.
// - In development (or if Cloudinary is misconfigured): images fall back to 
//   the local /public/assets/ folder served by Vite.
//
// TO SWITCH TO CLOUDINARY:
//   1. Fix your CLOUDINARY_CLOUD_NAME in server/.env (e.g. "dxyz1234")
//   2. Run the Cloudinary upload script: node server/upload_decor_assets.js
//   3. Set VITE_CLOUDINARY_CLOUD_NAME in a client/.env file
//      e.g. VITE_CLOUDINARY_CLOUD_NAME=dxyz1234
//   4. This file will then automatically use the Cloudinary URLs.

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_FOLDER = 'echo_note_decor';

function cdnUrl(publicId, opts = 'q_auto,f_auto') {
  if (!CLOUDINARY_CLOUD) {
    // Fallback to local public/assets/ folder
    return `/assets/${publicId}.jpg`;
  }
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${opts}/${CLOUDINARY_FOLDER}/${publicId}`;
}

export const ASSETS = {
  cozyHeartBed:          cdnUrl('cozy_heart_bed'),
  redRoseStem:           cdnUrl('red_rose_stem'),
  heartCoffeeBreakfast:  cdnUrl('heart_coffee_breakfast'),
  strawberryCheesecake:  cdnUrl('strawberry_cheesecake'),
  strawberrySnacks:      cdnUrl('strawberry_snacks'),
  crimsonBow:            cdnUrl('crimson_bow'),
  crimsonRibbon:         cdnUrl('crimson_ribbon'),
};

export default ASSETS;
