echo "🧹 Limpieza completa y recompilación..."
pm2 stop 1
rm -rf dist/
npx tsc --build --force --verbose
pm2 restart 1
echo "✅ Listo!"