export async function readRecords<T>(path: string): Promise<T[]> {
  try {
    console.log(`Read Records from ${path}`);
    const module = await import(path);
    return module.ftsFunctions as T[];
  } catch (error) {
    return [];
  }
}
