import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BilinlService } from './bilinl.service';

@Processor('bilinl')
export class BilinlProcessor extends WorkerHost {
  private readonly logger = new Logger(BilinlProcessor.name);

  constructor(private readonly bilinlService: BilinlService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      if (job.name === 'callback') {
        await this.bilinlService.handleCallback(job.data);
      } else if (job.name === '覆盖次数计划任务') {
        await this.bilinlService.覆盖次数计划任务(job.data);
      } else {
        this.logger.warn(`Unknown job name: ${job.name}`);
        return;
      }
    } catch (error) {
      this.logger.error('Job processing failed', error);
      throw error; // Rethrow the error to mark the job as failed
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed: ${job.id}`, error.stack);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job completed: ${job.id}`);
  }
}
