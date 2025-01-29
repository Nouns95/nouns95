export interface ProcessResources {
  memory: number;
  cpu: number;
}

export interface Process {
  id: string;
  applicationId: string;
  windowId: string;
  resources: ProcessResources;
  status: 'running' | 'suspended' | 'terminated';
  startTime: number;
  parentProcessId?: string;
}
