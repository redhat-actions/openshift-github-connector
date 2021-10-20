import { GitHubFileLocation } from "../types/gh-types";

export const GITHUB_WORKFLOWS_DIR = `.github/workflows/`;
const RHA_ORG = "redhat-actions";

// must match the file basenames in common/workflows/templates/
export type WorkflowIDs = "starter" | "login" | "code_scan" | "self_hosted";

export interface WorkflowInfo {
  id: WorkflowIDs,
  name: string,
  description: string,
  defaultFilename: string,
  templateFileLocation: GitHubFileLocation,
  requiresClusterSecrets: boolean,
  disabled?: boolean,
}

export const WORKFLOW_INFOS: { [key in WorkflowIDs]: WorkflowInfo } = {
  starter: {
    id: "starter",
    defaultFilename: "openshift",
    name: "OpenShift Application Starter",
    description: "Log in to OpenShift, build a container image, "
      + "push the container image, and deploy an app from the new image.",
    requiresClusterSecrets: true,
    templateFileLocation: {
      owner: "actions",
      repo: "starter-workflows",
      path: "deployments/openshift.yml",
      ref: "main",
    },
  },
  login: {
    id: "login",
    defaultFilename: "openshift_login",
    name: "OpenShift Login",
    description: "Log in to OpenShift.",
    requiresClusterSecrets: true,
    templateFileLocation: {
      owner: RHA_ORG,
      repo: "oc-login",
      path: `${GITHUB_WORKFLOWS_DIR}template.yml`,
      ref: "main",
    },
  },
  code_scan: {
    id: "code_scan",
    defaultFilename: "crda_scan",
    name: "Scan with CodeReady Dependency Analytics",
    description: "Perform security scans on the repository's dependencies.",
    requiresClusterSecrets: false,
    templateFileLocation: {
      owner: RHA_ORG,
      repo: "crda",
      path: `${GITHUB_WORKFLOWS_DIR}template.yml`,
      ref: "main",
    },
  },
  self_hosted: {
    id: "self_hosted",
    defaultFilename: "openshift_self_hosted",
    name: "Self-Hosted Runner",
    description: "Launch a self-hosted runner on OpenShift and run a workflow job on the new runner.",
    requiresClusterSecrets: true,
    disabled: true,
    templateFileLocation: {
      owner: RHA_ORG,
      repo: "openshift-actions-runner-installer",
      path: `${GITHUB_WORKFLOWS_DIR}template.yml`,
      ref: "main",
    },
  },
};

export type WorkflowConfig = StarterWorkflowConfig | LoginWorkflowConfig | CRDAWorkflowConfig;

interface BaseWorkflowConfig {
  id: WorkflowIDs,
  isConfigured: boolean,
  // file: WorkflowFile,
}

export interface StarterWorkflowConfig extends BaseWorkflowConfig {
  id: "starter",
  namespace?: string,
  imageRegistryId?: string,
  port?: string,
  containerfileLocation: string,
}

export interface LoginWorkflowConfig extends BaseWorkflowConfig {
  id: "login",
  namespace?: string,
  // insecureSkipTlsVerify: boolean,
}

export interface CRDAWorkflowConfig extends BaseWorkflowConfig {
  id: "code_scan",

  auth: {
    type: "crda" | "snyk",
    token: string,
  },
  projectType: {
    type: "go" | "java" | "node.js" | "python",
    setupVersion: string,
  } | null,
  manifestDirectory: string,
  // failOn: "error" | "warning" | "never",
  scanPRs: boolean,
}
