#!/bin/bash
# Asset Download Script
# Run this script to download all assets from the original website

mkdir -p images css javascript fonts videos other

curl -o "images/Cream-Nonna@3x.png" "https://nonnasaid.com/wp-content/uploads/2023/09/Cream-Nonna@3x.png"
curl -o "images/BN-5.png" "https://nonnasaid.com/wp-content/uploads/2023/09/BN-5.png"
curl -o "images/BN-6.png" "https://nonnasaid.com/wp-content/uploads/2023/09/BN-6.png"
curl -o "images/BN-1.png" "https://nonnasaid.com/wp-content/uploads/2023/09/BN-1.png"

echo "Asset download complete!"
