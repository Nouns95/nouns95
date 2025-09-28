import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import ClientIncentivesRewardsABI from '../../../../domain/abis/ClientIncentivesRewards';
import CandidatesProxyABI from '../../../../domain/abis/CandidatesProxy';
import styles from './SmartActionEditor.module.css';

interface ABIInput {
  name: string;
  type: string;
  internalType?: string;
}

interface ABIOutput {
  name: string;
  type: string;
  internalType?: string;
}

interface ABIItem {
  name?: string;
  type: string;
  stateMutability?: string;
  inputs?: ABIInput[];
  outputs?: ABIOutput[];
}

interface ContractFunction {
  name: string;
  type: 'function';
  stateMutability: string;
  inputs: ABIInput[];
  outputs?: ABIOutput[];
}

interface ContractABI {
  contractName?: string;
  functions: ContractFunction[];
  isProxy?: boolean;
  implementationAddress?: string;
  proxyType?: string;
}

interface SmartActionEditorProps {
  index: number;
  target: string;
  value: string;
  signature: string;
  calldata: string;
  onUpdate: (field: string, value: string) => void;
  disabled?: boolean;
}

const getKnownContractABI = (address: string): { abi: ABIItem[], name: string } | null => {
  const normalizedAddress = address.toLowerCase();
  
  // Known contract addresses and their ABIs
  const knownContracts: Record<string, { abi: ABIItem[], name: string }> = {
    '0x883860178f95d0c82413edc1d6de530cb4771d55': {
      abi: ClientIncentivesRewardsABI as ABIItem[],
      name: 'Client Incentives Rewards Proxy'
    },
    '0x513e9277192767eb4dc044a08da8228862828150': {
      abi: CandidatesProxyABI as ABIItem[],
      name: 'Candidates Proxy'
    }
  };
  
  return knownContracts[normalizedAddress] || null;
};

export function SmartActionEditor({ 
  index, 
  target, 
  value, 
  signature, 
  calldata, 
  onUpdate, 
  disabled = false 
}: SmartActionEditorProps) {
  const [contractABI, setContractABI] = useState<ContractABI | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<ContractFunction | null>(null);
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: string }>({});
  const [isLoadingABI, setIsLoadingABI] = useState(false);
  const [abiError, setAbiError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchContractABI = useCallback(async (address: string) => {
    setIsLoadingABI(true);
    setAbiError(null);
    
    try {
      // Fetch main contract ABI
      const response = await fetch(`/api/ethereum/etherscan?moduleType=contract&action=getabi&address=${address}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.status === '0') {
        throw new Error(data.message || 'Contract not verified on Etherscan');
      }
      
      const mainAbi = JSON.parse(data.result);
      // Parse main ABI items
      
      // Check if this is a proxy contract
      const proxyInfo = await detectProxyImplementation(address, mainAbi);
      // Proxy detection completed
      
      let allFunctions = mainAbi.filter((item: ABIItem) => item.type === 'function');
      let contractName = '';
      
      // Process proxy contract functions
      // Analyze ABI items
      
      // Get contract name (with rate limiting delay)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay to avoid rate limiting
        const nameResponse = await fetch(`/api/ethereum/etherscan?moduleType=contract&action=getsourcecode&address=${address}`);
        const nameData = await nameResponse.json();
        if (nameData.status === '1' && nameData.result?.[0]?.ContractName) {
          contractName = nameData.result[0].ContractName;
        }
      } catch {
        // Could not fetch contract name
      }

      // If it's a proxy, also fetch implementation ABI (critical for minimal proxies with no functions)
      if (proxyInfo.isProxy && proxyInfo.implementationAddress) {
        try {
          // Fetch implementation ABI
          // Request implementation ABI
          
          // Add delay to avoid rate limiting  
          await new Promise(resolve => setTimeout(resolve, 1500));
          const implResponse = await fetch(`/api/ethereum/etherscan?moduleType=contract&action=getabi&address=${proxyInfo.implementationAddress}`);
          // Process implementation response
          
          const implData = await implResponse.json();
          // Parse implementation data
          // Check implementation response status
          
          if (implData.status === '1') {
            const implAbi = JSON.parse(implData.result);
            const implFunctions = implAbi.filter((item: ABIItem) => item.type === 'function');
            
            // Process implementation functions
            
            // Combine functions from both contracts, avoiding duplicates
            // Create a more sophisticated deduplication based on function signature
            const existingFunctionSignatures = new Set(
              allFunctions.map((f: ABIItem) => {
                const inputs = f.inputs && Array.isArray(f.inputs) 
                  ? f.inputs.map((i: ABIInput) => i.type || '').join(',') 
                  : '';
                return `${f.name}(${inputs})`;
              })
            );
            
            const newFunctions = implFunctions.filter((f: ABIItem) => {
              const inputs = f.inputs && Array.isArray(f.inputs) 
                ? f.inputs.map((i: ABIInput) => i.type || '').join(',') 
                : '';
              const signature = `${f.name}(${inputs})`;
              return !existingFunctionSignatures.has(signature);
            });
            
            allFunctions = [...allFunctions, ...newFunctions];
            
            // Add implementation functions
            // Combine function lists
            
            // Try to get implementation contract name
            try {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting delay
              const implNameResponse = await fetch(`/api/ethereum/etherscan?moduleType=contract&action=getsourcecode&address=${proxyInfo.implementationAddress}`);
              const implNameData = await implNameResponse.json();
              if (implNameData.status === '1' && implNameData.result?.[0]?.ContractName) {
                contractName = contractName ? 
                  `${contractName} (Proxy → ${implNameData.result[0].ContractName})` : 
                  `Proxy → ${implNameData.result[0].ContractName}`;
              }
            } catch {
              // Could not fetch implementation contract name
            }
          } else if (implData.message === 'NOTOK' && implData.result?.includes('rate limit')) {
            // Rate limited when fetching implementation ABI
            // For minimal proxies, we should still indicate it's a proxy even if rate limited
            contractName = contractName ? 
              `${contractName} (Minimal Proxy → Rate Limited)` : 
              `Minimal Proxy → Rate Limited`;
          } else {
            // Implementation contract not verified
            // Update contract name to indicate implementation is not verified
            contractName = contractName ? 
              `${contractName} (Proxy → Unverified Implementation)` : 
              `Proxy → Unverified Implementation`;
          }
        } catch {
          // Error fetching implementation ABI
          // Update contract name to indicate there was an error
          contractName = contractName ? 
            `${contractName} (Proxy → Implementation Error)` : 
            `Proxy → Implementation Error`;
        }
      }
      
      // Process all found functions
      
      // Filter for state-changing functions (including functions without explicit stateMutability)
      const functions = allFunctions
        .filter((item: ABIItem) => {
          // First filter out invalid function objects
          if (!item || typeof item !== 'object' || !item.name || item.type !== 'function') {
            // Invalid function object
            return false;
          }
          
          const mutability = item.stateMutability;
          // Include functions that are: nonpayable, payable, or have no stateMutability (older contracts)
          return mutability !== 'view' && 
                 mutability !== 'pure' && 
                 mutability !== 'constant'; // Some older contracts use 'constant' instead of 'view'
        })
        .map((item: ABIItem) => {
          // Ensure inputs array exists and is valid, and fix types
          return {
            ...item,
            name: item.name as string, // Safe since we filtered out items without name
            type: 'function' as const, // Ensure type is literal 'function'
            stateMutability: item.stateMutability || 'nonpayable', // Provide default
            inputs: Array.isArray(item.inputs) ? item.inputs : []
          };
        });
      
      // Filter state-changing functions
      
      setContractABI({ 
        contractName, 
        functions,
        isProxy: proxyInfo.isProxy,
        implementationAddress: proxyInfo.implementationAddress,
        proxyType: proxyInfo.proxyType
      });
    } catch {
      // Error fetching ABI
      
      // Try fallback to known contract ABIs
      const knownContract = getKnownContractABI(address);
      if (knownContract) {
        // Using known contract ABI
        
        const functions = knownContract.abi.filter((item: ABIItem) => {
          if (item.type !== 'function' || !item.name) return false;
          
          const mutability = item.stateMutability;
          return mutability !== 'view' && 
                 mutability !== 'pure' && 
                 mutability !== 'constant';
        }).map((item: ABIItem) => ({
          ...item,
          name: item.name as string, // Safe since we filtered out items without name
          type: 'function' as const, // Ensure type is literal 'function'
          stateMutability: item.stateMutability || 'nonpayable', // Provide default
          inputs: Array.isArray(item.inputs) ? item.inputs : []
        }));
        
        setContractABI({ 
          contractName: knownContract.name, 
          functions,
          isProxy: false,
          implementationAddress: undefined,
          proxyType: undefined
        });
      } else {
        setAbiError('Failed to fetch contract ABI');
      }
    } finally {
      setIsLoadingABI(false);
    }
  }, []); // Empty dependency array since function only uses setState functions

  // Fetch ABI when target address changes
  useEffect(() => {
    // Clear previous state
    setContractABI(null);
    setSelectedFunction(null);
    setFunctionInputs({});
    setAbiError(null);
    
    if (target && target.length === 42 && target.startsWith('0x')) {
      try {
        const checksumAddress = ethers.utils.getAddress(target);
        fetchContractABI(checksumAddress);
      } catch {
        setAbiError('Invalid address format');
      }
    }
  }, [target, fetchContractABI]); // fetchContractABI is stable due to useCallback with empty deps

  // Update function inputs when selected function changes
  useEffect(() => {
    if (selectedFunction && selectedFunction.inputs) {
      const inputs: { [key: string]: string } = {};
      selectedFunction.inputs.forEach(input => {
        if (input.name && input.type) {
          inputs[input.name] = getDefaultValueForType(input.type);
        }
      });
      setFunctionInputs(inputs);
      
      // Generate function signature
      const inputTypes = selectedFunction.inputs && Array.isArray(selectedFunction.inputs)
        ? selectedFunction.inputs.filter(i => i && i.type).map(i => i.type)
        : [];
      const sig = `${selectedFunction.name}(${inputTypes.join(',')})`;
      onUpdate('signature', sig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction]); // onUpdate excluded to prevent infinite loops

  // Update calldata when function inputs change
  useEffect(() => {
    if (selectedFunction && Object.keys(functionInputs).length > 0) {
      try {
        const encodedCalldata = encodeCalldata(selectedFunction, functionInputs);
        onUpdate('calldata', encodedCalldata);
      } catch {
        // Error encoding calldata
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [selectedFunction, functionInputs]); // onUpdate excluded to prevent infinite loops

  // Helper function to detect if a contract is a proxy
  const detectProxyImplementation = async (address: string, abi: ABIItem[]): Promise<{
    isProxy: boolean;
    implementationAddress?: string;
    proxyType?: string;
  }> => {
    try {
      // Check common proxy function signatures
      const hasImplementationFunction = abi.some((item: ABIItem) => 
        item.type === 'function' && 
        item.name === 'implementation' &&
        item.stateMutability === 'view'
      );

      if (hasImplementationFunction) {
        // Try to call implementation() function
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit RPC calls
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: address,
              data: '0x5c60da1b' // implementation() function signature
            }, 'latest'],
            id: 1
          })
        });

        const result = await response.json();
        // Check implementation call result
        if (result.result && result.result !== '0x') {
          // Extract address from the result (last 40 characters)
          const implementationAddress = '0x' + result.result.slice(-40);
          // Extract implementation address
          if (implementationAddress !== '0x0000000000000000000000000000000000000000') {
            return {
              isProxy: true,
              implementationAddress,
              proxyType: 'Transparent/UUPS Proxy'
            };
          }
        }
      }

      // Check for EIP-1967 implementation slot
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Longer delay for RPC calls
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getStorageAt',
            params: [
              address,
              '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', // EIP-1967 implementation slot
              'latest'
            ],
            id: 1
          })
        });

        const result = await response.json();
        // Check EIP-1967 storage slot
        if (result.result && result.result !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          const implementationAddress = '0x' + result.result.slice(-40);
          // Extract address from EIP-1967 slot
          if (implementationAddress !== '0x0000000000000000000000000000000000000000') {
            return {
              isProxy: true,
              implementationAddress,
              proxyType: 'EIP-1967 Proxy'
            };
          }
        }
      } catch {
        // Could not check EIP-1967 slot
      }

      // Check for common proxy patterns by looking at the ABI
      const proxyPatterns = [
        'upgradeTo',
        'upgradeToAndCall', 
        'implementation',
        'admin',
        'proxyAdmin'
      ];
      
      const hasProxyFunctions = proxyPatterns.some(pattern => 
        abi.some((item: ABIItem) => 
          item.type === 'function' && 
          item.name && 
          item.name.toLowerCase().includes(pattern.toLowerCase())
        )
      );

      if (hasProxyFunctions) {
        return {
          isProxy: true,
          proxyType: 'Detected Proxy Pattern'
        };
      }

      // Check for minimal proxy pattern - contracts with only fallback/receive and no regular functions
      const hasRegularFunctions = abi.some((item: ABIItem) => 
        item.type === 'function' && 
        item.name && 
        !['fallback', 'receive'].includes(item.type)
      );
      const hasFallback = abi.some((item: ABIItem) => item.type === 'fallback');

      if (!hasRegularFunctions && hasFallback) {
        // This looks like a minimal proxy - try EIP-1967 detection with longer timeout
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Even longer delay
          const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getStorageAt',
              params: [
                address,
                '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
                'latest'
              ],
              id: 1
            })
          });

          const result = await response.json();
          if (result.result && result.result !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
            const implementationAddress = '0x' + result.result.slice(-40);
            if (implementationAddress !== '0x0000000000000000000000000000000000000000') {
              return {
                isProxy: true,
                implementationAddress,
                proxyType: 'EIP-1967 Minimal Proxy'
              };
            }
          }
        } catch {
          // Could not check EIP-1967 slot for minimal proxy
        }
      }

      return { isProxy: false };
    } catch {
      // Error detecting proxy
      return { isProxy: false };
    }
  };

  const getDefaultValueForType = (type: string): string => {
    if (type.startsWith('uint') || type.startsWith('int')) return '0';
    if (type === 'address') return '0x0000000000000000000000000000000000000000';
    if (type === 'bool') return 'false';
    if (type === 'string' || type === 'bytes') return '';
    if (type.includes('[]')) return '[]';
    return '';
  };

  const encodeCalldata = (func: ContractFunction, inputs: { [key: string]: string }): string => {
    try {
      if (!func || !func.inputs || !Array.isArray(func.inputs)) {
        // Invalid function or inputs structure
        return '0x';
      }

      // For Nouns governance, we need to encode only the parameters, not the function selector
      const types = func.inputs.map(input => input.type);
      const values = func.inputs.map(input => {
        if (!input || !input.name || !input.type) {
          // Invalid input parameter
          return '';
        }
        const value = inputs[input.name] || '';
        return parseInputValue(value, input.type);
      });
      
      // Encode only the parameters (no function selector)
      if (types.length === 0) {
        return '0x';
      }
      
      const encoded = ethers.utils.defaultAbiCoder.encode(types, values);
      // Remove the '0x' prefix for the final calldata
      return encoded.slice(2);
    } catch {
      // Error encoding calldata
      return '0x';
    }
  };

  const parseInputValue = (value: string, type: string): unknown => {
    if (!value) return getDefaultValueForType(type);
    
    try {
      if (type === 'bool') {
        return value.toLowerCase() === 'true';
      }
      if (type.startsWith('uint') || type.startsWith('int')) {
        return ethers.BigNumber.from(value);
      }
      if (type === 'address') {
        return ethers.utils.getAddress(value);
      }
      if (type.includes('[]')) {
        return JSON.parse(value);
      }
      return value;
    } catch {
      // Error parsing value
      return getDefaultValueForType(type);
    }
  };

  const handleFunctionSelect = (functionSignature: string) => {
    if (!functionSignature) {
      setSelectedFunction(null);
      return;
    }
    
    // If it's just a function name (no parentheses), find the first match
    if (!functionSignature.includes('(')) {
      const func = contractABI?.functions.find(f => f.name === functionSignature);
      if (func) {
        // Ensure inputs array exists and has proper structure
        func.inputs = func.inputs || [];
        func.inputs = func.inputs.filter(input => input.name && input.type);
      }
      setSelectedFunction(func || null);
      return;
    }
    
    // For full signatures, match exactly
    const func = contractABI?.functions.find(f => {
      const inputTypes = f.inputs && Array.isArray(f.inputs)
        ? f.inputs.map((i: ABIInput) => i.type || '').join(',')
        : '';
      const signature = `${f.name}(${inputTypes})`;
      return signature === functionSignature;
    });
    
    if (func) {
      // Ensure inputs array exists and has proper structure
      func.inputs = func.inputs || [];
      func.inputs = func.inputs.filter(input => input.name && input.type);
    }
    setSelectedFunction(func || null);
  };

  const handleInputChange = (inputName: string, value: string) => {
    setFunctionInputs(prev => ({ ...prev, [inputName]: value }));
  };

  const renderParameterInput = (input: { name: string; type: string }) => {
    if (!input || !input.name || !input.type) {
      // Invalid input parameter for rendering
      return null;
    }
    
    const value = functionInputs[input.name] || '';
    
    if (input.type === 'bool') {
      return (
        <select
          className={styles.input}
          value={value}
          onChange={(e) => handleInputChange(input.name, e.target.value)}
          disabled={disabled}
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      );
    }
    
    return (
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => handleInputChange(input.name, e.target.value)}
        placeholder={getPlaceholderForType(input.type)}
        disabled={disabled}
      />
    );
  };

  const getPlaceholderForType = (type: string): string => {
    if (type.startsWith('uint') || type.startsWith('int')) return '0';
    if (type === 'address') return '0x...';
    if (type === 'string') return 'Enter string';
    if (type === 'bytes') return '0x...';
    if (type.includes('[]')) return '["item1", "item2"]';
    return 'Enter value';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.actionLabel}>Action {index + 1}</span>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={disabled}
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Target Contract Address *</label>
        <input
          type="text"
          className={styles.input}
          value={target}
          onChange={(e) => onUpdate('target', e.target.value)}
          placeholder="0x..."
          disabled={disabled}
        />
        {isLoadingABI && <div className={styles.status}>Loading contract info...</div>}
        {contractABI?.contractName && (
          <div className={styles.contractName}>
            Etherscan contract name: <span className={styles.highlight}>{contractABI.contractName}</span>
            {contractABI.isProxy && (
              <div className={styles.proxyInfo}>
                🔗 {contractABI.proxyType} detected
                {contractABI.implementationAddress && (
                  <div className={styles.implementationInfo}>
                    Implementation: {contractABI.implementationAddress.slice(0, 6)}...{contractABI.implementationAddress.slice(-4)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {abiError && <div className={styles.error}>{abiError}</div>}

      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>ETH Value</label>
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => onUpdate('value', e.target.value)}
          placeholder="0"
          disabled={disabled}
        />
      </div>

      {!showAdvanced ? (
        // SIMPLE MODE - Smart interface with ABI-based function selection
        contractABI && contractABI.functions.length > 0 ? (
          <>
            <div className={styles.modeIndicator}>
              <span className={styles.modeLabel}>
                Smart Mode: Using contract ABI
                {contractABI.isProxy && (
                  <span className={styles.proxyIndicator}> (Proxy + Implementation)</span>
                )}
              </span>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Function to call</label>
              <select
                className={styles.select}
                value={selectedFunction ? (() => {
                  const inputTypes = selectedFunction.inputs && Array.isArray(selectedFunction.inputs)
                    ? selectedFunction.inputs.map((i: ABIInput) => i.type || '').join(',')
                    : '';
                  return `${selectedFunction.name}(${inputTypes})`;
                })() : ''}
                onChange={(e) => handleFunctionSelect(e.target.value)}
                disabled={disabled}
              >
                <option value="">Select function...</option>
                {contractABI.functions.map((func) => {
                  if (!func || !func.name) {
                    // Invalid function in ABI
                    return null;
                  }
                  
                  const inputsDisplay = func.inputs && Array.isArray(func.inputs) 
                    ? func.inputs
                        .filter(i => i && i.type && i.name)
                        .map(i => `${i.type} ${i.name}`)
                        .join(', ')
                    : '';
                  
                  // Create unique key based on function signature to avoid React key conflicts
                  const inputTypes = func.inputs && Array.isArray(func.inputs)
                    ? func.inputs.map((i: ABIInput) => i.type || '').join(',')
                    : '';
                  const uniqueKey = `${func.name}(${inputTypes})`;
                  
                  return (
                    <option key={uniqueKey} value={uniqueKey}>
                      {func.name}({inputsDisplay})
                    </option>
                  );
                }).filter(Boolean)}
              </select>
            </div>

            {selectedFunction && selectedFunction.inputs && selectedFunction.inputs.length > 0 && (
              <div className={styles.parametersSection}>
                <label className={styles.label}>Arguments</label>
                {selectedFunction.inputs
                  .filter(input => input && input.name && input.type)
                  .map((input, index) => (
                    <div key={input.name || index} className={styles.parameterGroup}>
                      <label className={styles.parameterLabel}>
                        {input.type} {input.name}
                      </label>
                      {renderParameterInput(input)}
                    </div>
                  ))
                }
              </div>
            )}

            {selectedFunction && (
              <div className={styles.generatedInfo}>
                <div className={styles.generatedLabel}>Generated from ABI:</div>
                <div className={styles.generatedValue}>
                  <strong>Signature:</strong> {signature}
                </div>
                <div className={styles.generatedValue}>
                  <strong>Calldata:</strong> {calldata.slice(0, 20)}...
                </div>
              </div>
            )}
          </>
        ) : contractABI ? (
          <div className={styles.noFunctionsMessage}>
            <div className={styles.modeIndicator}>
              <span className={styles.modeLabel}>No state-changing functions available</span>
            </div>
            <p>
              {contractABI.isProxy 
                ? contractABI.proxyType?.includes('Minimal') 
                  ? `This is a minimal proxy contract with no functions in its own ABI. All functionality is delegated to the implementation contract${contractABI.implementationAddress ? ` (${contractABI.implementationAddress.slice(0, 6)}...${contractABI.implementationAddress.slice(-4)})` : ''}. Try entering the implementation address directly, or switch to Advanced mode.`
                  : `This proxy contract only has view/pure functions available${contractABI.implementationAddress ? ', and the implementation contract is not verified on Etherscan' : ''}. Switch to Advanced mode to manually specify the function call.`
                : 'This contract only has view/pure functions. Switch to Advanced mode to manually specify the function call.'
              }
            </p>
          </div>
        ) : target && !isLoadingABI ? (
          <div className={styles.noAbiMessage}>
            <div className={styles.modeIndicator}>
              <span className={styles.modeLabel}>Contract not verified or invalid address</span>
            </div>
            <p>Unable to fetch ABI. Switch to Advanced mode for manual input.</p>
          </div>
        ) : null
      ) : (
        // ADVANCED MODE - Manual input
        <>
          <div className={styles.modeIndicator}>
            <span className={styles.modeLabel}>Advanced Mode: Manual input</span>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Function Signature</label>
            <input
              type="text"
              className={styles.input}
              value={signature}
              onChange={(e) => onUpdate('signature', e.target.value)}
              placeholder="functionName(uint256,address)"
              disabled={disabled}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Calldata</label>
            <input
              type="text"
              className={styles.input}
              value={calldata}
              onChange={(e) => onUpdate('calldata', e.target.value)}
              placeholder="0x..."
              disabled={disabled}
            />
          </div>
        </>
      )}
    </div>
  );
}