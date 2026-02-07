import { Implementation } from '../types';

export const mockActiveImplementation: Implementation | null = null;

export const mockRegisteredImplementations: Implementation[] = [];

// Demo implementations for Aegis screen
export const demoImplementations: Implementation[] = [
  {
    id: 'demo-1',
    address: '0x16b0e675C0CE766e82bf9B58dC2d2F247985B302',
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
    address: '0xE6C896ac6B6195Da7daDF66Fe5DC39FBb0e7321b',
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
    address: '0x373325c876eF8437069453e050a5f963a20Bd928',
    state: 'registered',
    verdict: 'unsafe',
    title: 'Token Swap',
    provider: 'Unknown App',
    description: 'Direct swap functionality · Unverified source',
    riskLevel: 'high',
    details: 'This implementation has not been verified. It requests broad permissions that may pose security risks. Proceed with caution.'
  }
];
