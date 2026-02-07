import { Implementation } from '../types';

export const mockActiveImplementation: Implementation | null = null;

export const mockRegisteredImplementations: Implementation[] = [];

// Demo implementations for Aegis screen
export const demoImplementations: Implementation[] = [
  {
    id: 'demo-1',
    state: 'registered',
    verdict: 'safe',
    title: 'Batch Executor',
    provider: 'Uniswap',
    description: 'Batch transactions · Sponsored gas execution',
    riskLevel: 'safe',
    details: 'This implementation has been thoroughly reviewed and is compliant with EIP-7702 standards. It enables efficient batch transaction processing with sponsored gas.'
  },
  {
    id: 'demo-2',
    state: 'registered',
    verdict: 'safe',
    title: 'Session Key Manager',
    provider: 'Safe',
    description: 'Temporary key management · Time-bounded permissions',
    riskLevel: 'low',
    details: 'Session keys provide temporary access with specific permissions. This implementation follows security best practices and includes automatic expiration.'
  },
  {
    id: 'demo-3',
    state: 'registered',
    verdict: 'unsafe',
    title: 'Token Swap',
    provider: 'Unknown App',
    description: 'Direct swap functionality · Unverified source',
    riskLevel: 'high',
    details: 'This implementation has not been verified. It requests broad permissions that may pose security risks. Proceed with caution.'
  }
];
