/**
 * Private Oracle endpoint — re-exports shared engine for Cloud Functions.
 */

export {
  invokeOracle,
  offlineOracle,
  ORACLE_SYSTEM_PROMPT,
} from '@sanctuary/shared';
