import { Test, TestingModule } from '@nestjs/testing';
import { BilinlService } from './bilinl.service';

describe('BilinlService', () => {
  let service: BilinlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BilinlService],
    }).compile();

    service = module.get<BilinlService>(BilinlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
