/**
 * Type Definitions Index
 * Central export point for all application types
 */

// Re-export all types from individual modules
export * from './forecast';
export * from './briefing';
export * from './weather';
export * from './database';
export * from './api';

// Type guards and utilities
export function isApiSuccess<T>(response: any): response is { success: true; data: T } {
  return response && response.success === true;
}

export function isApiError(response: any): response is { success: false; error: string } {
  return response && response.success === false;
}
