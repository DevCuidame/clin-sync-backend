#!/usr/bin/env ts-node
"use strict";
/**
 * Script para ejecutar tests específicos del sistema de pagos
 * Permite ejecutar tests individuales o suites completas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPaymentTests = main;
const test_payment_system_1 = require("./test-payment-system");
// Configuración de colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};
// Función para mostrar ayuda
function showHelp() {
    console.log(`
${colors.cyan}${colors.bright}🧪 SISTEMA DE TESTS DE PAGOS - CLIN SYNC${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`
${colors.yellow}Uso:${colors.reset}`);
    console.log('  npm run test:payments [comando]');
    console.log('  npx ts-node src/tests/run-payment-tests.ts [comando]');
    console.log(`\n${colors.yellow}Comandos disponibles:${colors.reset}`);
    console.log(`  ${colors.green}all${colors.reset}              - Ejecutar todos los tests (por defecto)`);
    console.log(`  ${colors.green}auth${colors.reset}             - Solo test de autenticación`);
    console.log(`  ${colors.green}packages${colors.reset}         - Solo test de paquetes`);
    console.log(`  ${colors.green}transaction${colors.reset}      - Solo test de transacciones`);
    console.log(`  ${colors.green}payment${colors.reset}          - Solo test de confirmación de pago`);
    console.log(`  ${colors.green}purchase${colors.reset}         - Solo test de creación de compra`);
    console.log(`  ${colors.green}verify${colors.reset}           - Solo test de verificación de compras`);
    console.log(`  ${colors.green}history${colors.reset}          - Solo test de historial de pagos`);
    console.log(`  ${colors.green}flow${colors.reset}             - Flujo básico (auth + packages + transaction)`);
    console.log(`  ${colors.green}help${colors.reset}             - Mostrar esta ayuda`);
    console.log(`\n${colors.yellow}Ejemplos:${colors.reset}`);
    console.log('  npx ts-node src/tests/run-payment-tests.ts all');
    console.log('  npx ts-node src/tests/run-payment-tests.ts auth');
    console.log('  npx ts-node src/tests/run-payment-tests.ts flow');
    console.log(`\n${colors.yellow}Notas:${colors.reset}`);
    console.log('  - Asegúrate de que el servidor esté corriendo en localhost:3000');
    console.log('  - Verifica que tengas un usuario con email: d@g.com y password: 00000000');
    console.log('  - Los tests usan el entorno de desarrollo/testing');
    console.log('');
}
// Función para ejecutar un test individual con manejo de errores
async function runSingleTest(testName, testFunction) {
    console.log(`\n${colors.blue}🧪 Ejecutando: ${testName}${colors.reset}`);
    console.log('-'.repeat(50));
    try {
        const result = await testFunction();
        if (result) {
            console.log(`${colors.green}✅ ${testName} - PASÓ${colors.reset}`);
            return true;
        }
        else {
            console.log(`${colors.red}❌ ${testName} - FALLÓ${colors.reset}`);
            return false;
        }
    }
    catch (error) {
        console.log(`${colors.red}❌ ${testName} - ERROR: ${error}${colors.reset}`);
        return false;
    }
}
// Función para mostrar resumen
function showSummary(passed, total) {
    const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.cyan}${colors.bright}📊 RESUMEN DE TESTS${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`${colors.green}✅ Tests exitosos: ${passed}${colors.reset}`);
    console.log(`${colors.red}❌ Tests fallidos: ${total - passed}${colors.reset}`);
    console.log(`${colors.yellow}📈 Porcentaje de éxito: ${percentage}%${colors.reset}`);
    if (passed === total) {
        console.log(`\n${colors.green}🎉 ¡TODOS LOS TESTS PASARON!${colors.reset}`);
    }
    else {
        console.log(`\n${colors.yellow}⚠️  Algunos tests fallaron. Revisa los errores anteriores.${colors.reset}`);
    }
}
// Función principal
async function main() {
    const command = process.argv[2] || 'all';
    console.log(`${colors.magenta}${colors.bright}🚀 INICIANDO TESTS DEL SISTEMA DE PAGOS${colors.reset}`);
    console.log(`${colors.cyan}Comando: ${command}${colors.reset}\n`);
    let passed = 0;
    let total = 0;
    switch (command.toLowerCase()) {
        case 'help':
        case '-h':
        case '--help':
            showHelp();
            return;
        case 'all':
            console.log(`${colors.yellow}Ejecutando suite completa de tests...${colors.reset}`);
            await (0, test_payment_system_1.runPaymentSystemTests)();
            return;
        case 'auth':
            total = 1;
            if (await runSingleTest('Autenticación', test_payment_system_1.login))
                passed++;
            break;
        case 'packages':
            total = 2;
            if (await runSingleTest('Autenticación', test_payment_system_1.login))
                passed++;
            if (await runSingleTest('Obtener Paquetes', test_payment_system_1.getAvailablePackages))
                passed++;
            break;
        case 'transaction':
            total = 3;
            if (await runSingleTest('Autenticación', test_payment_system_1.login))
                passed++;
            if (await runSingleTest('Obtener Paquetes', test_payment_system_1.getAvailablePackages))
                passed++;
            if (await runSingleTest('Crear Transacción', test_payment_system_1.createPaymentTransaction))
                passed++;
            break;
        case 'payment':
            total = 4;
            if (await runSingleTest('Autenticación', test_payment_system_1.login))
                passed++;
            if (await runSingleTest('Obtener Paquetes', test_payment_system_1.getAvailablePackages))
                passed++;
            if (await runSingleTest('Crear Transacción', test_payment_system_1.createPaymentTransaction))
                passed++;
            if (await runSingleTest('Confirmar Pago', test_payment_system_1.confirmPayment))
                passed++;
            break;
        case 'purchase':
            total = 3;
            if (await runSingleTest('Autenticación', test_payment_system_1.login))
                passed++;
            if (await runSingleTest('Obtener Paquetes', test_payment_system_1.getAvailablePackages))
                passed++;
            if (await runSingleTest('Crear Compra Directa', test_payment_system_1.createDirectPurchase))
                passed++;
            break;
        case 'verify':
            total = 4;
            if (await runSingleTest('Autenticación', test_payment_system_1.login))
                passed++;
            if (await runSingleTest('Obtener Paquetes', test_payment_system_1.getAvailablePackages))
                passed++;
            if (await runSingleTest('Crear Compra Directa', test_payment_system_1.createDirectPurchase))
                passed++;
            if (await runSingleTest('Verificar Compras Usuario', test_payment_system_1.verifyUserPurchases))
                passed++;
            if (await runSingleTest('Verificar Compras Activas', test_payment_system_1.verifyActivePurchases))
                passed++;
            break;
        case 'history':
            total = 2;
            if (await runSingleTest('Autenticación', test_payment_system_1.login))
                passed++;
            if (await runSingleTest('Historial de Pagos', test_payment_system_1.testPaymentHistory))
                passed++;
            break;
        case 'flow':
            console.log(`${colors.yellow}Ejecutando flujo básico de pagos...${colors.reset}`);
            total = 3;
            if (await runSingleTest('Autenticación', test_payment_system_1.login))
                passed++;
            if (await runSingleTest('Obtener Paquetes', test_payment_system_1.getAvailablePackages))
                passed++;
            if (await runSingleTest('Crear Transacción', test_payment_system_1.createPaymentTransaction))
                passed++;
            break;
        default:
            console.log(`${colors.red}❌ Comando no reconocido: ${command}${colors.reset}`);
            console.log(`${colors.yellow}Usa 'help' para ver los comandos disponibles.${colors.reset}`);
            return;
    }
    showSummary(passed, total);
    console.log(`\n${colors.blue}🏁 Tests completados.${colors.reset}`);
}
// Manejo de errores globales
process.on('unhandledRejection', (reason, promise) => {
    console.error(`${colors.red}❌ Error no manejado:${colors.reset}`, reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error(`${colors.red}❌ Excepción no capturada:${colors.reset}`, error);
    process.exit(1);
});
// Ejecutar si es el archivo principal
if (require.main === module) {
    main().catch((error) => {
        console.error(`${colors.red}❌ Error en main:${colors.reset}`, error);
        process.exit(1);
    });
}
