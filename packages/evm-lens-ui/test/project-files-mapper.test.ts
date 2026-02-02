import { describe, expect, it } from 'vitest';
import { contractFQNListToProjectFiles } from '../src/adapters/project-files-mapper';

describe('contractFQNListToProjectFiles', () => {
  it('should handle empty list', () => {
    const result = contractFQNListToProjectFiles([]);
    expect(result).toEqual({ items: {}, rootItemId: '', firstLevelFolderNames: [] });
  });

  it('should handle single contract', () => {
    const result = contractFQNListToProjectFiles(['contracts/ERC20.sol:ERC20']);
    expect(result.rootItemId).toBe('contracts');
    expect(result.items['contracts']).toEqual({ name: 'contracts', children: ['contracts/ERC20.sol'] });
    expect(result.items['contracts/ERC20.sol']).toEqual({ name: 'ERC20.sol' });
    expect(result.firstLevelFolderNames).toEqual([]);
  });

  it('should handle multiple contracts in same directory', () => {
    const result = contractFQNListToProjectFiles([
      'contracts/tokens/ERC20.sol:ERC20',
      'contracts/tokens/ERC721.sol:ERC721',
    ]);
    expect(result.rootItemId).toBe('contracts');
    expect(result.items['contracts']).toEqual({ name: 'contracts', children: ['contracts/tokens'] });
    expect(result.items['contracts/tokens']).toEqual({
      name: 'tokens',
      children: ['contracts/tokens/ERC20.sol', 'contracts/tokens/ERC721.sol'],
    });
    expect(result.items['contracts/tokens/ERC20.sol']).toEqual({ name: 'ERC20.sol' });
    expect(result.items['contracts/tokens/ERC721.sol']).toEqual({ name: 'ERC721.sol' });
    expect(result.firstLevelFolderNames).toEqual(['contracts/tokens']);
  });

  it('should handle multiple contracts in same file', () => {
    const result = contractFQNListToProjectFiles(['contracts/ERC20.sol:ERC20', 'contracts/ERC20.sol:ERC223']);
    expect(result.rootItemId).toBe('contracts');
    expect(result.items['contracts']).toEqual({ name: 'contracts', children: ['contracts/ERC20.sol'] });
    expect(result.items['contracts/ERC20.sol']).toEqual({ name: 'ERC20.sol' });
    expect(result.firstLevelFolderNames).toEqual([]);
  });

  it('should handle deeply nested directories', () => {
    const result = contractFQNListToProjectFiles(['contracts/a/b/c/Token.sol:Token']);
    expect(result.rootItemId).toBe('contracts');
    expect(result.items['contracts']).toEqual({ name: 'contracts', children: ['contracts/a'] });
    expect(result.items['contracts/a']).toEqual({ name: 'a', children: ['contracts/a/b'] });
    expect(result.items['contracts/a/b']).toEqual({ name: 'b', children: ['contracts/a/b/c'] });
    expect(result.items['contracts/a/b/c']).toEqual({ name: 'c', children: ['contracts/a/b/c/Token.sol'] });
    expect(result.items['contracts/a/b/c/Token.sol']).toEqual({ name: 'Token.sol' });
    expect(result.firstLevelFolderNames).toEqual(['contracts/a']);
  });

  it('should handle multiple files across different subdirectories', () => {
    const result = contractFQNListToProjectFiles([
      'contracts/token/ERC20.sol:ERC20',
      'contracts/token/ERC721.sol:ERC721',
      'contracts/governance/Governor.sol:Governor',
      'contracts/mocks/MockToken.sol:MockToken',
    ]);
    expect(result.rootItemId).toBe('contracts');
    expect(result.items['contracts'].children).toHaveLength(3);
    expect(result.items['contracts'].children).toContain('contracts/token');
    expect(result.items['contracts'].children).toContain('contracts/governance');
    expect(result.items['contracts'].children).toContain('contracts/mocks');
    expect(result.items['contracts/token'].children).toHaveLength(2);
    expect(result.firstLevelFolderNames).toEqual(['contracts/governance', 'contracts/mocks', 'contracts/token']);
  });

  it('should throw error for multiple root directories', () => {
    expect(() => {
      contractFQNListToProjectFiles(['contracts/ERC20.sol:ERC20', 'interfaces/IContract.sol:IContract']);
    }).toThrow('Multiple root directories detected. All files must be under the same root directory.');
  });

  it('should handle contracts from OpenZeppelin format', () => {
    const result = contractFQNListToProjectFiles([
      '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
      '@openzeppelin/contracts/access/Ownable.sol:Ownable',
    ]);
    expect(result.rootItemId).toBe('@openzeppelin');
    expect(result.items['@openzeppelin'].children).toContain('@openzeppelin/contracts');
    expect(result.firstLevelFolderNames).toEqual(['@openzeppelin/contracts']);
  });
});
