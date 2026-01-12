
import { GoogleGenAI, Type } from "@google/genai";
import { GceResource, AnalysisResult } from "../types";
import { safeParseJSON } from "../utils/jsonUtils";

// Helper to ensure we have an API key before making requests
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please select a key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeResourceBatch = async (
  resources: GceResource[]
): Promise<AnalysisResult[]> => {
  const ai = getClient();
  const model = "gemini-3-flash-preview";

  // Limit batch size slightly to ensure quality attention to detail
  const resourceSummaries = resources.map(r => ({
    id: r.id,
    name: r.name,
    zone: r.zone,
    currentLabels: r.labels,
    type: r.type,
    machineType: r.machineType
  }));

  const prompt = `
    You are a Principal Cloud Architect specializing in FinOps and Governance.
    Analyze the provided GCP resources (JSON) deeply. 
    Your goal is to infer the logical purpose of each resource to apply standardized governance labels.
    
    Guidelines:
    1. **Deconstruct Names**: "prod-web-01" implies Environment=Production, App=Web. "dev-db-analytics" implies Environment=Development, App=Database, Workload=Analytics.
    2. **Infer Department**: 
       - 'web', 'app', 'api' -> Engineering
       - 'db', 'redis', 'store' -> Data
       - 'finance', 'ledger', 'payroll' -> Finance
    3. **Cost Center**: Assign a cost center code (e.g., CC-100X) consistent with the inferred department.
    4. **Criticality**: If the name contains "prod" or "main", it is High Criticality. If "dev", "test", or "tmp", it is Low.
    
    Output strictly a JSON array matching the schema. The 'reasoning' field should be a short, sharp professional justification for the chosen labels (e.g. "Name 'x' implies Y workload in Z environment.").
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: JSON.stringify(resourceSummaries) + "\n\n" + prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              resourceId: { type: Type.STRING },
              suggestedLabels: {
                type: Type.OBJECT,
                properties: {
                  environment: { type: Type.STRING },
                  application: { type: Type.STRING },
                  department: { type: Type.STRING },
                  "cost-center": { type: Type.STRING },
                  "criticality": { type: Type.STRING },
                },
              },
              reasoning: { type: Type.STRING },
            },
            required: ["resourceId", "suggestedLabels", "reasoning"],
          },
        },
      },
    });

    return safeParseJSON<AnalysisResult[]>(response.text) || [];
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateComplianceReport = async (
  resources: GceResource[]
): Promise<string> => {
  const ai = getClient();
  
  const unlabeledCount = resources.filter(r => Object.keys(r.labels).length === 0).length;
  const labeledCount = resources.length - unlabeledCount;
  const spotCount = resources.filter(r => r.provisioningModel === 'SPOT').length;
  
  const prompt = `
    You are a FinOps Consultant writing a Compliance & Governance Report.
    
    **Inventory Stats**:
    - Total Resources: ${resources.length}
    - Fully Labeled: ${labeledCount}
    - Unlabeled (Risk): ${unlabeledCount}
    - Spot Instances: ${spotCount}
    
    **Instructions**:
    Write a detailed, structured report in Markdown format.
    
    Structure:
    1. **## Executive Summary**: A high-level assessment of the environment's health.
    2. **## Risk Analysis**:
       - *Shadow IT*: Identify if naming conventions are inconsistent.
       - *Cost Risks*: Discuss the ratio of On-Demand vs Spot instances for production-like names.
       - *Tagging*: Impact of unlabeled resources on cost allocation.
    3. **## Strategic Recommendations**:
       - Bulleted list of immediate actions.
       - Policy suggestions (e.g., "Enforce 'Cost Center' tag at creation").
    
    **Formatting**:
    - Use **bold** for emphasis.
    - Use *italics* for nuance.
    - Use lists for readability.
    - Keep it professional, insightful, and actionable. Avoid generic fluff.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "Report generation failed.";
};

export const generateDashboardBrief = async (metrics: {
  stoppedCount: number;
  stoppedDiskGb: number;
  publicIpCount: number;
  unlabeledCount: number;
}): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Analyze these cloud infrastructure metrics:
    - Stopped (Idle) VMs: ${metrics.stoppedCount}
    - Wasted Storage (Attached to Stopped VMs): ${metrics.stoppedDiskGb} GB
    - Public Internet Exposure: ${metrics.publicIpCount} resources
    - Governance Gaps (Unlabeled): ${metrics.unlabeledCount} resources

    Role: Senior Cloud Security & FinOps Advisor.
    Task: Provide a concise executive brief (Markdown) with 2 distinct sections.

    1. **💰 Cost Optimization**: 
       - Highlight the wasted storage cost (Assume standard persistent disk is ~$0.04/GB/mo). 
       - Recommend lifecycle actions (e.g., Snapshot & Delete).
    
    2. **🛡️ Security Posture**:
       - Assess the public IP exposure risk.
       - Suggest specific Google Cloud mitigation services (e.g., Cloud Armor, Identity-Aware Proxy, Cloud NAT) to replace public IPs.

    Keep it brief, high-impact, and professional. Use bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Brief generation failed.";
  } catch (e) {
    console.error("Dashboard Brief Gen Failed:", e);
    return "";
  }
};

export const analyzeNamingPatterns = async (
  resourceNames: string[]
): Promise<{ 
  advice: string; 
  suggestedMode: 'PATTERN' | 'REGEX'; 
  config?: any 
}> => {
  const ai = getClient();
  const sample = resourceNames.slice(0, 20); // Analyze sample to save tokens

  const prompt = `
    Analyze these cloud resource names: ${JSON.stringify(sample)}.
    Your task is to identify the naming convention and configuration for a labeling parser.

    1. **Delimiter Detection**: 
       Check if the names use a consistent separator character (e.g., hyphen '-', underscore '_', dot '.', slash '/').
       If a common delimiter is found, set 'suggestedMode' to 'PATTERN' and return the 'delimiter' character in the config.

    2. **Complex Patterns**:
       If names are mixed case (e.g., "prodWeb01") or lack separators, set 'suggestedMode' to 'REGEX' and provide a regex pattern.

    3. **Mappings**:
       Suggest logical mappings for the parts (e.g., position 0 is 'env', position 1 is 'app').

    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING, description: "Short, strategic advice on how to extract tags." },
            suggestedMode: { type: Type.STRING, enum: ["PATTERN", "REGEX"] },
            config: { 
              type: Type.OBJECT,
              description: "Configuration object. For PATTERN: delimiter (string), mappings (array).",
              properties: {
                delimiter: { type: Type.STRING, description: "The separator character found (e.g. '-', '_', '.')." },
                mappings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { position: { type: Type.INTEGER }, key: { type: Type.STRING } } } },
                regex: { type: Type.STRING },
                groups: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { index: { type: Type.INTEGER }, key: { type: Type.STRING } } } }
              }
            }
          },
          required: ["advice", "suggestedMode", "config"]
        }
      }
    });
    
    return safeParseJSON(response.text) || { advice: "Could not automatically analyze patterns.", suggestedMode: 'PATTERN' };
  } catch (e) {
    console.error("Pattern analysis failed:", e);
    return { advice: "Could not automatically analyze patterns. Please configure manually.", suggestedMode: 'PATTERN' };
  }
};
