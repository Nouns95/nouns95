export interface ValidSignature {
  sig: string;
  signer: {
    id: string;
    nounsRepresented: { id: string }[];
  };
  expirationTimestamp: Date;
  status: 'valid' | 'expired' | 'canceled' | 'redundant';
  nounsCount: number;
}

export const formatSignatureForContract = (signature: ValidSignature) => {
  return {
    sig: signature.sig,
    signer: signature.signer.id,
    expirationTimestamp: Math.floor(signature.expirationTimestamp.getTime() / 1000), // Convert to unix timestamp
  };
};
