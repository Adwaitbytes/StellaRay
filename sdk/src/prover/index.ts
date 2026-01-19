/**
 * Prover Client
 *
 * Communicates with the ZK prover service to generate Groth16 proofs.
 */

import type { Groth16Proof, ZkLoginPublicInputs, ZkProofWithInputs } from "../types";

/**
 * Re-export types
 */
export type { Groth16Proof, ZkLoginPublicInputs };
export type ZkProof = ZkProofWithInputs;
export type PublicInputs = ZkLoginPublicInputs;

/**
 * Prover service configuration
 */
export interface ProverConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * Proof generation request
 */
export interface ProofRequest {
  jwt: string;
  salt: string;
  ephPkHigh: string;
  ephPkLow: string;
  maxEpoch: number;
  randomness: string;
  keyClaimName: string;
}

/**
 * Prover service response
 */
interface ProverResponse {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

/**
 * Client for ZK prover service
 */
export class ProverClient {
  private config: ProverConfig;

  constructor(config: ProverConfig) {
    this.config = {
      timeout: 60000, // 60 second default
      ...config,
    };
  }

  /**
   * Generate a zkLogin proof
   */
  async generateProof(request: ProofRequest): Promise<ZkProofWithInputs> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/prove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jwt: request.jwt,
          salt: request.salt,
          eph_pk_high: request.ephPkHigh,
          eph_pk_low: request.ephPkLow,
          max_epoch: request.maxEpoch,
          randomness: request.randomness,
          key_claim_name: request.keyClaimName,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Prover service error: ${error}`);
      }

      const data: ProverResponse = await response.json();
      return this.parseProverResponse(data);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Verify a proof locally (for testing)
   */
  async verifyProof(proof: ZkProofWithInputs): Promise<boolean> {
    const response = await fetch(`${this.config.baseUrl}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proof: this.formatProofForProver(proof.proof),
        public_inputs: this.formatPublicInputsForProver(proof.publicInputs),
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  }

  /**
   * Get prover service health
   */
  async health(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.config.baseUrl}/health`);

    if (!response.ok) {
      throw new Error("Prover service unhealthy");
    }

    return response.json();
  }

  /**
   * Parse prover response into SDK format
   */
  private parseProverResponse(response: ProverResponse): ZkProofWithInputs {
    const { proof, publicSignals } = response;

    return {
      proof: {
        a: {
          x: proof.pi_a[0],
          y: proof.pi_a[1],
        },
        b: {
          x: [proof.pi_b[0][0], proof.pi_b[0][1]],
          y: [proof.pi_b[1][0], proof.pi_b[1][1]],
        },
        c: {
          x: proof.pi_c[0],
          y: proof.pi_c[1],
        },
      },
      publicInputs: {
        ephPkHash: publicSignals[0],
        maxEpoch: parseInt(publicSignals[1], 10),
        addressSeed: publicSignals[2],
        issHash: publicSignals[3],
        jwkModulusHash: publicSignals[4],
      },
    };
  }

  /**
   * Format proof for prover service
   */
  private formatProofForProver(proof: Groth16Proof): object {
    return {
      pi_a: [proof.a.x, proof.a.y, "1"],
      pi_b: [
        [proof.b.x[0], proof.b.x[1]],
        [proof.b.y[0], proof.b.y[1]],
        ["1", "0"],
      ],
      pi_c: [proof.c.x, proof.c.y, "1"],
    };
  }

  /**
   * Format public inputs for prover
   */
  private formatPublicInputsForProver(inputs: ZkLoginPublicInputs): string[] {
    return [
      inputs.ephPkHash,
      inputs.maxEpoch.toString(),
      inputs.addressSeed,
      inputs.issHash,
      inputs.jwkModulusHash,
    ];
  }
}
