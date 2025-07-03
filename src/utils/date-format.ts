/**
 * Crear una fecha local desde un string YYYY-MM-DD sin problemas de zona horaria
 * @param dateString Fecha en formato YYYY-MM-DD
 * @returns Objeto Date en zona horaria local
 */
export function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11
}

/**
 * Formatear fecha de nacimiento a formato mm/dd/yyyy
 * @param birthDate Fecha de nacimiento (string o Date)
 * @returns Fecha formateada en formato mm/dd/yyyy o null si no es válida
 */
export function formatBirthDate(birthDate: string | Date | null | undefined): string | null {
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
  } catch (error) {
    console.error('Error al formatear fecha de nacimiento:', error);
    return null;
  }
}