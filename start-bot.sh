#!/bin/bash

# Inicia el bot de bodas con display virtual

# Mata cualquier instancia previa de Xvfb
pkill -f "Xvfb :99" || true

# Espera un momento
sleep 2

# Inicia Xvfb en background
export DISPLAY=:99
Xvfb :99 -ac -screen 0 1024x768x8 > /dev/null 2>&1 &

# Espera que Xvfb esté listo
sleep 3

# Inicia el bot
echo "🤖 Iniciando Wedding Bot..."
echo "📅 $(date)"
echo "🖥️  Display: $DISPLAY"

# Ejecuta el bot de Node.js
exec node src/bot.js 