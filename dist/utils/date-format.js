"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBirthDate = formatBirthDate;
/**
 * Formatear fecha de nacimiento a formato mm/dd/yyyy
 * @param birthDate Fecha de nacimiento (string o Date)
 * @returns Fecha formateada en formato mm/dd/yyyy o null si no es válida
 */
function formatBirthDate(birthDate) {
    if (!birthDate) {
        return null;
    }
    try {
        const date = new Date(birthDate);
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return null;
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    catch (error) {
        console.error('Error al formatear fecha de nacimiento:', error);
        return null;
    }
}
