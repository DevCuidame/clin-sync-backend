echo "🧹 Limpieza completa y recompilación..."
pm2 stop 0
rm -rf dist/
npx tsc --build --force --verbose
pm2 restart 0
echo "✅ Listo!"