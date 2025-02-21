import { Process, ProcessResources } from '../../../../shell/Window/domain/models/Process';
import { EventBus } from '@/src/utils/EventBus';

export class ProcessManager {
  private static instance: ProcessManager;
  private processes: { [id: string]: Process } = {};
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = new EventBus();
  }

  public static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  public createProcess(params: {
    applicationId: string;
    windowId: string;
    parentProcessId?: string;
  }): Process {
    const id = `process-${Date.now()}`;
    const process: Process = {
      id,
      applicationId: params.applicationId,
      windowId: params.windowId,
      resources: {
        memory: 0,
        cpu: 0,
      },
      status: 'running',
      startTime: Date.now(),
      parentProcessId: params.parentProcessId,
    };

    this.processes[id] = process;
    this.eventBus.emit('processCreated', { processId: id });
    return process;
  }

  public terminateProcess(id: string): void {
    const process = this.processes[id];
    if (!process) return;

    process.status = 'terminated';
    this.eventBus.emit('processTerminated', { processId: id });

    // Terminate child processes
    Object.values(this.processes)
      .filter(p => p.parentProcessId === id)
      .forEach(p => this.terminateProcess(p.id));

    delete this.processes[id];
  }

  public suspendProcess(id: string): void {
    const process = this.processes[id];
    if (!process) return;

    process.status = 'suspended';
    this.eventBus.emit('processSuspended', { processId: id });
  }

  public resumeProcess(id: string): void {
    const process = this.processes[id];
    if (!process) return;

    process.status = 'running';
    this.eventBus.emit('processResumed', { processId: id });
  }

  public updateResources(id: string, resources: ProcessResources): void {
    const process = this.processes[id];
    if (!process) return;

    process.resources = resources;
    this.eventBus.emit('processResourcesUpdated', { processId: id, resources });
  }

  public getProcess(id: string): Process | null {
    return this.processes[id] || null;
  }

  public getAllProcesses(): Process[] {
    return Object.values(this.processes);
  }

  public getProcessesByApplication(applicationId: string): Process[] {
    return Object.values(this.processes)
      .filter(process => process.applicationId === applicationId);
  }

  public getProcessByWindow(windowId: string): Process | null {
    return Object.values(this.processes)
      .find(process => process.windowId === windowId) || null;
  }
}
